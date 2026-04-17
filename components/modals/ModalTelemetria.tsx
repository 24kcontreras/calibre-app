import { X, BarChart3, TrendingUp, CarFront, Wrench, Package, DollarSign, Wallet, Calendar, CheckCircle2 } from 'lucide-react';

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
  topMecanicos,
  historial // 🔥 Recibimos el historial completo aquí
}: any) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
      <div className="bg-slate-900 border border-slate-700/50 rounded-[35px] shadow-2xl max-w-4xl w-full relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Fondo decorativo */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

        <div className="flex justify-between items-center p-6 lg:p-8 border-b border-slate-800/50 relative z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                <BarChart3 className="text-emerald-500" /> Dashboard & Caja
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Rendimiento financiero del taller</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-emerald-400 bg-slate-950/50 p-2 rounded-full border border-slate-800 transition-all hover:scale-110">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar-dark relative z-10">
          
          {/* Tarjetas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-950/50 p-5 rounded-3xl border border-emerald-900/30 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors"><DollarSign size={80}/></div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 relative z-10">Ingresos del Mes</p>
              <p className="text-3xl font-black text-slate-100 tracking-tighter relative z-10">${gananciasEsteMes.toLocaleString('es-CL')}</p>
            </div>
            
            <div className="bg-slate-950/50 p-5 rounded-3xl border border-blue-900/30 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors"><CarFront size={80}/></div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 relative z-10">Autos Reparados</p>
              <p className="text-3xl font-black text-slate-100 tracking-tighter relative z-10">{autosEsteMes} <span className="text-sm text-slate-500">vehículos</span></p>
            </div>

            <div className="bg-slate-950/50 p-5 rounded-3xl border border-purple-900/30 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-purple-500/10 group-hover:text-purple-500/20 transition-colors"><TrendingUp size={80}/></div>
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1 relative z-10">Ticket Promedio</p>
              <p className="text-3xl font-black text-slate-100 tracking-tighter relative z-10">${ticketPromedio.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Split Ingresos */}
            <div className="bg-slate-800/30 p-6 rounded-3xl border border-slate-700/50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Distribución de Ingresos</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="flex items-center gap-1 text-slate-300"><Wrench size={12} className="text-blue-400"/> Mano de Obra ({pctServicio}%)</span>
                    <span className="text-emerald-400">${ingresosServicio.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pctServicio}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="flex items-center gap-1 text-slate-300"><Package size={12} className="text-orange-400"/> Venta Repuestos ({pctRepuesto}%)</span>
                    <span className="text-emerald-400">${ingresosRepuesto.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pctRepuesto}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tops */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 p-5 rounded-3xl border border-slate-700/50">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Top Marcas</h3>
                    <div className="space-y-3">
                        {topMarcas.map((marca: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300 capitalize">{i+1}. {marca[0]}</span>
                                <span className="text-slate-500 font-black">${(marca[1] / 1000).toFixed(0)}k</span>
                            </div>
                        ))}
                        {topMarcas.length === 0 && <p className="text-[10px] text-slate-500 italic">Sin datos suficientes</p>}
                    </div>
                </div>
                
                <div className="bg-slate-800/30 p-5 rounded-3xl border border-slate-700/50">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Top Mecánicos</h3>
                    <div className="space-y-3">
                        {topMecanicos.map((mec: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300 capitalize">{i+1}. {mec[0]}</span>
                                <span className="text-blue-400 font-black">{mec[1]} autos</span>
                            </div>
                        ))}
                        {topMecanicos.length === 0 && <p className="text-[10px] text-slate-500 italic">Sin datos suficientes</p>}
                    </div>
                </div>
            </div>
          </div>



          

          {/* 🔥 NUEVA SECCIÓN: HISTORIAL DE CAJA */}
          <div className="pt-8 border-t border-slate-800/50">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Wallet className="text-emerald-500" size={16} /> Flujo de Caja Histórico
              </h3>
              
              <div className="space-y-2">
                  {historial && historial.length > 0 ? (
                      historial.map((o: any) => {
                          const total = o.items_orden?.reduce((sum: number, i: any) => sum + i.precio, 0) || 0;
                          const fecha = new Date(o.created_at).toLocaleDateString('es-CL');
                          return (
                              <div key={o.id} className="flex justify-between items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800 hover:border-emerald-900 transition-colors">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-emerald-900/20 p-2 rounded-full">
                                          <CheckCircle2 className="text-emerald-500" size={14} />
                                      </div>
                                      <div>
                                          <p className="text-sm font-black text-slate-200 uppercase tracking-wider">{o.vehiculos?.patente} <span className="text-slate-500 font-bold ml-1">{o.vehiculos?.marca}</span></p>
                                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest mt-1">
                                              <Calendar size={10} /> {fecha} • Resp: {o.mecanico || 'Taller'}
                                          </p>
                                      </div>
                                  </div>
                                  <span className="text-emerald-400 font-black tracking-tighter text-lg">+ ${total.toLocaleString('es-CL')}</span>
                              </div>
                          )
                      })
                  ) : (
                      <div className="text-center py-8 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No hay registros de caja aún</p>
                      </div>
                  )}
              </div>
          </div>

        </div>
      </div>
    </div>
  )
}