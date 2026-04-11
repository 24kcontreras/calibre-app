import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Si algo falla, redirigimos a una ruta de error o al login
  const next = searchParams.get('next') ?? '/taller' 

  if (code) {
    const cookieStore = cookies()
    
    // Iniciamos el cliente de servidor de Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Intercambiamos el código de Google por la sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 🔥 Si todo sale bien, ahora sí lo mandamos a la Pizarra (Taller)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si no hay código o hubo error, lo devolvemos al inicio con un aviso
  return NextResponse.redirect(`${origin}/?error=auth-failed`)
}