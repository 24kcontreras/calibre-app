import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { taller_id, email, monto = 24990 } = body;

        const apiKey = process.env.FLOW_API_KEY;
        const secretKey = process.env.FLOW_SECRET_KEY;
        const flowUrl = process.env.NEXT_PUBLIC_FLOW_URL;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        if (!apiKey || !secretKey || !flowUrl) {
            console.error("Faltan las variables de entorno de Flow");
            return NextResponse.json({ error: 'Faltan variables de entorno en Vercel' }, { status: 500 });
        }

        const commerceOrder = `ORD-${taller_id}-${Date.now()}`;
        const params: Record<string, string> = {
            apiKey: apiKey.trim(), // Le puse .trim() por si se te coló un espacio al copiar
            commerceOrder: commerceOrder,
            subject: 'Suscripción Mensual CALIBRE OS',
            currency: 'CLP',
            amount: monto.toString(),
            email: email,
            paymentMethod: '9',
            urlConfirmation: `${baseUrl}/api/flow/webhook`,
            urlReturn: `${baseUrl}/taller?pago=exitoso`, 
            optional: JSON.stringify({ taller_id })
        };

        const keys = Object.keys(params).sort();
        let toSign = '';
        for (const key of keys) {
            toSign += `${key}${params[key]}`;
        }

        const signature = crypto.createHmac('sha256', secretKey.trim()).update(toSign).digest('hex');
        params.s = signature;

        const formData = new URLSearchParams(params);
        const response = await fetch(`${flowUrl}/payment/create`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.url && data.token) {
            return NextResponse.json({ url: `${data.url}?token=${data.token}` });
        } else {
            console.error("Error de Flow:", data);
            // 🔥 AQUÍ LE DEVOLVEMOS AL FRONTEND EL MENSAJE EXACTO DE FLOW
            return NextResponse.json({ error: `Flow dice: ${data.message || 'Error desconocido'}` }, { status: 400 });
        }

    } catch (error) {
        console.error("Error en servidor de pagos:", error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}