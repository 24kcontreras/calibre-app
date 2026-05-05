import { createClient } from '../../../../utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/taller'
  const type = searchParams.get('type') // 🔑 Capturamos si es 'recovery'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 🛡️ BLOQUEO DE BYPASS: 
      // Si el evento es recuperación de contraseña, forzamos ir a cambiar la clave
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/actualizar-password`)
      }

      // Si es un login normal o registro, va a la pizarra
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // En caso de error, regresamos al login con un mensaje
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}