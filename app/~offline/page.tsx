'use client'
import React from 'react'
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'

export default function OfflinePage() {
    const reintentar = () => {
        if (typeof window !== 'undefined') {
            window.location.reload()
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            
            {/* Ícono animado sutilmente */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
                <div className="bg-slate-900 border-2 border-red-500/50 p-6 rounded-3xl relative z-10 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                    <WifiOff size={64} className="text-red-500" />
                </div>
            </div>

            {/* Mensajes de Alerta */}
            <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tighter mb-2">
                Conexión Perdida
            </h1>
            <p className="text-slate-400 font-bold max-w-sm mb-8 text-sm">
                No hay señal de internet en el taller. CALIBRE ha entrado en <span className="text-amber-500 uppercase tracking-widest text-[10px]">Modo Búnker</span>.
            </p>

            {/* Tarjeta de información */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 w-full max-w-sm flex items-start gap-4 text-left">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">¿Qué significa esto?</h3>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                        Puedes seguir viendo las pantallas que ya habías abierto, pero no podrás generar nuevas cotizaciones ni guardar cambios hasta que vuelva la red.
                    </p>
                </div>
            </div>

            {/* Botón de Reintento */}
            <button 
                onClick={reintentar}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-4 px-8 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-3"
            >
                <RefreshCw size={16} /> Reintentar Conexión
            </button>

        </div>
    )
}