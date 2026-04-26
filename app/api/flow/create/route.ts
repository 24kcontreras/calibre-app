import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Recibimos el ID del taller y su correo
        const { taller_id, email, monto = 24990 } = body; // $24.990 por defecto

        const apiKey = process.env.FLOW_API_KEY;
        const secretKey = process.env.FLOW_SECRET_KEY;
        const flowUrl = process.env.NEXT_PUBLIC_FLOW_URL;
        
        // En desarrollo local será localhost:3000, en Vercel será tu dominio real
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        if (!apiKey || !secretKey || !flowUrl) {
            console.error("Faltan las variables de entorno de Flow");
            return NextResponse.json({ error: 'Error de configuración de pagos' }, { status: 500 });
        }

        // 1. Preparamos los datos exigidos por Flow
        const commerceOrder = `ORD-${taller_id}-${Date.now()}`;
        const params: Record<string, string> = {
            apiKey: apiKey,
            commerceOrder: commerceOrder,
            subject: 'Suscripción Mensual CALIBRE OS',
            currency: 'CLP',
            amount: monto.toString(),
            email: email,
            paymentMethod: '9', // 9 = Todos los medios de pago disponibles
            urlConfirmation: `${baseUrl}/api/flow/webhook`, // A dónde avisa Flow cuando el pago es exitoso
            urlReturn: `${baseUrl}/?pago=exitoso`, // A dónde vuelve el cliente tras pagar
            optional: JSON.stringify({ taller_id }) // Ocultamos el ID del taller para saber a quién desbloquear luego
        };

        // 2. Seguridad Flow: Concatenar parámetros en orden alfabético
        const keys = Object.keys(params).sort();
        let toSign = '';
        for (const key of keys) {
            toSign += `${key}${params[key]}`;
        }

        // 3. Crear firma criptográfica HMAC SHA256
        const signature = crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
        params.s = signature;

        // 4. Enviar petición a Flow
        const formData = new URLSearchParams(params);
        const response = await fetch(`${flowUrl}/payment/create`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        // 5. Si todo sale bien, Flow nos devuelve un Token y una URL. Los juntamos y se los mandamos al botón del usuario.
        if (data.url && data.token) {
            return NextResponse.json({ url: `${data.url}?token=${data.token}` });
        } else {
            console.error("Error de Flow:", data);
            return NextResponse.json({ error: 'Flow rechazó la creación del pago' }, { status: 400 });
        }

    } catch (error) {
        console.error("Error en servidor de pagos:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}