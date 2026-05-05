import { createClient } from '../../../../utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 🛡️ El sistema leerá el parámetro "next" que inyectamos.
  const next = searchParams.get('next') ?? '/taller'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirige a donde debe (ej: /actualizar-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=enlace_expirado`)
}