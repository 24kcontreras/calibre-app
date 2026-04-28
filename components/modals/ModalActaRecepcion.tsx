import { X, ClipboardList, Fuel, AlertTriangle, ShieldAlert, Camera, Car, BatteryWarning, Droplets, AlertCircle, Thermometer, CircleDot, LifeBuoy, Settings, Zap, Wind, Activity, Search, ShieldCheck } from 'lucide-react';
import Car3DViewer from '../Car3DViewer';

// 🔥 LA LÍNEA 4 ES LA QUE SOLUCIONA TU ERROR ROJO DE TYPESCRIPT
export default function ModalActaRecepcion({ orden, onClose }: { orden: any, onClose: () => void }) {
    if (!orden) return null;

    const fotosRecepcion = orden.fotos_orden?.filter((f: any) => f.descripcion === "Estado Inicial (Recepción)") || [];

    let testigosPrendidos: string[] = [];
    try { testigosPrendidos = typeof orden.testigos === 'string' ? JSON.parse(orden.testigos) : (orden.testigos || []); } 
    catch (e) { testigosPrendidos = []; }

    // Leemos los marcadores del modelo 3D
    let marcadoresDanos: any[] = [];
    try { marcadoresDanos = typeof orden.danos_carroceria === 'string' ? JSON.parse(orden.danos_carroceria) : (orden.danos_carroceria || []); } 
    catch (e) { marcadoresDanos = []; }

    const combustibleValue = Number(orden.nivel_combustible) || 0;
    const gradosAguja = (combustibleValue / 100) * 180 - 90;

    const TESTIGOS_CONFIG = [
        { id: 'check_engine', icon: AlertCircle, label: 'Check Engine', type: 'rojo' },
        { id: 'aceite', icon: Droplets, label: 'Presión Aceite', type: 'rojo' },
        { id: 'bateria', icon: BatteryWarning, label: 'Batería', type: 'rojo' },
        { id: 'temperatura', icon: Thermometer, label: 'Temperatura', type: 'rojo' },
        { id: 'frenos', icon: CircleDot, label: 'Frenos', type: 'rojo' },
        { id: 'airbag', icon: LifeBuoy, label: 'Airbag', type: 'rojo' },
        { id: 'abs', icon: AlertCircle, label: 'ABS', type: 'amarillo' },
        { id: 'tpms', icon: Settings, label: 'TPMS (Neum.)', type: 'amarillo' },
        { id: 'precalentamiento', icon: Zap, label: 'Bujías Pre.', type: 'amarillo' },
        { id: 'dpf', icon: Wind, label: 'Filtro DPF', type: 'amarillo' },
        { id: 'eps', icon: Activity, label: 'Dir. EPS', type: 'amarillo' }
    ];

    const testigosRojos = TESTIGOS_CONFIG.filter(t => t.type === 'rojo' && testigosPrendidos.includes(t.id));
    const testigosAmarillos = TESTIGOS_CONFIG.filter(t => t.type === 'amarillo' && testigosPrendidos.includes(t.id));
    const totalTestigos = testigosRojos.length + testigosAmarillos.length;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-[35px] p-6 md:p-8 w-full max-w-4xl shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto custom-scrollbar-dark">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                {/* CABECERA DEL MODAL */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                            <ClipboardList className="text-emerald-500" /> Acta de Recepción
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
                            {orden.vehiculos?.marca} {orden.vehiculos?.modelo} <span className="text-emerald-400 ml-1">{orden.vehiculos?.patente}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-full transition-colors border border-slate-700 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6 relative z-10">
                    
                    {/* 🔥 FASE 2: BLOQUE UNIFICADO DE ESTADO INICIAL */}
                    <div className="bg-slate-800/30 border border-emerald-900/30 rounded-3xl p-5 md:p-6 shadow-inner">
                        
                        {/* Título unificado aclaratorio */}
                        <div className="mb-6 border-b border-slate-700/50 pb-4">
                            <h2 className="text-lg md:text-xl font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={22} /> Estado Inicial de Recepción
                            </h2>
                            <p className="text-[11px] md:text-xs text-slate-400 font-bold mt-2 leading-relaxed">
                                Este es el reporte visual y técnico exacto de cómo ingresó el vehículo a nuestras instalaciones. Documenta daños previos de carrocería, nivel de combustible y alertas en el tablero.
                            </p>
                        </div>

                        {/* Contenido Unificado: 3D primero, luego medidores */}
                        <div className="space-y-4">
                            {/* EL MOTOR 3D GIGANTE AL MEDIO (LECTURA) */}
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Car size={14} className="text-orange-400" /> Mapa de Daños Carrocería 3D
                                </h4>
                                
                                <div className="rounded-xl overflow-hidden border border-slate-800/50 relative">
                                    <Car3DViewer marcadores={marcadoresDanos} soloLectura={true} />
                                </div>

                                <p className="text-[11px] text-slate-300 font-bold italic text-center w-full mt-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                                    {orden.danos_previos ? `"${orden.danos_previos}"` : "Carrocería sin detalles adicionales reportados."}
                                </p>
                            </div>

                            {/* Combustible y Testigos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Fuel size={14} className="text-blue-400" /> Nivel de Combustible
                                    </h4>
                                    <div className="relative pt-2 pb-2 px-4 flex flex-col items-center">
                                        <svg viewBox="0 0 200 120" className="w-full max-w-[200px] drop-shadow-[0_0_15px_rgba(51,65,85,0.5)]">
                                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                                            <line x1="20" y1="100" x2="35" y2="100" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/> 
                                            <line x1="43" y1="43" x2="54" y2="54" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/> 
                                            <line x1="100" y1="20" x2="100" y2="35" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/> 
                                            <line x1="157" y1="43" x2="146" y2="54" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/> 
                                            <line x1="180" y1="100" x2="165" y2="100" stroke="#10b981" strokeWidth="6" strokeLinecap="round"/> 
                                            <g style={{ transform: `rotate(${gradosAguja}deg)`, transformOrigin: '100px 100px', transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                                <polygon points="97,100 103,100 100,25" fill="#ef4444" />
                                                <circle cx="100" cy="100" r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
                                            </g>
                                            <text x="28" y="118" fill="#ef4444" fontSize="16" fontWeight="900" textAnchor="middle">E</text>
                                            <text x="100" y="55" fill="#64748b" fontSize="14" fontWeight="bold" textAnchor="middle">1/2</text>
                                            <text x="172" y="118" fill="#10b981" fontSize="16" fontWeight="900" textAnchor="middle">F</text>
                                        </svg>
                                        <div className={`text-center mt-2 font-black text-xl tracking-tighter ${combustibleValue <= 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {combustibleValue}%
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <AlertTriangle size={14} className="text-red-400" /> Testigos Encendidos
                                    </h4>
                                    {totalTestigos > 0 ? (
                                        <div className="space-y-3 overflow-y-auto custom-scrollbar-dark pr-1 flex-1 max-h-[140px]">
                                            {testigosRojos.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {testigosRojos.map(t => (
                                                        <div key={t.id} className="flex items-center gap-1.5 bg-red-950/30 border border-red-900/50 px-2 py-2 rounded-lg text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                                            <t.icon size={14} className="shrink-0" /> <span className="text-[9px] font-black uppercase truncate">{t.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {testigosAmarillos.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {testigosAmarillos.map(t => (
                                                        <div key={t.id} className="flex items-center gap-1.5 bg-yellow-950/30 border border-yellow-900/50 px-2 py-2 rounded-lg text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                                            <t.icon size={14} className="shrink-0" /> <span className="text-[9px] font-black uppercase truncate">{t.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-xl p-4 bg-slate-900/30">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tablero limpio (Sin alertas)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* FIN DEL BLOQUE UNIFICADO */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 flex flex-col justify-center">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ShieldAlert size={14} className="text-purple-400" /> Objetos de Valor Declarados
                            </h4>
                            <p className="text-[11px] text-slate-300 font-bold italic bg-slate-900 p-4 rounded-xl border border-slate-800">
                                {orden.objetos_valor ? `"${orden.objetos_valor}"` : "Sin objetos de valor declarados."}
                            </p>
                        </div>
                        
                        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Camera size={14} className="text-emerald-400" /> Evidencia Fotográfica
                            </h4>
                            {fotosRecepcion.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {fotosRecepcion.map((foto: any) => (
                                        <a href={foto.url} target="_blank" rel="noreferrer" key={foto.id} className="aspect-square rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-500 transition-colors block shadow-md group relative">
                                            <img src={foto.url} alt="Evidencia" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Search size={24} className="text-white" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No se adjuntaron fotos.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}