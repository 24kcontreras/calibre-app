'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState(false)

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    // 🔥 Llama a Supabase para enviar el link de reseteo, dirigido a la nueva pantalla
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`, 
    })
    
    if (error) {
        setErrorMsg('Error al enviar el correo. Verifica que esté bien escrito.')
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
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 text-center">Recuperación de Acceso</h2>
        </div>

        {successMsg ? (
            <div className="text-center space-y-4 py-6">
                <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                <h3 className="text-xl font-black uppercase tracking-tighter">¡Correo Enviado!</h3>
                <p className="text-sm font-bold text-slate-400">
                    Revisa la bandeja de entrada de <span className="text-emerald-400">{email}</span> y sigue las instrucciones para cambiar tu contraseña.
                </p>
                <Link href="/" className="inline-block mt-6 bg-slate-800 text-slate-300 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">
                    Volver al Inicio
                </Link>
            </div>
        ) : (
            <form onSubmit={handleRecuperar} className="space-y-5">
                <p className="text-xs font-bold text-slate-400 text-center leading-relaxed pb-2">
                    Ingresa el correo asociado a tu taller y te enviaremos un enlace mágico para restablecer tu contraseña.
                </p>

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
                    {loading ? 'Enviando enlace...' : 'Enviar enlace mágico'}
                </button>

                <div className="pt-4 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">
                        <ArrowLeft size={12} /> Volver al login
                    </Link>
                </div>
            </form>
        )}

      </div>
    </main>
  )
}