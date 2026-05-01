'use client'
import { ScanLine, BarChart3, Users, Megaphone, Settings, LogOut } from 'lucide-react';

export default function BottomNav({ 
    onOpenScanner, onOpenTelemetria, onOpenCRM, onOpenMarketing, onOpenConfiguracion, mecanicoActivo 
}: any) {
    
    const cerrarSesionMecanico = () => {
        localStorage.removeItem('calibre_mecanico_session');
        window.location.href = '/login';
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 px-6 py-3 z-[100] flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <button onClick={onOpenScanner} className="flex flex-col items-center gap-1 text-blue-400">
                <ScanLine size={20} />
                <span className="text-[8px] font-black uppercase tracking-tighter">Scanner</span>
            </button>

            {!mecanicoActivo ? (
                <>
                    <button onClick={onOpenTelemetria} className="flex flex-col items-center gap-1 text-purple-400">
                        <BarChart3 size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Métricas</span>
                    </button>
                    <button onClick={onOpenCRM} className="flex flex-col items-center gap-1 text-orange-400">
                        <Users size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">CRM</span>
                    </button>
                    <button onClick={onOpenMarketing} className="flex flex-col items-center gap-1 text-cyan-400">
                        <Megaphone size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Campañas</span>
                    </button>
                    <button onClick={onOpenConfiguracion} className="flex flex-col items-center gap-1 text-slate-400">
                        <Settings size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Ajustes</span>
                    </button>
                </>
            ) : (
                <button onClick={cerrarSesionMecanico} className="flex flex-col items-center gap-1 text-red-500">
                    <LogOut size={20} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Salir</span>
                </button>
            )}
        </nav>
    );
}