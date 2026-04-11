'use client'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, BookOpen } from 'lucide-react'

export default function SoportePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-600/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-500 transition-colors mb-12 group uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver
        </Link>

        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Centro de <span className="text-emerald-500">Soporte</span></h1>
        <p className="text-slate-500 font-medium mb-12">¿Tienes problemas en el taller? Estamos aquí para ayudarte a que el motor no se detenga.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Opción Correo */}
          <a href="mailto:soporte@calibreapp.cl" className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] hover:border-emerald-500/50 transition-all hover:scale-[1.02] group text-left">
            <Mail className="text-emerald-500 mb-4" size={24} />
            <h3 className="font-black uppercase tracking-widest text-xs mb-2">Canal Oficial</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Envíanos un correo a <strong>soporte@calibreapp.cl</strong>. Respondemos en menos de 2 horas.</p>
          </a>

          {/* Opción WhatsApp */}
          <a href="https://wa.me/569XXXXXXXX" target="_blank" className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] hover:border-emerald-500/50 transition-all hover:scale-[1.02] group text-left">
            <MessageSquare className="text-emerald-500 mb-4" size={24} />
            <h3 className="font-black uppercase tracking-widest text-xs mb-2">Urgencias</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Chat directo vía WhatsApp para problemas críticos en la Pizarra Activa.</p>
          </a>

        </div>

        <div className="mt-12 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center justify-center gap-4">
            <BookOpen className="text-emerald-500" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Próximamente: Manual de Usuario y Videotutoriales</span>
        </div>
      </div>
    </main>
  )
}