'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, ArrowRight, Mail, Lock, AlertCircle, Building2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function Registro() {
  const [taller, setTaller] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState(false)

  // 🔥 LA LLAVE MAESTRA: Validador Regex B2B
  const validarContrasena = (pass: string) => {
      // 8+ caracteres, 1 mayúscula, 1 número, 1 símbolo especial
      const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:;<>,.?~\\/-]).{8,}$/;
      return regex.test(pass);
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    // 1. Validación de coincidencia
    if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.')
        setLoading(false)
        return
    }

    // 2. 🔥 Validación de Seguridad B2B
    if (!validarContrasena(password)) {
        setErrorMsg('La contraseña no cumple el formato corporativo. Revisa los requisitos.')
        setLoading(false)
        return
    }

    // 3. Creación en Supabase
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                nombre_taller: taller // Guardamos el nombre del taller en la base de datos
            }
        }
    })
    
    if (error) {
        setErrorMsg('Error al crear la cuenta. Es posible que el correo ya esté registrado.')
    } else {
        setSuccessMsg(true)
    }
    
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
        
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-slate-800 shadow-2xl relative z-10">
        
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 mb-4 shadow-inner">
                <Wrench className="text-emerald-500" size={32} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Calibre<span className="text-emerald-500">.</span></h1>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Alta de Nuevo Taller</h2>
        </div>

        {successMsg ? (
            <div className="text-center space-y-4 py-8">
                <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                <h3 className="text-xl font-black uppercase tracking-tighter">¡Cuenta Creada!</h3>
                <p className="text-sm font-bold text-slate-400">Revisa tu correo electrónico para verificar tu cuenta y poder ingresar al sistema.</p>
                <Link href="/taller" className="inline-block mt-4 bg-emerald-600 text-slate-950 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all">
                    Ir al Login
                </Link>
            </div>
        ) : (
            <form onSubmit={handleRegistro} className="space-y-4">
                <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text"
                        value={taller}
                        onChange={(e) => setTaller(e.target.value)}
                        required
                        placeholder="Nombre de tu Taller" 
                        className="w-full p-4 pl-12 rounded-2xl border border-slate-800 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors font-bold"
                    />
                </div>

                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Email Corporativo" 
                        className="w-full p-4 pl-12 rounded-2xl border border-slate-800 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors font-bold"
                    />
                </div>
                
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Contraseña" 
                        className="w-full p-4 pl-12 rounded-2xl border border-slate-800 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors font-bold"
                    />
                    {/* 🔥 UX: Guía visual de requisitos */}
                    <p className="text-[9px] text-slate-500 mt-2 ml-2 font-bold uppercase tracking-wider">
                        Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo (!@#$)
                    </p>
                </div>

                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirmar Contraseña" 
                        className="w-full p-4 pl-12 rounded-2xl border border-slate-800 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors font-bold"
                    />
                </div>

                {/* 🔴 Mensaje de Error Visual (Alineado para textos largos) */}
                {errorMsg && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-bold animate-pulse">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                )}

                <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full mt-2 group flex items-center justify-center gap-3 bg-emerald-600 text-slate-950 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                    {loading ? 'Creando cuenta...' : <>Comenzar ahora <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
            </form>
        )}

        {!successMsg && (
            <div className="mt-8 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">
                    ¿Ya tienes cuenta?
                </span>
                <Link href="/taller" className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest border-b border-emerald-500/30 hover:border-emerald-400 pb-0.5 transition-all">
                    Inicia sesión aquí
                </Link>
            </div>
        )}

      </div>
    </main>
  )
}