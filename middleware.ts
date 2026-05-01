import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // 1. Verificamos si es el Dueño (Cookie de Supabase)
  const supabaseSession = req.cookies.getAll().find(cookie => cookie.name.includes('sb-') && cookie.name.includes('-auth-token'))
  
  // 2. Verificamos si es un Mecánico (Nuestra cookie personalizada)
  const mecanicoSession = req.cookies.get('calibre_mecanico_auth')

  // 3. Si intenta entrar a /taller y NO tiene ninguna de las dos cookies... ¡Lo rebotamos al login!
  if (req.nextUrl.pathname.startsWith('/taller')) {
      if (!supabaseSession && !mecanicoSession) {
          return NextResponse.redirect(new URL('/', req.url))
      }
  }

  // 4. Si va a la pantalla de login ('/') pero YA ESTÁ logueado, lo metemos directo al taller
  if (req.nextUrl.pathname === '/') {
      if (supabaseSession || mecanicoSession) {
          return NextResponse.redirect(new URL('/taller', req.url))
      }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/taller/:path*'],
}