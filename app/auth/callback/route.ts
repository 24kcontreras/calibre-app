import { createClient } from '../../../utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 🔥 Leemos exactamente hacia dónde debe ir. Si no dice nada, va a /taller
  const next = searchParams.get('next') ?? '/taller'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 🛡️ El sistema ahora respeta el destino dictado por el "next"
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si falla la validación del código
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}