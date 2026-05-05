'use client'
import React, { useState, Suspense } from 'react'
import { Wrench, Lock, Mail, ArrowRight, Loader2, UserSquare, ShieldAlert, QrCode, Phone } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Importamos las acciones actualizadas
import { loginAdminAction, registerAdminAction, loginOperarioAction, resetPasswordAction } from '@/app/login/actions'

function LoginContent() {
  const searchParams = useSearchParams();
  const qrTaller = searchParams.get('t');
  const qrUser = searchParams.get('u');

  const [modo, setModo] = useState<'admin' | 'operario'>(qrTaller ? 'operario' : 'admin');
  
  // Estados para Administrador (Dueño)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreTallerForm, setNombreTallerForm] = useState('')
  const [telefonoForm, setTelefonoForm] = useState('')
  
  const [isRegister, setIsRegister] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false) // 👈 Nuevo flujo
  
  // Estados para Operario (Mecánico)
  const [tallerId, setTallerId] = useState(qrTaller || '')
  const [usuarioMecanico, setUsuarioMecanico] = useState(qrUser || '')
  const [pin, setPin] = useState('')

  const [loading, setLoading] = useState(false)

  // 1. Manejo de Login y Registro
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading(isRegister ? 'Creando cuenta de Taller...' : 'Accediendo...')

    try {
      if (isRegister) {
        // Registro con Metadata
        await registerAdminAction(email, password, { 
          nombreTaller: nombreTallerForm, 
          telefono: telefonoForm 
        })
        toast.success("¡Registro exitoso! Revisa tu correo.", { id: toastId })
        setIsRegister(false)
      } else {
        await loginAdminAction(email, password)
        toast.success('¡Bienvenido!', { id: toastId })
        window.location.href = '/taller' 
      }
    } catch (error: any) {
      toast.error(error.message || 'Error en las credenciales.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // 2. Manejo de Recuperación
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error("Ingresa tu correo primero")
    setLoading(true)
    const toastId = toast.loading('Enviando instrucciones...')
    try {
      await resetPasswordAction(email)
      toast.success("Correo enviado. Revisa tu bandeja de entrada.", { id: toastId })
      setIsForgotPassword(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el correo.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/api/auth/callback` }
        })
        if (error) throw error;
    } catch (error: any) {
        toast.error(error.message || "Error al conectar con Google")
    }
  }

  const handleOperarioLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await loginOperarioAction(tallerId, usuarioMecanico, pin)
      localStorage.setItem('calibre_mecanico_session', JSON.stringify(response.data));
      toast.success(`¡Hola, ${response.data.nombre}!`)
      window.location.href = '/taller' 
    } catch (error: any) {
      toast.error(error.message)
      setPin('') 
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Fondos Blur */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[40px] shadow-2xl p-8 relative z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <Image src="/logo-calibre.png" alt="Logo" width={32} height={32} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-100">Calibre<span className="text-emerald-500">.</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Sistema Operativo Automotriz</p>
        </div>

        {/* Switcher Admin/Operario (Solo se muestra si no está recuperando clave) */}
        {!isForgotPassword && (
          <div className="flex bg-slate-950 p-1 rounded-2xl mb-8 border border-slate-800 relative">
              <button onClick={() => setModo('admin')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all z-10 ${modo === 'admin' ? 'text-white' : 'text-slate-500'}`}>Shield Dueño</button>
              <button onClick={() => setModo('operario')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all z-10 ${modo === 'operario' ? 'text-white' : 'text-slate-500'}`}>Wrench Operario</button>
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-xl transition-transform duration-300 ${modo === 'admin' ? 'translate-x-0' : 'translate-x-[calc(100%+4px)]'}`}></div>
          </div>
        )}

        {modo === 'admin' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              
              {isForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <p className="text-xs text-slate-400 font-bold text-center mb-4">Ingresa tu correo para enviarte un link de restauración.</p>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:border-emerald-500 outline-none" placeholder="taller@ejemplo.com" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-slate-950 font-black text-xs uppercase py-4 rounded-2xl">Enviar Enlace</button>
                  <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-[10px] text-slate-500 hover:text-emerald-400 font-bold uppercase text-center mt-2">Volver al Login</button>
                </form>
              ) : (
                <form onSubmit={handleAdminLogin} className="space-y-5">
                  {isRegister && (
                    <>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre del Taller</label>
                          <input type="text" required value={nombreTallerForm} onChange={(e) => setNombreTallerForm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:border-emerald-500 outline-none" placeholder="Ej: Garage 24K" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp / Teléfono</label>
                          <input type="tel" required value={telefonoForm} onChange={(e) => setTelefonoForm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:border-emerald-500 outline-none" placeholder="+56 9 ..." />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:border-emerald-500 outline-none" placeholder="taller@ejemplo.com" />
                  </div>
                  <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña</label>
                        {!isRegister && <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[9px] text-emerald-500 font-black">¿Olvidaste tu clave?</button>}
                      </div>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:border-emerald-500 outline-none" placeholder="••••••••" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-slate-950 font-black text-xs uppercase py-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-all">
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : (isRegister ? 'Crear mi Taller' : 'Ingresar al Panel')}
                  </button>
                </form>
              )}

              {!isForgotPassword && (
                <div className="mt-8 text-center">
                  <button onClick={() => setIsRegister(!isRegister)} className="text-[10px] text-slate-500 hover:text-emerald-400 font-bold uppercase transition-colors">
                    {isRegister ? '¿Ya tienes taller? Inicia Sesión' : '¿Nuevo taller? Regístrate aquí'}
                  </button>
                </div>
              )}
            </div>
        )}

        {modo === 'operario' && (
            <form onSubmit={handleOperarioLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID Taller</label>
                    <input type="text" required value={tallerId} onChange={(e) => setTallerId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:border-blue-500 outline-none" placeholder="Ej: GARAGE-X" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usuario</label>
                    <input type="text" required value={usuarioMecanico} onChange={(e) => setUsuarioMecanico(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:border-blue-500 outline-none" placeholder="pedro_mec" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center block">PIN</label>
                    <input type="password" maxLength={4} required value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 text-center text-2xl font-black text-blue-400 tracking-[1em]" placeholder="••••" />
                </div>
                <button type="submit" disabled={loading || pin.length < 4} className="w-full bg-blue-600 text-white font-black text-xs uppercase py-4 rounded-2xl">Entrar al Taller</button>
            </form>
        )}
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}>
      <LoginContent />
    </Suspense>
  )
}