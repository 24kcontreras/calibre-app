import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 🔒 PROTECCIÓN DE RUTAS:
  if (!user && request.nextUrl.pathname.startsWith('/taller')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/taller', request.url))
  }

  return supabaseResponse
}

export const config = {
  // Añadimos /actualizar-password a la lista de ignorados del middleware para que no te redirija
  matcher: ['/((?!_next/static|actualizar-password|api/auth|api/flow|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)'],
}