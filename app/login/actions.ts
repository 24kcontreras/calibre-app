'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function loginAdminAction(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return { success: true }
}

// 🔥 RESTAURADO: Registro con Metadata del Taller
export async function registerAdminAction(
  email: string, 
  password: string, 
  metadata: { nombreTaller: string, telefono: string }
) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        nombre_taller: metadata.nombreTaller,
        telefono_taller: metadata.telefono
      }
    }
  })
  if (error) throw new Error(error.message)
  return { success: true }
}

// 🔥 NUEVO: Acción para recuperar contraseña
export async function resetPasswordAction(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Redirige al usuario a una página donde pueda poner su nueva clave
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/actualizar-password`,
  })
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function loginOperarioAction(tallerId: string, usuario: string, pin: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('iniciar_sesion_mecanico', {
    p_taller_id: tallerId,
    p_usuario: usuario.toLowerCase().trim(),
    p_pin: pin
  });

  if (error) throw new Error('PIN incorrecto o acceso revocado.')

  const cookieStore = await cookies()
  cookieStore.set('calibre_mecanico_auth', 'true', { 
    path: '/', 
    maxAge: 86400,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  })

  return { success: true, data }
}