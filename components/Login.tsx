'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wrench, ArrowRight, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
    })
    
    if (error) {
        toast.error("Credenciales incorrectas o error de conexión.")
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
        
      {/* 🟢 Efectos de luz de fondo (Igual que en el Landing) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-slate-800 shadow-2xl relative z-10">
        
        {/* Logo Unificado */}
        <div className="flex flex-col items-center justify-center mb-10">
            <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 mb-4 shadow-inner">
                <Wrench className="text-emerald-500" size={32} />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter">Calibre<span className="text-emerald-500">.</span></span>
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

            <button 
                disabled={loading}
                type="submit" 
                className="w-full mt-4 group flex items-center justify-center gap-3 bg-emerald-600 text-slate-950 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
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

        {/* Botones Sociales (Visuales) */}
        <div className="flex gap-4">
            <button className="flex-1 py-3 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-600 hover:text-slate-200 transition-colors">
                G Google
            </button>
            <button className="flex-1 py-3 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-600 hover:text-slate-200 transition-colors">
                F Facebook
            </button>
        </div>

        <div className="mt-8 text-center">
            <button className="text-[10px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">
                ¿Nuevo operador? Crear cuenta
            </button>
        </div>

      </div>
    </main>
  )
}