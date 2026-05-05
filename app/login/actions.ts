'use server'

import { createClient } from '../../utils/supabase/server'
import { cookies } from 'next/headers'

export async function loginAdminAction(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return { success: true }
}

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

// 🔥 CONFIGURACIÓN DE RECUPERACIÓN BLINDADA
export async function resetPasswordAction(email: string) {
  const supabase = await createClient()
  
  // En Vercel usa tu URL real, en local usa localhost
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // 🛡️ FORZAMOS que el link del correo pase por el callback y LUEGO a actualizar clave
    redirectTo: `${siteUrl}/auth/callback?next=/actualizar-password`,
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

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
  return { success: true }
}