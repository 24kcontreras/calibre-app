'use client'
import { Settings, BarChart3, ScanLine, Megaphone, Wrench, AlertCircle, X, Clock, Users, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({
    nombreTaller,
    cajaTotal, 
    onOpenTelemetria,
    onOpenCRM, 
    onOpenScanner,
    onOpenConfiguracion,
    onOpenMarketing,
    mecanicoActivo
}: any) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [diasPrueba, setDiasPrueba] = useState<number | null>(null);
    const [mostrarBanner, setMostrarBanner] = useState(true);

    useEffect(() => {
        const fetchDatosHeader = async () => {
            if (mecanicoActivo) return;

            const { data: authData } = await supabase.auth.getSession();
            const user = authData?.session?.user;
            
            if (user) {
                setLogoUrl(user.user_metadata?.logo_url || null);

                const { data: tallerData } = await supabase
                    .from('talleres')
                    .select('fecha_vencimiento')
                    .eq('id', user.id)
                    .single();

                if (tallerData?.fecha_vencimiento) {
                    const diffTime = new Date(tallerData.fecha_vencimiento).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDiasPrueba(diffDays);
                }
            }
        };
        
        fetchDatosHeader();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mecanicoActivo) {
                setLogoUrl(session?.user?.user_metadata?.logo_url || null);
            }
        });

        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, [mecanicoActivo]);

    const cerrarSesionMecanico = () => {
        localStorage.removeItem('calibre_mecanico_session');
        window.location.href = '/login';
    };

    return (
        <div className="flex flex-col w-full mb-4 md:mb-6 z-10 relative">
            
            {/* 🔥 BANNER DE PRUEBA */}
            {!mecanicoActivo && diasPrueba !== null && diasPrueba <= 25 && diasPrueba > 0 && mostrarBanner && (
                <div className="bg-emerald-900/30 border border-emerald-500/20 backdrop-blur-md text-emerald-400 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-lg mb-3 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                            <Clock size={14} className="text-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[10px] md:text-xs font-bold tracking-wide">
                            Te quedan <span className="font-black text-emerald-300">{diasPrueba} días</span> de prueba.
                        </p>
                    </div>
                    <button 
                        onClick={() => setMostrarBanner(false)} 
                        className="text-emerald-500 hover:text-emerald-300 hover:bg-emerald-500/10 p-1.5 rounded-lg transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* HEADER PRINCIPAL ULTRACOMPACTO */}
            <header className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-3 md:p-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 rounded-3xl shadow-2xl w-full">
                
                {/* LOGO E IDENTIDAD */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-start">
                    {logoUrl && !mecanicoActivo ? (
                        <img 
                            src={logoUrl} 
                            alt="Logo Taller" 
                            className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-white shrink-0" 
                        />
                    ) : (
                        <div className="bg-emerald-500/20 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
                            <Wrench className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
                        </div>
                    )}
                    <div className="flex flex-col text-left">
                        <h1 className="text-lg md:text-2xl font-black text-slate-100 tracking-tighter uppercase drop-shadow-md line-clamp-1">{nombreTaller}</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-emerald-400 tracking-widest uppercase">
                            {mecanicoActivo ? `Mecánico: ${mecanicoActivo.nombre}` : 'Calibre OS'}
                        </p>
                    </div>
                </div>

                {/* 🔥 HERRAMIENTAS (Scroll Horizontal en Móvil) */}
                <div className="flex items-center justify-start md:justify-center overflow-x-auto w-full md:w-auto gap-2 pb-1 md:pb-0 scrollbar-hide shrink-0">
                    
                    <button onClick={onOpenScanner} className="group flex items-center gap-2 bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600 hover:border-blue-500 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-blue-500 hover:text-white transition-all shadow-lg shrink-0" title="Escáner Inteligente">
                        <ScanLine size={14} className="md:w-4 md:h-4" />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Scanner</span>
                    </button>
                    
                    {!mecanicoActivo && (
                        <>
                            <button onClick={onOpenTelemetria} className="group flex items-center gap-2 bg-purple-600/10 border border-purple-600/30 hover:bg-purple-600 hover:border-purple-500 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-purple-500 hover:text-white transition-all shadow-lg shrink-0">
                                <BarChart3 size={14} className="md:w-4 md:h-4" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Métricas</span>
                            </button>

                            <button onClick={onOpenCRM} className="group flex items-center gap-2 bg-orange-600/10 border border-orange-600/30 hover:bg-orange-600 hover:border-orange-500 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-orange-500 hover:text-white transition-all shadow-lg shrink-0">
                                <Users size={14} className="md:w-4 md:h-4" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">CRM</span>
                            </button>
                            
                            <button onClick={onOpenMarketing} className="group flex items-center gap-2 bg-cyan-700/10 border border-cyan-700/30 hover:bg-cyan-700 hover:border-cyan-500 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-cyan-500 hover:text-white transition-all shadow-lg shrink-0">
                                <Megaphone size={14} className="md:w-4 md:h-4" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Campañas</span>
                            </button>

                            <div className="w-px h-6 bg-slate-800 mx-1 hidden md:block"></div>

                            <button onClick={onOpenConfiguracion} className="group flex items-center gap-2 bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg shrink-0">
                                <Settings size={14} className="md:w-4 md:h-4" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Ajustes</span>
                            </button>
                        </>
                    )}

                    {mecanicoActivo && (
                        <>
                            <div className="w-px h-6 bg-slate-800 mx-1 hidden md:block"></div>
                            <button onClick={cerrarSesionMecanico} className="group flex items-center gap-2 bg-red-600/10 border border-red-600/30 hover:bg-red-600 hover:border-red-500 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-red-500 hover:text-white transition-all shadow-lg shrink-0">
                                <LogOut size={14} className="md:w-4 md:h-4" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Cerrar Turno</span>
                            </button>
                        </>
                    )}
                </div>
            </header>
        </div>
    );
}