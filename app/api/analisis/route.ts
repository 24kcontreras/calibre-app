import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 🔥 Le damos al servidor hasta 60 segundos de paciencia
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { falla, vehiculo } = await req.json();
    
    // 1. Cargamos la API Key igual que en tu código de resumen
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("❌ ERROR: La API Key no está cargada.");
      throw new Error("API Key faltante");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 2. Usamos gemini-2.5-flash con la sensibilidad apagada (Idéntico a tu resumen)
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
    });

    const prompt = `Actúa como un Ingeniero Mecánico Automotriz Experto. 
    Vehículo: ${vehiculo?.marca || 'Desconocida'} ${vehiculo?.modelo || 'Desconocido'} ${vehiculo?.anho || ''}.
    Falla reportada por el cliente: "${falla}".
    
    Haz un análisis técnico para el mecánico a cargo. Incluye:
    1. Las 3 posibles causas más comunes de este síntoma en este vehículo específico.
    2. Recomendaciones de pruebas de diagnóstico (qué medir, qué sensores revisar).
    3. Precauciones o fallas crónicas conocidas de este modelo que podrían estar relacionadas.
    
    Devuelve la respuesta en formato HTML limpio usando etiquetas <h3>, <p>, <ul>, <li> y <strong>. No uses Markdown ni bloques de código. Mantenlo directo y técnico.`;

    const result = await model.generateContent(prompt);
    const texto = result.response.text().replace(/```html|```/g, '');
    
    return NextResponse.json({ resultado: texto });
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ ERROR REAL DE LA IA (ANÁLISIS):", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}