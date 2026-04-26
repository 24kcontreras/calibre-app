'use client'
import { Settings, BarChart3, ScanLine, Megaphone, Wrench, AlertCircle, X, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({
    nombreTaller,
    cajaTotal, 
    onOpenTelemetria,
    onOpenScanner,
    onOpenConfiguracion,
    onOpenMarketing
}: any) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [diasPrueba, setDiasPrueba] = useState<number | null>(null);
    const [mostrarBanner, setMostrarBanner] = useState(true);

    useEffect(() => {
        const fetchDatosHeader = async () => {
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
            setLogoUrl(session?.user?.user_metadata?.logo_url || null);
        });

        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, []);

    return (
        <div className="flex flex-col w-full mb-6 z-10 relative">
            
            {/* 🔥 BANNER DE PRUEBA */}
            {diasPrueba !== null && diasPrueba <= 25 && diasPrueba > 0 && mostrarBanner && (
                <div className="bg-emerald-900/30 border border-emerald-500/20 backdrop-blur-md text-emerald-400 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-lg mb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                            <Clock size={14} className="text-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-xs font-bold tracking-wide">
                            Te quedan <span className="font-black text-emerald-300">{diasPrueba} días</span> de prueba gratuita.
                        </p>
                    </div>
                    <button 
                        onClick={() => setMostrarBanner(false)} 
                        className="text-emerald-500 hover:text-emerald-300 hover:bg-emerald-500/10 p-1.5 rounded-lg transition-colors"
                        title="Ocultar mensaje"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* HEADER PRINCIPAL */}
            <header className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 rounded-3xl shadow-2xl w-full">
                
                {/* LOGO E IDENTIDAD */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                    {logoUrl ? (
                        <img 
                            src={logoUrl} 
                            alt="Logo Taller" 
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-white shrink-0" 
                        />
                    ) : (
                        <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
                            <Wrench className="text-emerald-500" size={24} />
                        </div>
                    )}
                    <div className="flex flex-col text-center md:text-left">
                        <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tighter uppercase drop-shadow-md line-clamp-1">{nombreTaller}</h1>
                        <p className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Calibre OS</p>
                    </div>
                </div>

                {/* 🔥 HERRAMIENTAS (Botones Píldora Horizontales) */}
                <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    
                    <button onClick={onOpenScanner} className="group flex items-center gap-2.5 bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600 hover:border-blue-500 px-4 py-2.5 rounded-xl text-blue-500 hover:text-white transition-all shadow-lg hover:scale-105 shrink-0" title="Escáner Inteligente">
                        <ScanLine size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Scanner IA</span>
                    </button>
                    
                    <button onClick={onOpenTelemetria} className="group flex items-center gap-2.5 bg-purple-600/10 border border-purple-600/30 hover:bg-purple-600 hover:border-purple-500 px-4 py-2.5 rounded-xl text-purple-500 hover:text-white transition-all shadow-lg hover:scale-105 shrink-0" title="Dashboard de Métricas">
                        <BarChart3 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Métricas</span>
                    </button>
                    
                    <button onClick={onOpenMarketing} className="group flex items-center gap-2.5 bg-cyan-700/10 border border-cyan-700/30 hover:bg-cyan-700 hover:border-cyan-500 px-4 py-2.5 rounded-xl text-cyan-500 hover:text-white transition-all shadow-lg hover:scale-105 shrink-0" title="Campañas de Retención">
                        <Megaphone size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Campañas</span>
                    </button>

                    <div className="w-px h-8 bg-slate-800 mx-1 hidden md:block"></div>

                    <button onClick={onOpenConfiguracion} className="group flex items-center gap-2.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all shadow-lg hover:scale-105 shrink-0" title="Ajustes del Taller">
                        <Settings size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ajustes</span>
                    </button>

                </div>
            </header>
        </div>
    );
}