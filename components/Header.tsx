import { Settings, BarChart3, ScanLine, Megaphone, Wrench, Wallet } from 'lucide-react';

export default function Header({
    nombreTaller,
    cajaTotal,
    onOpenTelemetria,
    onOpenScanner,
    onOpenConfiguracion,
    onOpenMarketing
}: any) {
    return (
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-4 lg:p-5 flex justify-between items-center rounded-3xl mb-6 shadow-2xl relative z-10">
            
            {/* 🔥 SECCIÓN IZQUIERDA: LOGO/ÍCONO Y NOMBRE */}
            <div className="flex items-center gap-4">
                <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Wrench className="text-emerald-500" size={24} />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tighter uppercase drop-shadow-md">{nombreTaller}</h1>
                    <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Calibre OS</p>
                </div>
            </div>

            {/* 🔥 SECCIÓN DERECHA: CAJA Y BOTONES COLORIDOS */}
            <div className="flex items-center gap-2 md:gap-3">
                
                {/* 💵 CAJA / INGRESOS (Ahora abre la Telemetría) */}
                <button 
                    onClick={onOpenTelemetria} 
                    className="flex items-center gap-3 bg-emerald-900/30 border border-emerald-700/50 px-3 md:px-5 py-2 md:py-2.5 rounded-2xl hover:bg-emerald-800/40 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] group"
                    title="Ver Dashboard y Flujo de Caja"
                >
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Wallet className="text-emerald-500" size={18} />
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest leading-none mb-1">Caja Actual</p>
                        <p className="text-emerald-400 font-black tracking-wider text-sm leading-none">${cajaTotal.toLocaleString('es-CL')}</p>
                    </div>
                </button>

                <div className="w-px h-8 bg-slate-800 mx-1 hidden md:block"></div>

                {/* 🧰 HERRAMIENTAS (Tus colores originales) */}
                <button 
                    onClick={onOpenScanner} 
                    className="bg-blue-600 hover:bg-blue-500 p-2.5 md:p-3 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:scale-105" 
                    title="Escáner IA"
                >
                    <ScanLine size={18} />
                </button>
                
                <button 
                    onClick={onOpenTelemetria} 
                    className="bg-purple-600 hover:bg-purple-500 p-2.5 md:p-3 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:scale-105" 
                    title="Dashboard y Telemetría"
                >
                    <BarChart3 size={18} />
                </button>
                
                <button 
                    onClick={onOpenMarketing} 
                    className="bg-cyan-700 hover:bg-cyan-600 p-2.5 md:p-3 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:scale-105" 
                    title="Campañas de Marketing"
                >
                    <Megaphone size={18} />
                </button>

                <button 
                    onClick={onOpenConfiguracion} 
                    className="bg-slate-800 hover:bg-slate-700 p-2.5 md:p-3 rounded-xl text-slate-300 transition-all border border-slate-700/50 hover:scale-105 ml-1" 
                    title="Configuración"
                >
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
}