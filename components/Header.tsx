import { Activity, ScanLine, Settings, Megaphone } from 'lucide-react'
import Image from 'next/image' // 🔥 IMPORTAMOS EL COMPONENTE DE IMAGEN

interface HeaderProps {
  nombreTaller: string;
  cajaTotal: number;
  onOpenTelemetria: () => void;
  onOpenScanner: () => void;
  onOpenCaja: () => void;
  onOpenConfiguracion: () => void;
  onOpenMarketing: () => void;
}

export default function Header({
  nombreTaller,
  cajaTotal,
  onOpenTelemetria,
  onOpenScanner,
  onOpenCaja,
  onOpenConfiguracion,
  onOpenMarketing
}: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-slate-800 pb-8 w-full gap-6 relative z-10">
      <div className="flex items-center gap-4 group cursor-default w-full md:w-auto justify-center md:justify-start">
        <div className="text-center md:text-left">
          {/* Nombre del Taller del Cliente */}
          <h1 className="text-3xl md:text-4xl font-black text-slate-100 tracking-tighter uppercase leading-none">
              {nombreTaller}
          </h1>
          
          {/* 🔥 SECCIÓN "POWERED BY" RESTAURADA Y MEJORADA */}
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            
            <div className="flex items-center gap-1.5 opacity-80">
                <p className="text-[10px] font-black text-emerald-500 tracking-[0.3em] uppercase">
                    POWERED BY CALIBRE
                </p>
                <Image 
                    src="/logo-calibre.png" 
                    alt="Icono Calibre" 
                    width={18} 
                    height={18} 
                    className="object-contain"
                />
            </div>
          </div>

      <div className="flex gap-4 items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button onClick={onOpenTelemetria} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-slate-950 px-6 py-4 rounded-[32px] font-black transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-[1.02] whitespace-nowrap">
            <Activity size={20} />
            <span className="hidden md:block uppercase tracking-widest text-[10px]">Telemetría</span>
          </button>

          <button onClick={onOpenScanner} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-4 rounded-[32px] font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02] whitespace-nowrap">
            <ScanLine size={20} />
            <span className="hidden md:block uppercase tracking-widest text-[10px]">Herramientas IA</span>
          </button>

          <button onClick={onOpenMarketing} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-[32px] font-black transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:scale-[1.02] whitespace-nowrap">
            <Megaphone size={20} />
            <span className="hidden md:block uppercase tracking-widest text-[10px]">Campañas</span>
          </button>

          <button onClick={onOpenCaja} className="bg-slate-900/50 backdrop-blur-sm px-6 py-4 rounded-[32px] shadow-2xl border border-slate-700/50 text-right flex-1 md:flex-none hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group whitespace-nowrap min-w-[120px] max-w-[200px]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Flujo de Caja</p>
              <p className="text-xl md:text-2xl font-black text-emerald-400 truncate w-full" title={`$${cajaTotal.toLocaleString('es-CL')}`}>
                  ${cajaTotal.toLocaleString('es-CL')}
              </p>
          </button>

          <button onClick={onOpenConfiguracion} className="flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 px-6 py-4 rounded-[32px] transition-all whitespace-nowrap min-w-[80px]">
             <Settings size={20} />
             <span className="text-[8px] font-black uppercase mt-1">Ajustes</span>
          </button>
      </div>
    </header>
  )
}