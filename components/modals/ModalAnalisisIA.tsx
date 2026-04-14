import { useState, useEffect } from 'react';
import { Lightbulb, Bot, X, AlertOctagon } from 'lucide-react';

interface ModalAnalisisIAProps {
  onClose: () => void;
  orden: any;
}

export default function ModalAnalisisIA({ onClose, orden }: ModalAnalisisIAProps) {
  const [analisis, setAnalisis] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchAnalisis = async () => {
      try {
        const res = await fetch('/api/analisis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ falla: orden.descripcion, vehiculo: orden.vehiculos })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAnalisis(data.resultado);
      } catch (err: any) {
        setAnalisis(`<p class="text-red-400 font-bold">Error al consultar la IA: ${err.message}</p>`);
      } finally {
        setCargando(false);
      }
    };
    fetchAnalisis();
  }, [orden]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[30px] md:rounded-[40px] shadow-2xl max-w-2xl w-full border border-yellow-900/50 relative flex flex-col max-h-[90vh]">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-yellow-400 transition-colors z-10">
          <X size={24} />
        </button>

        <div className="p-6 md:p-8 border-b border-slate-800 shrink-0">
          <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase text-yellow-400 flex items-center gap-2">
            <Lightbulb className="animate-pulse" /> Segunda Opinión IA
          </h3>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-1">
            Análisis experto para {orden.vehiculos?.marca} {orden.vehiculos?.modelo}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-6 md:p-8 bg-slate-950/50">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Síntoma Reportado:</p>
            <p className="text-sm text-slate-200 italic">"{orden.descripcion}"</p>
          </div>

          {cargando ? (
            <div className="h-40 flex flex-col items-center justify-center text-yellow-500/50 animate-pulse">
              <Bot size={40} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">Generando análisis profundo...</p>
            </div>
          ) : (
            <div 
              className="text-sm text-slate-300 leading-relaxed font-sans [&>h3]:text-yellow-400 [&>h3]:font-black [&>h3]:uppercase [&>h3]:text-xs [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul>li]:mb-2 [&>p]:mb-4"
              dangerouslySetInnerHTML={{ __html: analisis }} 
            />
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-start gap-2 text-[9px] text-slate-500 font-bold leading-tight">
            <AlertOctagon size={14} className="shrink-0 text-yellow-900" />
            <p>Este es un análisis preliminar generado por Inteligencia Artificial basado en el síntoma reportado. El diagnóstico final siempre debe ser corroborado empíricamente por el mecánico a cargo.</p>
          </div>
        </div>

      </div>
    </div>
  )
}