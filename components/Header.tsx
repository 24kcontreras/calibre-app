import { Settings, BarChart3, ScanLine, Megaphone, Wrench } from 'lucide-react';

export default function Header({
    nombreTaller,
    cajaTotal,
    onOpenTelemetria,
    onOpenScanner,
    onOpenConfiguracion,
    onOpenMarketing
}: any) {
    return (
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center rounded-3xl mb-6 shadow-xl relative z-10">
            {/* Logo/Nombre */}
            <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Wrench className="text-emerald-500" size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-100 tracking-tighter uppercase">{nombreTaller}</h1>
                    <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">Calibre OS</p>
                </div>
            </div>

            {/* Botones y Métricas */}
            <div className="flex items-center gap-3">
                
                {/* Botón de Caja Rápida (Abre Telemetría) */}
                <button 
                    onClick={onOpenTelemetria} 
                    className="hidden md:flex items-center gap-2 bg-slate-950/50 border border-slate-800 px-4 py-2.5 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-900/20 transition-all group"
                    title="Ver Flujo de Caja"
                >
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Ingresos</span>
                    <span className="text-emerald-400 font-black tracking-wider">${cajaTotal.toLocaleString('es-CL')}</span>
                </button>

                {/* Panel de Herramientas */}
                <div className="flex items-center bg-slate-950/50 rounded-2xl border border-slate-800 p-1">
                    <button onClick={onOpenScanner} className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all" title="Escáner IA">
                        <ScanLine size={18} />
                    </button>
                    <button onClick={onOpenTelemetria} className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all" title="Dashboard Financiero">
                        <BarChart3 size={18} />
                    </button>
                    <button onClick={onOpenMarketing} className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all" title="Campañas Marketing">
                        <Megaphone size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-800 mx-1"></div>
                    <button onClick={onOpenConfiguracion} className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all" title="Configuración">
                        <Settings size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}