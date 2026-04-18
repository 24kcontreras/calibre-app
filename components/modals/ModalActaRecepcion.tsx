import { X, ClipboardList, Fuel, AlertTriangle, ShieldAlert, Camera } from 'lucide-react';

export default function ModalActaRecepcion({ orden, onClose }: { orden: any, onClose: () => void }) {
    if (!orden) return null;

    // Filtramos solo las fotos que se sacaron durante la recepción inicial
    const fotosRecepcion = orden.fotos_orden?.filter((f: any) => f.descripcion === "Estado Inicial (Recepción)") || [];

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-[35px] p-6 md:p-8 w-full max-w-2xl shadow-2xl relative my-auto">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                {/* Encabezado */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                            <ClipboardList className="text-emerald-500" /> Acta de Recepción
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
                            {orden.vehiculos?.marca} {orden.vehiculos?.modelo} <span className="text-emerald-400 ml-1">{orden.vehiculos?.patente}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                            Ingresado el: {new Date(orden.created_at).toLocaleString('es-CL')}
                        </p>
                    </div>
                    <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-full transition-colors border border-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 relative z-10">
                    {/* Nivel de Combustible */}
                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Fuel size={14} className="text-blue-400" /> Nivel de Combustible
                        </h4>
                        <div className="flex gap-2">
                            {['E', '1/4', '1/2', '3/4', 'F'].map(nivel => (
                                <div key={nivel} className={`flex-1 py-2.5 text-center text-xs font-black rounded-xl border transition-all ${orden.nivel_combustible === nivel ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-105' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                                    {nivel}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Observaciones (Daños y Objetos) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-orange-400" /> Daños Previos
                            </h4>
                            <p className="text-sm text-slate-300 font-bold italic">
                                {orden.danos_previos ? `"${orden.danos_previos}"` : "Sin observaciones registradas."}
                            </p>
                        </div>
                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ShieldAlert size={14} className="text-purple-400" /> Objetos de Valor
                            </h4>
                            <p className="text-sm text-slate-300 font-bold italic">
                                {orden.objetos_valor ? `"${orden.objetos_valor}"` : "Sin objetos de valor declarados."}
                            </p>
                        </div>
                    </div>

                    {/* Evidencia Fotográfica */}
                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Camera size={14} className="text-emerald-400" /> Evidencia Fotográfica
                        </h4>
                        {fotosRecepcion.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {fotosRecepcion.map((foto: any) => (
                                    <a href={foto.url} target="_blank" rel="noreferrer" key={foto.id} className="aspect-square rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-500 transition-colors block shadow-md">
                                        <img src={foto.url} alt="Evidencia Recepción" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No se adjuntaron fotos en la recepción.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}