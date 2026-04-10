import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 🔥 Ahora recibimos el "tipo" de consulta (scanner o manual)
    const { codigo, vehiculo, tipo } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("API Key faltante en .env.local");
    }

    let prompt = "";

    if (tipo === 'scanner') {
      prompt = `Eres el Asistente Técnico de CALIBRE. Vehículo: ${vehiculo || 'No especificado'}. 
      Código de falla o síntoma: ${codigo}.
      Ve directo al grano. Formatea tu respuesta ESTRICTAMENTE con HTML simple (usa <b>para negritas</b> y <br> para saltos de línea. ESTÁ PROHIBIDO USAR MARKDOWN O ASTERISCOS **).
      Estructura exactamente así:
      <b>🔍 DIAGNÓSTICO:</b><br>(explicación)<br><br><b>⚠️ CAUSAS COMUNES:</b><br>- (causa)<br><br><b>🛠️ PASOS DE REVISIÓN:</b><br>1. (paso)`;
    } else {
      // 🔥 EL NUEVO CEREBRO DEL MANUAL (Equilibrado entre utilidad y seguridad)
      prompt = `Eres el Asistente Técnico de CALIBRE. Vehículo: ${vehiculo || 'No especificado'}. 
      Consulta técnica del mecánico: ${codigo}.
      
      REGLAS DE RESPUESTA:
      1. Si te piden un dato numérico (capacidad de aceite, torques, etc.) y ese vehículo tiene múltiples motorizaciones posibles, NO ocultes la información. Entrega los datos para los motores más comunes de ese año y modelo (Ej: "Para el motor 1.5L (1NZ-FE) son 3.7 Litros. Para el 1.3L (2NZ-FE) son 3.2 Litros").
      2. Agrega siempre una nota breve indicando al mecánico que verifique el código de motor grabado en el bloque antes de proceder.
      3. SOLO niégate a dar el dato si es información confidencial inexistente en manuales públicos.
      4. Formatea tu respuesta ESTRICTAMENTE con HTML simple (usa <b>para negritas</b> y <br> para saltos de línea. ESTÁ PROHIBIDO USAR MARKDOWN O ASTERISCOS **).
      5. Termina con un <b>💡 TIP TÉCNICO:</b> breve.`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error API: ${response.status}`);
    }

    const data = await response.json();
    const texto = data.candidates[0].content.parts[0].text;
    
    return NextResponse.json({ resultado: texto });
    
  } catch (error: any) {
    console.error("❌ ERROR IA:", error);
    return NextResponse.json({ 
        resultado: "<b>⚠️ Error de conexión</b><br>No pudimos procesar la consulta técnica. Revisa tu conexión a internet o el estado de la API."
    });
  }
}