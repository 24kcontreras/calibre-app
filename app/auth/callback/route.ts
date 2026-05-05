import { createClient } from '../../../utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 🛡️ El sistema leerá el parámetro "next" que inyectamos en el correo.
  // Si por alguna razón el correo no lo trae, podemos dejarlo en /login por seguridad
  const next = searchParams.get('next') ?? '/taller'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirigir a la ruta solicitada (en este caso /actualizar-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si el código es inválido o expiró
  return NextResponse.redirect(`${origin}/login?error=enlace_expirado`)
}