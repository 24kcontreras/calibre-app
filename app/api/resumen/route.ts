import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 🔥 LA SOLUCIÓN AL PROBLEMA: Le damos al servidor hasta 60 segundos de paciencia
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { vehiculo, items, falla } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("❌ ERROR: La API Key no está cargada.");
      throw new Error("API Key faltante");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        // 🔥 Bajamos la sensibilidad para que no bloquee textos sobre "choques" o "roturas" mecánicas
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
        ]
    });

    const repuestos = items && items.length > 0 
        ? items.map((i: any) => `- ${i.descripcion} ($${i.precio})`).join('\n')
        : 'Revisión general sin repuestos adicionales.';

    const prompt = `Actúa como el jefe de taller mecánico experto de "CALIBRE". Redacta un informe técnico final y profesional para el cliente sobre el servicio realizado a su vehículo.
    
    Vehículo: ${vehiculo?.marca} ${vehiculo?.modelo}.
    Problema original: "${falla}".
    Trabajos realizados:
    ${repuestos}
    
    Escribe el informe estructurado exactamente en estos 3 párrafos separados por un doble salto de línea:
    1. Un párrafo explicando técnicamente qué trabajos y repuestos se aplicaron.
    2. Un párrafo analizando las posibles causas de la falla original ("${falla}").
    3. Un párrafo con recomendaciones para evitar que vuelva a suceder.
    
    REGLAS ESTRICTAS:
    - Redacta en español chileno formal y técnico.
    - PROHIBIDO usar formato Markdown. NO uses asteriscos (*), ni negritas, ni líneas (---).
    - PROHIBIDO repetir el nombre del vehículo o la patente al inicio del texto.
    - SE BREVE Y CONCISO. Ve al grano para que la generación sea rápida.`;

    const result = await model.generateContent(prompt);
    const resumenGenerado = result.response.text().replace(/\*/g, '').replace(/#/g, '').trim();

    return NextResponse.json({ resumen: resumenGenerado });
    
  } catch (error: any) {
    console.error("❌ ERROR REAL DE LA IA (RESUMEN):", error.message || error);
    return NextResponse.json({ 
        resumen: "Se realizó la revisión técnica del vehículo por el problema reportado. Los trabajos y repuestos aplicados se encuentran detallados en el presente documento. Se recomienda cumplir rigurosamente con el plan de mantenciones del fabricante para prolongar la vida útil de los componentes." 
    });
  }
}