'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('') // Estado para manejar el error visual

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('') // Limpiar errores previos
    
    try {
        const { error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        })
        
        if (error) {
            setErrorMsg('Credenciales incorrectas. Verifica tu correo y contraseña.')
            setLoading(false)
            return
        }
        
        // 🟢 CORREGIDO: Redirigir a /taller
        window.location.href = '/taller'
    } catch (err) {
        setErrorMsg('Ocurrió un error inesperado al iniciar sesión.')
        setLoading(false)
    }
  }

  // 🛠️ Función de Google con "Modo Debug" y Try/Catch
  const handleGoogleLogin = async () => {
    try {
        setErrorMsg('')
        console.log("🟢 1. Iniciando petición a Supabase para Google OAuth...")
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // 🟢 CORREGIDO: Redirigir a /taller
                redirectTo: `${window.location.origin}/taller`
            }
        })

        console.log("🟢 2. Respuesta de Supabase:", data)

        if (error) {
            console.error("🔴 Error de Supabase:", error.message)
            setErrorMsg(`Error de Google: ${error.message}`)
        }
    } catch (err) {
        console.error("🔴 Error crítico al conectar:", err)
        setErrorMsg('El sistema bloqueó la conexión con Google. Revisa la consola.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
        
      {/* 🟢 Efectos de luz de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-slate-800 shadow-2xl relative z-10">
        
        {/* Logo Unificado */}
        <div className="flex flex-col items-center justify-center mb-10">
            <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 mb-4 shadow-inner">
                <Wrench className="text-emerald-500" size={32} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Calibre<span className="text-emerald-500">.</span></h1>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Acceso Operadores</h2>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
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
            </div>

            {/* 🔴 Mensaje de Error Visual */}
            {errorMsg && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-bold animate-pulse">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <button 
                disabled={loading}
                type="submit" 
                className="w-full mt-2 group flex items-center justify-center gap-3 bg-emerald-600 text-slate-950 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
            >
                {loading ? 'Autenticando...' : <>Acceder al Sistema <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-4 my-8">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">O continúa con</span>
            <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {/* 🔥 Botón de Google Único y Funcional */}
        <button 
            onClick={handleGoogleLogin}
            type="button" 
            className="w-full py-4 px-4 flex items-center justify-center gap-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-black text-slate-300 uppercase tracking-widest hover:border-slate-600 hover:text-slate-100 hover:bg-slate-900 transition-all"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Acceder con Google
        </button>

        {/* 🟢 "Crear cuenta" rediseñado */}
        <div className="mt-8 text-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">
                ¿Nuevo operador?
            </span>
            <Link href="/registro" className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest border-b border-emerald-500/30 hover:border-emerald-400 pb-0.5 transition-all">
                Crear cuenta aquí
            </Link>
        </div>

      </div>
    </main>
  )
}