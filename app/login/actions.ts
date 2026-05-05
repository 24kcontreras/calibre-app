'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function loginAdminAction(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function registerAdminAction(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })
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

  // 🔥 Creamos la Cookie a nivel de SERVIDOR de forma ultra-segura
  const cookieStore = await cookies()
  cookieStore.set('calibre_mecanico_auth', 'true', { 
    path: '/', 
    maxAge: 86400,
    httpOnly: true, // Invisible para el navegador (no se puede hackear por consola)
    secure: process.env.NODE_ENV === 'production'
  })

  return { success: true, data }
}