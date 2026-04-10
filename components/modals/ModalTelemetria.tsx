import { Activity, DollarSign, TrendingUp, User } from 'lucide-react'

// Definimos qué datos necesita recibir este componente desde la página principal
interface ModalTelemetriaProps {
  onClose: () => void;
  gananciasEsteMes: number;
  autosEsteMes: number;
  ticketPromedio: number;
  pctServicio: number;
  pctRepuesto: number;
  ingresosServicio: number;
  ingresosRepuesto: number;
  topMarcas: [string, number][];
  topMecanicos: [string, number][];
}

export default function ModalTelemetria({
  onClose,
  gananciasEsteMes,
  autosEsteMes,
  ticketPromedio,
  pctServicio,
  pctRepuesto,
  ingresosServicio,
  ingresosRepuesto,
  topMarcas,
  topMecanicos
}: ModalTelemetriaProps) {
  
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-6xl w-full border border-slate-800 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-100 flex items-center gap-2">
                <Activity className="text-blue-500"/> Telemetría y Rendimiento
            </h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Métricas operativas en tiempo real</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-400 font-black text-xl p-2 bg-slate-800 rounded-full transition-colors border border-slate-700 w-10 h-10 flex items-center justify-center">✕</button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar-dark flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                
                <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <div className="absolute -inset-10 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-1"><DollarSign size={12} className="text-emerald-400"/> Ganancias del Mes</h3>
                    <p className="text-3xl md:text-4xl font-black text-slate-100 tracking-tighter relative z-10 w-full truncate px-2" title={`$${gananciasEsteMes.toLocaleString('es-CL')}`}>
                        ${gananciasEsteMes.toLocaleString('es-CL')}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-2 relative z-10">{autosEsteMes} vehículos atendidos</p>
                </div>

                <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800 shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute -inset-10 bg-blue-500/5 rounded-full blur-3xl"></div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-1"><TrendingUp size={12} className="text-blue-400"/> Ticket Promedio</h3>
                    <p className="text-3xl md:text-4xl font-black text-blue-400 tracking-tighter relative z-10 w-full truncate px-2" title={`$${ticketPromedio.toLocaleString('es-CL')}`}>
                        ${ticketPromedio.toLocaleString('es-CL')}
                    </p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-2 relative z-10">Histórico global</p>
                </div>

                <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800 shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Origen de Ingresos</h3>
                        <p className="text-sm font-bold text-slate-300 mb-6">Repuestos vs Servicio</p>
                    </div>
                    <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden flex mb-4 border border-slate-700">
                        <div style={{width: `${pctServicio}%`}} className="bg-blue-500 h-full transition-all duration-1000"></div>
                        <div style={{width: `${pctRepuesto}%`}} className="bg-emerald-500 h-full transition-all duration-1000"></div>
                    </div>
                    <div className="flex justify-between text-xs font-black">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-slate-400 uppercase">Servicio ({pctServicio}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-slate-400 uppercase">Repuesto ({pctRepuesto}%)</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                        <span>${ingresosServicio.toLocaleString('es-CL')}</span>
                        <span>${ingresosRepuesto.toLocaleString('es-CL')}</span>
                    </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800 shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Top Marcas</h3>
                        <p className="text-sm font-bold text-slate-300 mb-4">Vehículos más frecuentes</p>
                    </div>
                    <div className="space-y-3">
                        {topMarcas.length > 0 ? topMarcas.map(([marca, count]: any, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-800 p-3 rounded-2xl border border-slate-700">
                                <span className="font-black text-xs text-slate-200 uppercase">{marca}</span>
                                <span className="bg-slate-900 text-emerald-400 font-black text-[10px] px-3 py-1 rounded-full">{count}</span>
                            </div>
                        )) : (
                            <p className="text-xs text-slate-600 italic">No hay datos suficientes.</p>
                        )}
                    </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800 shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rendimiento</h3>
                        <p className="text-sm font-bold text-slate-300 mb-4">Trabajos por Mecánico</p>
                    </div>
                    <div className="space-y-3">
                        {topMecanicos.length > 0 ? topMecanicos.map(([mecanico, count]: any, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-800 p-3 rounded-2xl border border-slate-700">
                                <span className="font-black text-xs text-slate-200 uppercase truncate pr-2 flex items-center gap-1"><User size={12}/> {mecanico}</span>
                                <span className="bg-slate-900 text-emerald-400 font-black text-[10px] px-3 py-1 rounded-full">{count}</span>
                            </div>
                        )) : (
                            <p className="text-xs text-slate-600 italic">No hay datos suficientes.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}