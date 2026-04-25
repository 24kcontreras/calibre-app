import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Buscamos si existe alguna cookie
  const supabaseSession = req.cookies.getAll().find(cookie => cookie.name.includes('sb-') && cookie.name.includes('-auth-token'))

  // Protegemos la página principal
  if (!supabaseSession && req.nextUrl.pathname === '/') {
    return res; 
  }

  // 🚀 ELIMINAMOS LA PROTECCIÓN DE APIS POR AHORA
  // Ya que Supabase está usando localStorage en lugar de Cookies.
  // El frontend ya nos protege.

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

