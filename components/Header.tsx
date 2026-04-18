import { Settings, BarChart3, ScanLine, Megaphone, Wrench, Wallet } from 'lucide-react';
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

    // 🔥 El Header busca el logo por su cuenta para no molestar a page.tsx
    useEffect(() => {
        const fetchLogo = async () => {
            const { data } = await supabase.auth.getSession();
            const url = data?.session?.user?.user_metadata?.logo_url;
            if (url) setLogoUrl(url);
        };
        
        fetchLogo();

        // Escucha si el logo cambia en la configuración
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            const url = session?.user?.user_metadata?.logo_url;
            setLogoUrl(url || null);
        });

        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, []);

    return (
        // 🔥 CAMBIO CLAVE AQUÍ: flex-col para móvil, md:flex-row para escritorio
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-4 lg:p-5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 rounded-3xl mb-6 shadow-2xl relative z-10 w-full">
            
            {/* 🔥 SECCIÓN IZQUIERDA: LOGO/ÍCONO Y NOMBRE */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                {logoUrl ? (
                    <img 
                        src={logoUrl} 
                        alt="Logo Taller" 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700/50 shadow-lg bg-white shrink-0" 
                    />
                ) : (
                    <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
                        <Wrench className="text-emerald-500" size={24} />
                    </div>
                )}
                <div className="flex flex-col text-center md:text-left">
                    <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tighter uppercase drop-shadow-md line-clamp-1">{nombreTaller}</h1>
                    <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Calibre OS</p>
                </div>
            </div>

            {/* 🔥 SECCIÓN DERECHA: CAJA Y BOTONES COLORIDOS */}
            {/* flex-wrap permite que los botones bajen a otra línea si el teléfono es muy angosto */}
            <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                
                {/* 💵 CAJA / INGRESOS (Ahora abre la Telemetría) */}
                <button 
                    onClick={onOpenTelemetria} 
                    className="flex items-center gap-2 md:gap-3 bg-emerald-900/30 border border-emerald-700/50 px-3 md:px-5 py-2 md:py-2.5 rounded-2xl hover:bg-emerald-800/40 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] group"
                    title="Ver Dashboard y Flujo de Caja"
                >
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Wallet className="text-emerald-500" size={16} />
                    </div>
                    <div className="text-left">
                        {/* Ocultamos el texto "Caja Actual" en móvil para ahorrar espacio */}
                        <p className="hidden md:block text-[9px] font-black text-emerald-500/80 uppercase tracking-widest leading-none mb-1">Caja Actual</p>
                        <p className="text-emerald-400 font-black tracking-wider text-xs md:text-sm leading-none">${cajaTotal.toLocaleString('es-CL')}</p>
                    </div>
                </button>

                <div className="w-px h-8 bg-slate-800 mx-1 hidden md:block"></div>

                {/* 🧰 HERRAMIENTAS (Tus colores originales) */}
                <button 
                    onClick={onOpenScanner} 
                    className="bg-blue-600 hover:bg-blue-500 p-2.5 md:p-3 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:scale-105 shrink-0" 
                    title="Escáner IA"
                >
                    <ScanLine size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                
                <button 
                    onClick={onOpenTelemetria} 
                    className="bg-purple-600 hover:bg-purple-500 p-2.5 md:p-3 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:scale-105 shrink-0" 
                    title="Dashboard y Telemetría"
                >
                    <BarChart3 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                
                <button 
                    onClick={onOpenMarketing} 
                    className="bg-cyan-700 hover:bg-cyan-600 p-2.5 md:p-3 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:scale-105 shrink-0" 
                    title="Campañas de Marketing"
                >
                    <Megaphone size={16} className="md:w-[18px] md:h-[18px]" />
                </button>

                <button 
                    onClick={onOpenConfiguracion} 
                    className="bg-slate-800 hover:bg-slate-700 p-2.5 md:p-3 rounded-xl text-slate-300 transition-all border border-slate-700/50 hover:scale-105 ml-1 shrink-0" 
                    title="Configuración"
                >
                    <Settings size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
            </div>
        </header>
    );
}