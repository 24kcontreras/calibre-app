import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Dejamos que el Frontend (app/taller/page.tsx y useTaller.ts) 
  // maneje la seguridad para evitar el bucle infinito de redirecciones.
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Ignoramos rutas estáticas, imágenes y MUY IMPORTANTE: las rutas de /api
    // para que las calificaciones de clientes y pagos de Flow no se bloqueen.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}