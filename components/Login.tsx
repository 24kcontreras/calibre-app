'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, Lock, Mail, ArrowRight, Loader2, UserSquare, ShieldAlert, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

export default function Login() {
  const searchParams = useSearchParams();
  
  // Detectar si viene de un Código QR (?t=ID_TALLER&u=USUARIO)
  const qrTaller = searchParams.get('t');
  const qrUser = searchParams.get('u');

  // Si viene del QR, abrimos la pestaña de operario por defecto
  const [modo, setModo] = useState<'admin' | 'operario'>(qrTaller ? 'operario' : 'admin');
  
  // Estados para Administrador (Dueño)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Estados para Operario (Mecánico)
  const [tallerId, setTallerId] = useState(qrTaller || '')
  const [usuarioMecanico, setUsuarioMecanico] = useState(qrUser || '')
  const [pin, setPin] = useState('')

  const [loading, setLoading] = useState(false)

  // 1. INICIO DE SESIÓN PARA EL DUEÑO (ADMIN)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading('Accediendo al panel de control...')

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('¡Bienvenido a Calibre OS!', { id: toastId })
      window.location.href = '/taller' // Recargamos para que los hooks detecten la sesión
    } catch (error: any) {
      toast.error('Credenciales incorrectas.', { id: toastId })
      setLoading(false)
    }
  }

  // 2. INICIO DE SESIÓN PARA MECÁNICOS (OPERARIOS)
  const handleOperarioLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading('Verificando Gafete Inteligente...')

    try {
      // Llamamos a nuestro Guardia Virtual en Supabase (RPC)
      const { data, error } = await supabase.rpc('iniciar_sesion_mecanico', {
        p_taller_id: tallerId,
        p_usuario: usuarioMecanico.toLowerCase().trim(),
        p_pin: pin
      });

      if (error) throw error;

      // Si todo sale bien, guardamos su pase de acceso en el celular (Local Storage)
      localStorage.setItem('calibre_mecanico_session', JSON.stringify(data));
      
      toast.success(`¡A la trinchera, ${data.nombre}!`, { id: toastId })
      
      // Lo enviamos a la pizarra operativa
      window.location.href = '/taller' 
      
    } catch (error: any) {
      toast.error('PIN incorrecto o acceso revocado.', { id: toastId })
      setLoading(false)
      setPin('') // Le borramos el PIN para que intente de nuevo
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Fondos abstractos Cyberpunk */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[40px] shadow-2xl p-8 relative z-10">
        
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Image src="/logo-calibre.png" alt="Logo" width={32} height={32} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-100">Calibre<span className="text-emerald-500">.</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Sistema Operativo Automotriz</p>
        </div>

        {/* SWITCH DE MODO (ADMIN / OPERARIO) */}
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
            
            {/* Animación del fondo del switch */}
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-xl transition-transform duration-300 shadow-md ${modo === 'admin' ? 'translate-x-0' : 'translate-x-[calc(100%+4px)]'}`}></div>
        </div>

        {/* FORMULARIO DUEÑO */}
        {modo === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
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
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Ingresar al Panel <ArrowRight size={18} /></>}
                </button>
            </form>
        )}

        {/* FORMULARIO OPERARIO (MECÁNICO) */}
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

                <button type="submit" disabled={loading || pin.length !== 4} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Entrar al Taller <Wrench size={18} /></>}
                </button>
            </form>
        )}
      </div>
      
      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 z-10">Seguridad Nivel Bancario</p>
    </div>
  )
}