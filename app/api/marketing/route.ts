import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { borrador } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("API Key faltante");

    // El Prompt para el Experto en Marketing Automotriz
    const prompt = `Eres un experto en marketing para talleres mecánicos.
    Tu tarea es tomar este borrador mal escrito y convertirlo en un mensaje de WhatsApp persuasivo, amable y vendedor.
    
    BORRADOR DEL MECÁNICO: "${borrador}"

    REGLAS ESTRICTAS:
    CONTEXTO CHILENO: Si ves números sueltos grandes (ej: 30000, 25000) o la palabra "lucas", asume SIEMPRE que es el PRECIO de la oferta en Pesos Chilenos, NO es el kilometraje. Formatea el precio correctamente (ej: $30.000).
    1. Mantén un tono cercano y profesional. Usa emojis sin exagerar.
    2. El mensaje debe ser corto (máximo 3 párrafos cortos).
    3. DEBES incluir exactamente estas etiquetas donde correspondan (el sistema las reemplazará automáticamente después):
       - [NOMBRE] para saludar al cliente.
       - [VEHICULO] para mencionar su auto.
       - [TALLER] para mencionar el nombre del taller.
    4. Termina siempre con un llamado a la acción claro (Ej: "¿Te reservo una hora?", "¿Agendamos para esta semana?").
    5. Solo devuelve el texto del mensaje, nada más.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
        throw new Error(`Error API: ${response.status}`);
    }

    const data = await response.json();
    const textoMejorado = data.candidates[0].content.parts[0].text.trim();

    return NextResponse.json({ resultado: textoMejorado });
    
  } catch (error: any) {
    console.error("❌ ERROR MARKETING IA:", error);
    return NextResponse.json({ error: "No pudimos mejorar el texto." }, { status: 500 });
  }
}