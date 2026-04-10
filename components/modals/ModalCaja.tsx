interface ModalCajaProps {
  onClose: () => void;
  historial: any[];
  cajaTotal: number;
}

export default function ModalCaja({ onClose, historial, cajaTotal }: ModalCajaProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-md w-full border border-slate-800 flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-100">Flujo de Ingresos</h3>
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Historial de Órdenes Finalizadas</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-400 font-black text-xl p-2 bg-slate-800 rounded-full transition-colors border border-slate-700 w-10 h-10 flex items-center justify-center">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar-dark flex-1 space-y-3">
          {historial.length === 0 ? (
            <p className="text-center text-xs font-black text-slate-500 uppercase tracking-widest py-10">No hay ingresos registrados.</p>
          ) : (
            historial.map(o => {
              const total = o.items_orden?.reduce((s:number,i:any)=>s+i.precio,0) || 0;
              return (
                <div key={o.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-2xl border border-slate-700">
                  <div>
                    <p className="font-black text-sm text-slate-100 tracking-wider">{o.vehiculos?.patente}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(o.created_at).toLocaleDateString('es-CL')}</p>
                  </div>
                  <p className="font-black text-emerald-400">${total.toLocaleString('es-CL')}</p>
                </div>
              )
            })
          )}
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-950 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Acumulado</span>
            <span className="text-3xl font-black text-emerald-500">${cajaTotal.toLocaleString('es-CL')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}