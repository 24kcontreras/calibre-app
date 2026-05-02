'use client'
import { BarChart3, ScanLine, Users, Mail, Settings, Box } from 'lucide-react'
import Link from 'next/link'

export default function Header({ 
  nombreTaller,
  logoUrl, // 🔥 Agregamos el prop para recibir la imagen
  cajaTotal, 
  onOpenTelemetria, 
  onOpenCRM, 
  onOpenScanner, 
  onOpenMarketing, 
  onOpenConfiguracion, 
  mecanicoActivo 
}: any) {
  return (
    <header className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl p-3 md:p-4 rounded-[24px] md:rounded-[32px] border border-slate-700/50 mb-6 shadow-2xl relative z-20">
      
      {/* Logo y Nombre del Taller */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* 🔥 LÓGICA DEL LOGO DINÁMICO */}
        {logoUrl ? (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shadow-inner group shrink-0">
                <img src={logoUrl} alt="Logo Taller" className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" />
            </div>
        ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner group transition-transform hover:scale-105 shrink-0">
              <span className="font-black text-emerald-500 text-lg md:text-xl group-hover:text-emerald-400 transition-colors">
                  {nombreTaller ? nombreTaller.substring(0, 1).toUpperCase() : 'C'}
              </span>
            </div>
        )}

        <div className="flex flex-col">
          <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter text-slate-100 leading-none">
            {nombreTaller || 'CALIBRE OS'}
          </h1>
          <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Neural Garage</p>
        </div>
      </div>

      {/* 🔥 HERRAMIENTAS DE COMPUTADOR (Con textos y colores temáticos) */}
      <div className="hidden lg:flex items-center gap-2">
        
        {/* Caja Fuerte (Solo Dueño) */}
        {!mecanicoActivo && (
          <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 mr-2 flex items-center gap-3 shadow-inner">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Caja Mes</span>
            <span className="text-emerald-400 font-black tracking-tighter text-base">${cajaTotal?.toLocaleString('es-CL') || '0'}</span>
          </div>
        )}

        <div className="w-px h-8 bg-slate-800 mx-1"></div>

        {/* 📦 BODEGA (Esmeralda) */}
        <Link 
            href="/taller/inventario" 
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 rounded-xl transition-all border border-slate-800 hover:border-emerald-500/50 shadow-sm" 
        >
            <Box size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Bodega</span>
        </Link>

        {/* 🤖 SCANNER IA (Azul) */}
        <button 
            onClick={onOpenScanner} 
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 rounded-xl transition-all border border-slate-800 hover:border-blue-500/50 shadow-sm"
        >
            <ScanLine size={16} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Scanner</span>
        </button>
        
        {!mecanicoActivo && (
            <>
                {/* 👥 CRM CLIENTES (Índigo) */}
                <button 
                    onClick={onOpenCRM} 
                    className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 rounded-xl transition-all border border-slate-800 hover:border-indigo-500/50 shadow-sm"
                >
                    <Users size={16} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Clientes</span>
                </button>

                {/* 📢 MARKETING (Naranja) */}
                <button 
                    onClick={onOpenMarketing} 
                    className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-orange-500/10 text-slate-300 hover:text-orange-400 rounded-xl transition-all border border-slate-800 hover:border-orange-500/50 shadow-sm"
                >
                    <Mail size={16} className="text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Marketing</span>
                </button>

                {/* 📊 TELEMETRÍA (Púrpura) */}
                <button 
                    onClick={onOpenTelemetria} 
                    className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-purple-500/10 text-slate-300 hover:text-purple-400 rounded-xl transition-all border border-slate-800 hover:border-purple-500/50 shadow-sm"
                >
                    <BarChart3 size={16} className="text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Finanzas</span>
                </button>
            </>
        )}
        
        <div className="w-px h-8 bg-slate-800 mx-1"></div>

        {/* ⚙️ AJUSTES (Gris) */}
        <button 
            onClick={onOpenConfiguracion} 
            className="p-2.5 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all border border-slate-800 hover:border-slate-500 shadow-sm" 
            title="Ajustes del Taller"
        >
            <Settings size={18} />
        </button>
      </div>

      {/* En celular (md:hidden) solo mostramos la caja chica */}
      <div className="lg:hidden flex items-center">
        {!mecanicoActivo && (
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 shadow-inner flex flex-col items-end">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Caja Mes</span>
            <span className="text-emerald-400 font-black text-sm tracking-tighter leading-none">
              ${cajaTotal?.toLocaleString('es-CL') || '0'}
            </span>
          </div>
        )}
      </div>

    </header>
  )
}