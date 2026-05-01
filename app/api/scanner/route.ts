import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
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
      // 🔥 EL NUEVO CEREBRO DEL MANUAL (Reglas de Torque y MANN Filter inyectadas)
      prompt = `Eres el Asistente Técnico de CALIBRE. Vehículo: ${vehiculo || 'No especificado'}. 
      Consulta técnica del mecánico: ${codigo}.
      
      REGLAS DE RESPUESTA ESTRICTAS:
      1. REGLA DE TORQUES (Nm): Si la consulta es sobre aprietes o torques, entrega SIEMPRE los valores priorizando la medida en Newton-Metro (Nm), asumiendo que el taller utilizará los pernos antiguos/reutilizados. Si el manual exige grados obligatorios, menciónalo como advertencia secundaria.
      2. REGLA DE FILTROS (MANN): Si te piden buscar, cruzar o identificar un código de repuesto/filtro, utiliza SIEMPRE como estándar principal el catálogo de MANN FILTER. Si no existe una equivalencia exacta en MANN, entrega alternativas de marcas premium reconocidas (Mahle, Bosch, HK, etc.) indicando por qué.
      3. MOTORES MÚLTIPLES: Si te piden un dato numérico (capacidad, medidas) y ese vehículo tiene múltiples motorizaciones posibles, NO ocultes la información. Entrega los datos para los motores más comunes de ese año y modelo detallando el código de motor.
      4. FORMATO VISUAL: Formatea tu respuesta ESTRICTAMENTE con HTML simple (usa <b>para negritas</b> y <br> para saltos de línea. ESTÁ PROHIBIDO USAR MARKDOWN O ASTERISCOS **).
      5. CIERRE: Termina siempre con un <b>💡 TIP TÉCNICO:</b> breve relacionado a la consulta.`;
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
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ ERROR IA:", msg);
    return NextResponse.json({ 
        resultado: "<b>⚠️ Error de conexión</b><br>No pudimos procesar la consulta técnica. Revisa tu conexión a internet o el estado de la API."
    });
  }
}