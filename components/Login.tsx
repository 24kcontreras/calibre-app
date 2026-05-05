'use client'
import React, { useState, Suspense } from 'react'
import { Wrench, Lock, Mail, ArrowRight, Loader2, UserSquare, ShieldAlert, QrCode } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase' // El cliente del navegador

// 🔥 IMPORTAMOS TUS NUEVOS SERVER ACTIONS
import { loginAdminAction, registerAdminAction, loginOperarioAction } from '@/app/login/actions'

function LoginContent() {
  const searchParams = useSearchParams();
  
  const qrTaller = searchParams.get('t');
  const qrUser = searchParams.get('u');

  const [modo, setModo] = useState<'admin' | 'operario'>(qrTaller ? 'operario' : 'admin');
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  
  const [tallerId, setTallerId] = useState(qrTaller || '')
  const [usuarioMecanico, setUsuarioMecanico] = useState(qrUser || '')
  const [pin, setPin] = useState('')

  const [loading, setLoading] = useState(false)

  // 1. INICIO DE SESIÓN DUEÑO (AHORA SEGURO CON SSR)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading(isRegister ? 'Creando cuenta de Taller...' : 'Accediendo al panel de control...')

    try {
      if (isRegister) {
        await registerAdminAction(email, password)
        toast.success("Registro exitoso. Revisa tu correo.", { id: toastId })
      } else {
        await loginAdminAction(email, password)
        toast.success('¡Bienvenido a Calibre OS!', { id: toastId })
        window.location.href = '/taller' 
      }
    } catch (error: any) {
      toast.error(error.message || 'Credenciales incorrectas.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // LÓGICA DE GOOGLE (Apuntando a la ruta de validación del servidor)
  const handleGoogleLogin = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Ahora apuntamos a un callback del backend para crear la cookie
                redirectTo: `${window.location.origin}/api/auth/callback`
            }
        })
        if (error) throw error;
    } catch (error: any) {
        toast.error(error.message || "Error al conectar con Google")
    }
  }

  // 2. INICIO DE SESIÓN OPERARIOS (AHORA SEGURO CON SSR)
  const handleOperarioLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading('Verificando Gafete Inteligente...')

    try {
      // Llamamos al Backend en Node.js, ya no lo hacemos en el navegador
      const response = await loginOperarioAction(tallerId, usuarioMecanico, pin)

      // Guardamos la info del mecánico para el frontend
      localStorage.setItem('calibre_mecanico_session', JSON.stringify(response.data));
      
      toast.success(`¡A la trinchera, ${response.data.nombre}!`, { id: toastId })
      window.location.href = '/taller' 
      
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
      setPin('') 
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc' } }} />

      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[40px] shadow-2xl p-8 relative z-10">
        
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Image src="/logo-calibre.png" alt="Logo" width={32} height={32} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-100">Calibre<span className="text-emerald-500">.</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Sistema Operativo Automotriz</p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-2xl mb-8 border border-slate-800 relative">
            <button 
                type="button"
                onClick={() => setModo('admin')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 z-10 ${modo === 'admin' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <ShieldAlert size={14} /> Dueño
            </button>
            <button 
                type="button"
                onClick={() => setModo('operario')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 z-10 ${modo === 'operario' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Wrench size={14} /> Operario
            </button>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-xl transition-transform duration-300 shadow-md ${modo === 'admin' ? 'translate-x-0' : 'translate-x-[calc(100%+4px)]'}`}></div>
        </div>

        {modo === 'admin' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico</label>
                      <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-200 focus:border-emerald-500 outline-none transition-colors" placeholder="taller@ejemplo.com" />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                      <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-200 focus:border-emerald-500 outline-none transition-colors" placeholder="••••••••" />
                      </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 hover:scale-[1.02]">
                      {loading ? <Loader2 className="animate-spin" size={18} /> : (isRegister ? 'Crear Cuenta' : <>Ingresar al Panel <ArrowRight size={18} /></>)}
                  </button>
              </form>

              <div className="my-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">O continuar con</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              <button 
                onClick={handleGoogleLogin} 
                type="button" 
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-3.5 rounded-2xl text-xs transition-all flex justify-center items-center gap-3 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Iniciar sesión con Google
              </button>

              <div className="mt-8 text-center">
                <button onClick={() => setIsRegister(!isRegister)} className="text-[10px] text-slate-500 hover:text-emerald-400 font-bold uppercase tracking-wider transition-colors">
                  {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
              </div>
            </div>
        )}

        {modo === 'operario' && (
            <form onSubmit={handleOperarioLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                {qrUser && qrTaller ? (
                    <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-2xl flex items-center gap-4 mb-2">
                        <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-500">
                            <QrCode size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Gafete Escaneado</p>
                            <p className="text-sm font-bold text-slate-200">Usuario: @{usuarioMecanico}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID del Taller</label>
                            <input type="text" required value={tallerId} onChange={(e) => setTallerId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold text-slate-200 focus:border-blue-500 outline-none transition-colors" placeholder="Ej: GARAGE-24K" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Usuario</label>
                            <div className="relative">
                                <UserSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                <input type="text" required value={usuarioMecanico} onChange={(e) => setUsuarioMecanico(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-200 focus:border-blue-500 outline-none transition-colors lowercase" placeholder="Ej: pedro88" />
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PIN de Acceso</label>
                    <input type="password" required maxLength={4} minLength={4} pattern="\d{4}" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-center tracking-[1em] text-2xl font-black text-blue-400 focus:border-blue-500 outline-none transition-colors" placeholder="••••" />
                </div>

                <button type="submit" disabled={loading || pin.length !== 4} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50 hover:scale-[1.02]">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Entrar al Taller <Wrench size={18} /></>}
                </button>
            </form>
        )}
      </div>
      
      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 z-10">Seguridad Nivel Bancario</p>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
      <LoginContent />
    </Suspense>
  )
}