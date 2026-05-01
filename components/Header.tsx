'use client'
import { Wrench, Clock, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header({ nombreTaller, mecanicoActivo }: any) {
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
                const { data: tallerData } = await supabase.from('talleres').select('fecha_vencimiento').eq('id', user.id).single();
                if (tallerData?.fecha_vencimiento) {
                    const diffTime = new Date(tallerData.fecha_vencimiento).getTime() - new Date().getTime();
                    setDiasPrueba(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                }
            }
        };
        fetchDatosHeader();
    }, [mecanicoActivo]);

    return (
        <div className="flex flex-col w-full mb-4 md:mb-6 z-10 relative">
            {/* BANNER DE PRUEBA */}
            {!mecanicoActivo && diasPrueba !== null && diasPrueba <= 25 && diasPrueba > 0 && mostrarBanner && (
                <div className="bg-emerald-900/30 border border-emerald-500/20 backdrop-blur-md text-emerald-400 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-lg mb-3">
                    <div className="flex items-center gap-3">
                        <Clock size={14} className="animate-pulse" />
                        <p className="text-[10px] md:text-xs font-bold">Te quedan <span className="font-black">{diasPrueba} días</span> de prueba.</p>
                    </div>
                    <button onClick={() => setMostrarBanner(false)}><X size={14} /></button>
                </div>
            )}

            <header className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-3 md:p-4 rounded-3xl shadow-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {logoUrl && !mecanicoActivo ? (
                        <img src={logoUrl} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover border border-slate-700/50 bg-white" />
                    ) : (
                        <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
                            <Wrench className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-lg md:text-2xl font-black text-slate-100 tracking-tighter uppercase">{nombreTaller}</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-emerald-400 tracking-widest uppercase">
                            {mecanicoActivo ? `Mecánico: ${mecanicoActivo.nombre}` : 'Calibre OS'}
                        </p>
                    </div>
                </div>
                
                {/* NOTA: Los botones desaparecieron de aquí en móvil, solo se ven en md:flex (escritorio) si decides agregarlos de vuelta para PC */}
            </header>
        </div>
    );
}