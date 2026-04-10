import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("API Key faltante");
    if (!imageBase64) throw new Error("No se envió imagen");

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // 🔥 EL PROMPT: Patente + Reconocimiento de Marca
    const prompt = `Analiza la imagen frontal o trasera de este vehículo.
    Extrae la patente chilena (6 caracteres), la marca (fíjate en los logos o letras) y el modelo (si es visible).
    
    Devuelve SOLO un objeto JSON válido con esta estructura exacta, sin texto adicional, sin formato markdown y sin bloques de código:
    {"patente": "CHTD85", "marca": "SUZUKI", "modelo": "SWIFT"}
    
    REGLAS:
    - La patente debe tener 6 caracteres alfanuméricos sin guiones. Si no la ves, usa "".
    - La marca y el modelo ponlos en MAYÚSCULAS. Si no logras identificarlos, usa "".`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                ]
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error API OCR: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const textoCrudo = data.candidates[0].content.parts[0].text.trim();
    
    // 🔥 FILTRO A PRUEBA DE BALAS: Extraemos solo el JSON por si la IA manda texto extra
    let textoLimpio = textoCrudo;
    const inicio = textoCrudo.indexOf('{');
    const fin = textoCrudo.lastIndexOf('}');
    
    if (inicio !== -1 && fin !== -1) {
        textoLimpio = textoCrudo.substring(inicio, fin + 1);
    }
    
    // Convertimos el string filtrado a JSON
    const datosVehiculo = JSON.parse(textoLimpio);

    return NextResponse.json(datosVehiculo);
    
  } catch (error: any) {
    console.error("❌ ERROR OCR:", error);
    return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 500 });
  }
}