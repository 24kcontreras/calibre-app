'use client'
import { Settings, BarChart3, ScanLine, Megaphone, Wrench, AlertCircle, X, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({
    nombreTaller,
    cajaTotal, // La dejamos aquí para no romper el page.tsx, pero ya no la usamos visualmente
    onOpenTelemetria,
    onOpenScanner,
    onOpenConfiguracion,
    onOpenMarketing
}: any) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [diasPrueba, setDiasPrueba] = useState<number | null>(null);
    const [mostrarBanner, setMostrarBanner] = useState(true);

    // 🔥 El Header busca el logo y los días de prueba de forma independiente
    useEffect(() => {
        const fetchDatosHeader = async () => {
            const { data: authData } = await supabase.auth.getSession();
            const user = authData?.session?.user;
            
            if (user) {
                // 1. Buscamos el Logo
                setLogoUrl(user.user_metadata?.logo_url || null);

                // 2. Buscamos la fecha de vencimiento silenciosamente
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

        // Escucha si el logo cambia en la configuración
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setLogoUrl(session?.user?.user_metadata?.logo_url || null);
        });

        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, []);

    return (
        <div className="flex flex-col w-full mb-6 z-10 relative">
            
            {/* 🔥 BANNER DE PRUEBA: No invasivo y se puede cerrar */}
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
            <header className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-4 lg:p-6 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 rounded-3xl shadow-2xl w-full">
                
                {/* LOGO E IDENTIDAD */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                    {logoUrl ? (
                        <img 
                            src={logoUrl} 
                            alt="Logo Taller" 
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-white shrink-0" 
                        />
                    ) : (
                        <div className="bg-emerald-500/20 p-3.5 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
                            <Wrench className="text-emerald-500" size={28} />
                        </div>
                    )}
                    <div className="flex flex-col text-center md:text-left">
                        <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tighter uppercase drop-shadow-md line-clamp-1">{nombreTaller}</h1>
                        <p className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Calibre OS</p>
                    </div>
                </div>

                {/* 🔥 HERRAMIENTAS (Rediseñadas con etiquetas de texto) */}
                <div className="flex items-center justify-center flex-wrap gap-4 md:gap-6 w-full md:w-auto">
                    
                    {/* Botón Scanner */}
                    <button onClick={onOpenScanner} className="group flex flex-col items-center gap-2" title="Escáner Inteligente">
                        <div className="bg-blue-600/10 border border-blue-600/30 group-hover:bg-blue-600 group-hover:border-blue-500 p-3.5 md:p-4 rounded-2xl text-blue-500 group-hover:text-white transition-all shadow-lg hover:scale-105">
                            <ScanLine size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors">Scanner IA</span>
                    </button>
                    
                    {/* Botón Telemetría */}
                    <button onClick={onOpenTelemetria} className="group flex flex-col items-center gap-2" title="Dashboard de Métricas">
                        <div className="bg-purple-600/10 border border-purple-600/30 group-hover:bg-purple-600 group-hover:border-purple-500 p-3.5 md:p-4 rounded-2xl text-purple-500 group-hover:text-white transition-all shadow-lg hover:scale-105">
                            <BarChart3 size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-400 transition-colors">Métricas</span>
                    </button>
                    
                    {/* Botón Marketing */}
                    <button onClick={onOpenMarketing} className="group flex flex-col items-center gap-2" title="Campañas de Retención">
                        <div className="bg-cyan-700/10 border border-cyan-700/30 group-hover:bg-cyan-700 group-hover:border-cyan-500 p-3.5 md:p-4 rounded-2xl text-cyan-500 group-hover:text-white transition-all shadow-lg hover:scale-105">
                            <Megaphone size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-cyan-400 transition-colors">Campañas</span>
                    </button>

                    {/* Separador Visual */}
                    <div className="w-px h-12 bg-slate-800 mx-2 hidden md:block"></div>

                    {/* Botón Configuración */}
                    <button onClick={onOpenConfiguracion} className="group flex flex-col items-center gap-2" title="Ajustes del Taller">
                        <div className="bg-slate-800/50 border border-slate-700 group-hover:bg-slate-700 group-hover:border-slate-500 p-3.5 md:p-4 rounded-2xl text-slate-400 group-hover:text-white transition-all shadow-lg hover:scale-105">
                            <Settings size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Ajustes</span>
                    </button>

                </div>
            </header>
        </div>
    );
}