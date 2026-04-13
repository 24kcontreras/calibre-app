import { useState } from 'react'
import { Search, Bot, X, BookOpen, Activity, AlertOctagon } from 'lucide-react'

interface ModalScannerProps {
  onClose: () => void;
  codigoScanner: string;
  setCodigoScanner: (val: string) => void;
  vehiculoScanner: string;
  setVehiculoScanner: (val: string) => void;
  consultarScanner: (e: React.FormEvent, tipo: 'scanner' | 'manual') => void;
  cargandoScanner: boolean;
  resultadoScanner: any;
}

export default function ModalScanner({
  onClose, codigoScanner, setCodigoScanner, vehiculoScanner, setVehiculoScanner, consultarScanner, cargandoScanner, resultadoScanner
}: ModalScannerProps) {
  
  // 🔥 ESTADO PARA LAS PESTAÑAS
  const [modoActivo, setModoActivo] = useState<'scanner' | 'manual'>('scanner');

  // 🔥 LAS 8 SUGERENCIAS DE DATOS DUROS ACORDADAS
  const sugerenciasManual = [
    "Torque pernos culata",
    "Torque biela y bancada",
    "Luz de válvulas",
    "Presión de compresión",
    "Viscosidad aceite motor",
    "Tipo de aceite caja",
    "Orden de encendido",
    "Presión de combustible"
  ];

  const handleSugerencia = (sugerencia: string) => {
    setCodigoScanner(sugerencia);
  };

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    consultarScanner(e, modoActivo);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      {/* 🟢 AJUSTE: Padding responsivo en el modal p-5 md:p-8 */}
      <div className="bg-slate-900 p-5 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl max-w-lg w-full border border-slate-800 relative flex flex-col max-h-[90vh]">
        
        {/* 🟢 AJUSTE: Posición de la X en móvil */}
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-500 hover:text-emerald-400 transition-colors z-10">
          <X size={24} />
        </button>

        {/* 🔥 SELECTOR DE HERRAMIENTAS (PESTAÑAS) */}
        <div className="flex bg-slate-950 p-1 rounded-2xl mb-5 md:mb-6 shrink-0">
          <button 
            onClick={() => { setModoActivo('scanner'); setCodigoScanner(''); }}
            className={`flex-1 py-2 md:py-3 flex items-center justify-center gap-1.5 md:gap-2 font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl transition-all ${modoActivo === 'scanner' ? 'bg-emerald-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-emerald-400'}`}
          >
            <Activity size={16} /> <span className="hidden sm:inline">Scanner</span> OBD2
          </button>
          <button 
            onClick={() => { setModoActivo('manual'); setCodigoScanner(''); }}
            className={`flex-1 py-2 md:py-3 flex items-center justify-center gap-1.5 md:gap-2 font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl transition-all ${modoActivo === 'manual' ? 'bg-blue-600 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-blue-400'}`}
          >
            <BookOpen size={16} /> Manual <span className="hidden sm:inline">Técnico</span>
          </button>
        </div>

        {/* CABECERA DINÁMICA */}
        <div className="mb-5 md:mb-6 shrink-0">
          <h3 className={`text-xl md:text-2xl font-black tracking-tighter uppercase flex items-center gap-2 ${modoActivo === 'scanner' ? 'text-emerald-400' : 'text-blue-400'}`}>
            <Bot /> {modoActivo === 'scanner' ? 'Diagnóstico IA' : 'Biblioteca Técnica'}
          </h3>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-1">
            {modoActivo === 'scanner' ? 'Ingresa un código de falla para obtener causas y revisiones.' : '¿Qué necesitas saber sobre este modelo?'}
          </p>
        </div>

        <form onSubmit={handleConsultar} className="space-y-3 md:space-y-4 shrink-0">
          <input 
            value={vehiculoScanner} 
            onChange={e => setVehiculoScanner(e.target.value)} 
            required
            placeholder="Vehículo (Ej: Kia Sportage 2008 CRDI)" 
            className={`w-full p-3 md:p-4 rounded-xl md:rounded-2xl border text-sm md:text-base bg-slate-800 font-bold text-slate-100 outline-none transition-all ${modoActivo === 'scanner' ? 'border-slate-700 focus:border-emerald-500' : 'border-slate-700 focus:border-blue-500'}`} 
          />
          
          <div className="flex gap-2">
            {/* 🟢 AJUSTE CLAVE: flex-1 y min-w-0 para que el input no desborde en móvil */}
            <input 
              value={codigoScanner} 
              onChange={e => setCodigoScanner(modoActivo === 'scanner' ? e.target.value.toUpperCase() : e.target.value)} 
              required 
              placeholder={modoActivo === 'scanner' ? "Código o Síntoma (Ej: P0420)" : "Ej: Torque de culata"} 
              className={`flex-1 min-w-0 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 text-sm md:text-base bg-slate-800 font-black outline-none transition-all ${modoActivo === 'scanner' ? 'border-emerald-900/50 text-emerald-400 focus:border-emerald-500 placeholder:text-emerald-900/50 uppercase' : 'border-blue-900/50 text-blue-400 focus:border-blue-500 placeholder:text-blue-900/50'}`} 
            />
            {/* 🟢 AJUSTE CLAVE: shrink-0 y padding responsivo para que el botón no se aplaste */}
            <button type="submit" disabled={cargandoScanner} className={`px-4 md:px-6 shrink-0 rounded-xl md:rounded-2xl font-black text-slate-950 transition-all disabled:opacity-50 ${modoActivo === 'scanner' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
              <Search size={20} />
            </button>
          </div>

          {/* 🔥 SUGERENCIAS SOLO EN MODO MANUAL */}
          {modoActivo === 'manual' && (
            <div className="flex flex-wrap gap-2 pt-2">
              {sugerenciasManual.map((sug, idx) => (
                <button 
                  key={idx} type="button" onClick={() => handleSugerencia(sug)}
                  className="text-[9px] md:text-[10px] font-bold bg-blue-950/50 text-blue-400 border border-blue-900/50 px-2 md:px-3 py-1.5 rounded-lg hover:bg-blue-900 hover:text-blue-300 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* 🔥 ÁREA DEL RESULTADO */}
        <div className="mt-5 md:mt-6 flex-1 overflow-y-auto custom-scrollbar-dark rounded-xl md:rounded-2xl bg-slate-950/80 border border-slate-800 p-4 md:p-6 relative min-h-[150px] md:min-h-[200px]">
          {cargandoScanner ? (
            <div className={`h-full flex flex-col items-center justify-center animate-pulse ${modoActivo === 'scanner' ? 'text-emerald-500/50' : 'text-blue-500/50'}`}>
              <Bot size={40} className="mb-4" />
              <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
                {modoActivo === 'scanner' ? 'Analizando falla...' : 'Buscando en manuales...'}
              </p>
            </div>
          ) : resultadoScanner?.resultado ? (
            <div className="pb-8">
              {/* Renderizamos el HTML que nos manda el backend */}
              <div 
                className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: resultadoScanner.resultado }} 
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 text-[10px] md:text-xs font-bold text-center italic px-2">
              {modoActivo === 'scanner' ? 'Ingresa un código para obtener el diagnóstico del ingeniero.' : 'Selecciona una sugerencia o escribe lo que necesitas saber.'}
            </div>
          )}
          
          {/* 🔥 EL DISCLAIMER LEGAL GIGANTE */}
          {(!cargandoScanner && resultadoScanner?.resultado) && (
            <div className="mt-4 md:mt-6 pt-4 border-t border-slate-800/50 flex items-start gap-2 text-[8px] md:text-[9px] text-slate-500 font-bold leading-tight">
              <AlertOctagon size={14} className="shrink-0 text-red-900" />
              <p>
                <span className="text-red-800">ATENCIÓN:</span> CALIBRE utiliza IA de asistencia. Los datos numéricos críticos (torques, medidas) deben ser verificados siempre en el manual oficial del fabricante. CALIBRE no se responsabiliza por daños derivados del uso de esta información.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}