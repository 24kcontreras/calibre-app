import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 🔥 CAPTURAMOS EL TIPO DE EVENTO (recovery, signup, etc)
  const next = searchParams.get('next') ?? '/taller'
  const type = searchParams.get('type') // Supabase envía el tipo aquí

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 🛡️ PARCHE DE SEGURIDAD CRÍTICO:
      // Si el link es de recuperación de contraseña, forzamos la ruta de actualización
      // y NO dejamos que pase a la pizarra general.
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/actualizar-password`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, al login con error
  return NextResponse.redirect(`${origin}/login?error=oauth`)
}