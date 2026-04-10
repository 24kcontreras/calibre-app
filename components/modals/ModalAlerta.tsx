import { AlertTriangle, ShieldAlert, CheckCircle2, History } from 'lucide-react'

interface ModalAlertaProps {
  alertaForm: { pieza: string; nivel_riesgo: string; observacion: string };
  setAlertaForm: (val: any) => void;
  guardarAlertaBD: (e: React.FormEvent<HTMLFormElement>) => void;
  guardandoAlerta: boolean;
  onClose: () => void;
  ordenActiva: any; // 🔥 Recibimos la orden completa para leer su historial de alertas
  resolverAlertaBD: (alertaId: string) => void; // 🔥 Recibimos la nueva función para resolver
}

export default function ModalAlerta({
  alertaForm,
  setAlertaForm,
  guardarAlertaBD,
  guardandoAlerta,
  onClose,
  ordenActiva,
  resolverAlertaBD
}: ModalAlertaProps) {
  
  // Extraemos las alertas del vehículo que estén en estado 'Pendiente'
  const alertasPendientes = ordenActiva?.vehiculos?.alertas_desgaste?.filter((a: any) => a.estado === 'Pendiente') || [];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[160]">
      <div className="bg-slate-900 p-8 md:p-10 rounded-[40px] shadow-2xl max-w-2xl w-full border border-slate-800 relative overflow-hidden flex flex-col md:flex-row gap-8 max-h-[90vh]">
        
        {/* Luz de fondo de alerta */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-[50px] pointer-events-none"></div>

        {/* COLUMNA IZQUIERDA: CREAR NUEVA ALERTA */}
        <div className="flex-1 flex flex-col relative z-10 overflow-y-auto custom-scrollbar-dark pr-2">
            <h3 className="text-2xl font-black mb-2 tracking-tighter uppercase text-slate-100 flex items-center gap-2">
                <AlertTriangle className="text-orange-500" /> Registrar Desgaste
            </h3>
            <p className="text-[10px] text-slate-400 mb-6 font-bold leading-tight">
                Genera una alerta futura para el cliente. Esto aparecerá en sus informes técnicos hasta que sea reparado.
            </p>

            <form onSubmit={guardarAlertaBD} className="space-y-4">
                <input 
                    value={alertaForm.pieza} 
                    onChange={e => setAlertaForm({...alertaForm, pieza: e.target.value})} 
                    required 
                    placeholder="Nombre de la pieza (Ej: Pastillas de freno)" 
                    className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800 font-bold text-slate-100 outline-none focus:border-orange-500 transition-all text-sm" 
                />
                
                <textarea 
                    value={alertaForm.observacion} 
                    onChange={e => setAlertaForm({...alertaForm, observacion: e.target.value})} 
                    placeholder="Observación (Ej: Queda un 20% de vida útil, suenan al frenar)" 
                    className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800 font-bold text-slate-100 outline-none focus:border-orange-500 resize-none min-h-[80px] transition-all text-sm" 
                />
                
                <div className="mt-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block text-center">
                    Nivel de Riesgo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setAlertaForm({ ...alertaForm, nivel_riesgo: 'Amarillo' })}
                        className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-2 hover:scale-105 ${
                        alertaForm.nivel_riesgo === 'Amarillo' 
                            ? 'border-yellow-500/50 bg-yellow-900/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                            : 'border-transparent bg-slate-900/50 text-slate-500 hover:text-slate-400'
                        }`}
                    >
                        <ShieldAlert size={20} /> Preventivo
                    </button>
                    <button
                        type="button"
                        onClick={() => setAlertaForm({ ...alertaForm, nivel_riesgo: 'Rojo' })}
                        className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-2 hover:scale-105 ${
                        alertaForm.nivel_riesgo === 'Rojo' 
                            ? 'border-red-500/50 bg-red-900/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                            : 'border-transparent bg-slate-900/50 text-slate-500 hover:text-slate-400'
                        }`}
                    >
                        <AlertTriangle size={20} /> Urgente
                    </button>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 font-black text-slate-500 uppercase text-[10px] tracking-widest hover:text-slate-300 transition-colors bg-slate-800 rounded-full py-4">Cancelar</button>
                    <button type="submit" disabled={guardandoAlerta || !alertaForm.pieza.trim()} className={`flex-[2] text-slate-950 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 ${alertaForm.nivel_riesgo === 'Rojo' ? 'bg-red-500 hover:bg-red-400' : 'bg-yellow-500 hover:bg-yellow-400'}`}>
                        {guardandoAlerta ? 'Guardando...' : 'Registrar Alerta'}
                    </button>
                </div>
            </form>
        </div>

        {/* COLUMNA DERECHA: ALERTAS PENDIENTES DEL VEHÍCULO */}
        <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-slate-800/50 pt-8 md:pt-0 md:pl-8 relative z-10 overflow-hidden">
            <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-4">
                <History size={16} className="text-slate-400" /> Historial Pendiente
            </h4>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-2 space-y-3">
                {alertasPendientes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                        <CheckCircle2 size={32} className="mb-2 opacity-50" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">Este vehículo no tiene<br/>alertas pendientes.</p>
                    </div>
                ) : (
                    alertasPendientes.map((alerta: any) => (
                        <div key={alerta.id} className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl group hover:border-slate-600 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className={`font-black text-xs uppercase ${alerta.nivel_riesgo === 'Rojo' ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {alerta.pieza}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Registrada el: {new Date(alerta.created_at).toLocaleDateString('es-CL')}</p>
                                </div>
                            </div>
                            {alerta.observacion && (
                                <p className="text-[10px] text-slate-400 mb-4 bg-slate-900 p-2 rounded-lg leading-snug">
                                    {alerta.observacion}
                                </p>
                            )}
                            <button 
                                onClick={() => {
                                    if(window.confirm(`¿Confirmas que ya reparaste/cambiaste: ${alerta.pieza}?`)) {
                                        resolverAlertaBD(alerta.id);
                                    }
                                }}
                                className="w-full bg-emerald-900/30 hover:bg-emerald-600 text-emerald-500 hover:text-slate-950 border border-emerald-900/50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            >
                                <CheckCircle2 size={14} /> Marcar como Corregido
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  )
}