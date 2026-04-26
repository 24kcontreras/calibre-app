'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRight, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ActualizarPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState(false)

  // 🔥 VALIDADORES EN TIEMPO REAL (Las mismas reglas estrictas)
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqNum = /\d/.test(password);
  const reqSpec = /[!@#$%^&*()_+{}:;<>,.?~\\/-]/.test(password);
  const passwordValida = reqLength && reqUpper && reqNum && reqSpec;

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.')
        setLoading(false)
        return
    }

    if (!passwordValida) {
        setErrorMsg('La contraseña no cumple el formato corporativo.')
        setLoading(false)
        return
    }

    // 🔥 SUPABASE: Como el usuario entró por el enlace mágico, ya hay sesión. 
    // Ahora simplemente actualizamos la clave de esa sesión.
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    
    if (error) {
        setErrorMsg('Error al actualizar. Es posible que el enlace haya expirado.')
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
            <div className="mb-4">
                <Image 
                    src="/logo-calibre.png" 
                    alt="Logo Calibre" 
                    width={70} 
                    height={70} 
                    priority
                    className="object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Calibre<span className="text-emerald-500">.</span></h1>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 text-center">Crear Nueva Contraseña</h2>
        </div>

        {successMsg ? (
            <div className="text-center space-y-4 py-6">
                <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                <h3 className="text-xl font-black uppercase tracking-tighter">¡Contraseña Actualizada!</h3>
                <p className="text-sm font-bold text-slate-400">
                    Tu nueva clave se ha guardado correctamente en el sistema.
                </p>
                {/* Lo mandamos a la raíz (Pizarra) ya que está autenticado */}
                <Link href="/" className="inline-flex mt-6 bg-emerald-600 text-slate-950 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all">
                    Ir al Dashboard
                </Link>
            </div>
        ) : (
            <form onSubmit={handleActualizar} className="space-y-4">
                
                <div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Nueva Contraseña" 
                            className="w-full p-4 pl-12 rounded-2xl border border-slate-800 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors font-bold"
                        />
                    </div>
                    {/* Validador Visual en Tiempo Real */}
                    <div className="mt-3 ml-2 flex flex-col gap-1.5 text-[9px] font-black uppercase tracking-widest">
                        <span className={`transition-colors duration-300 ${reqLength ? "text-emerald-500" : "text-slate-600"}`}>
                            {reqLength ? "✓" : "○"} Mínimo 8 caracteres
                        </span>
                        <span className={`transition-colors duration-300 ${reqUpper ? "text-emerald-500" : "text-slate-600"}`}>
                            {reqUpper ? "✓" : "○"} 1 Letra Mayúscula
                        </span>
                        <span className={`transition-colors duration-300 ${reqNum ? "text-emerald-500" : "text-slate-600"}`}>
                            {reqNum ? "✓" : "○"} 1 Número
                        </span>
                        <span className={`transition-colors duration-300 ${reqSpec ? "text-emerald-500" : "text-slate-600"}`}>
                            {reqSpec ? "✓" : "○"} 1 Símbolo (!@#$...)
                        </span>
                    </div>
                </div>

                <div className="relative pt-2">
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

                {errorMsg && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-bold animate-pulse">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                )}

                <button 
                    disabled={loading || !passwordValida}
                    type="submit" 
                    className="w-full mt-4 group flex items-center justify-center gap-3 bg-emerald-600 text-slate-950 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                    {loading ? 'Guardando...' : <>Guardar Contraseña <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
            </form>
        )}

      </div>
    </main>
  )
}