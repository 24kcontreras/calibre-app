import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Usamos el Service Role Key para saltarnos la seguridad RLS temporalmente
// porque Flow no tiene "iniciada la sesión" en nuestro sistema cuando manda el aviso.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const token = formData.get('token') as string;

        if (!token) {
            return NextResponse.json({ error: 'Token no recibido' }, { status: 400 });
        }

        const apiKey = process.env.FLOW_API_KEY!;
        const secretKey = process.env.FLOW_SECRET_KEY!;
        const flowUrl = process.env.NEXT_PUBLIC_FLOW_URL!;

        // 1. Preparar firma para consultar el estado del pago
        const params = { apiKey, token };
        const keys = Object.keys(params).sort();
        let toSign = '';
        for (const key of keys) {
            toSign += `${key}${params[key as keyof typeof params]}`;
        }
        const signature = crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');

        // 2. Consultar a Flow el estado real (para evitar hackeos)
        const urlStatus = `${flowUrl}/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${signature}`;
        const response = await fetch(urlStatus);
        const data = await response.json();

        // 🟢 Status 2 significa PAGADO EXITOSAMENTE
        if (data.status === 2) {
            // Sacamos el ID del taller que metimos escondido en el "optional" en el paso 1
            const optionalData = JSON.parse(data.optional || '{}');
            const tallerId = optionalData.taller_id;

            if (tallerId) {
                // Calculamos la nueva fecha de vencimiento (30 días más desde hoy)
                const nuevaFecha = new Date();
                nuevaFecha.setDate(nuevaFecha.getDate() + 30);

                // 3. ¡Desbloqueamos al Taller en Supabase!
                const { error } = await supabaseAdmin
                    .from('talleres')
                    .update({
                        estado_suscripcion: 'Activa',
                        fecha_vencimiento_suscripcion: nuevaFecha.toISOString()
                    })
                    .eq('id', tallerId);

                if (error) {
                    console.error("Error al actualizar Supabase tras el pago:", error);
                } else {
                    console.log(`✅ Taller ${tallerId} renovado exitosamente por 30 días.`);
                }
            }
        }

        // Flow siempre espera un HTTP 200 de respuesta para saber que recibimos el mensaje
        return NextResponse.json({ status: 'ok' }, { status: 200 });

    } catch (error) {
        console.error("Error en Webhook de Flow:", error);
        return NextResponse.json({ error: 'Error en webhook' }, { status: 500 });
    }
}