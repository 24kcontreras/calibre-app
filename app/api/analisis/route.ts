import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { falla, vehiculo } = await req.json();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    //backticks literales del texto del prompt
    const prompt = `Actúa como un Ingeniero Mecánico Automotriz Experto. 
    Vehículo: ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anho || ''}.
    Falla reportada por el cliente: "${falla}".
    
    Haz un análisis técnico para el mecánico a cargo. Incluye:
    1. Las 3 posibles causas más comunes de este síntoma en este vehículo específico.
    2. Recomendaciones de pruebas de diagnóstico (qué medir, qué sensores revisar).
    3. Precauciones o fallas crónicas conocidas de este modelo que podrían estar relacionadas.
    
    Devuelve la respuesta en formato HTML limpio usando etiquetas <h3>, <p>, <ul>, <li> y <strong>. No uses Markdown ni bloques de código HTML. Mantenlo directo y técnico.`;

    const result = await model.generateContent(prompt);
    const texto = result.response.text().replace(/```html|```/g, '');
    
    return NextResponse.json({ resultado: texto });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}