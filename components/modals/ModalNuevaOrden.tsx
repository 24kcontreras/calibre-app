'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import { Mic, CheckCircle, Camera, Car, Fuel, AlertTriangle, ShieldAlert, X, AlertCircle, Droplets, BatteryWarning, Thermometer, CircleDot, LifeBuoy, Settings, Zap, Wind, Activity, Undo2, ShieldCheck } from 'lucide-react'
import Car3DViewer from '@/components/Car3DViewer'

const TESTIGOS_CONFIG = [
    { id: 'check_engine', imgSrc: '/testigos/check_engine.png', label: 'Check Engine', type: 'rojo' },
    { id: 'aceite', imgSrc: '/testigos/aceite.png', label: 'Aceite', type: 'rojo' },
    { id: 'bateria', imgSrc: '/testigos/bateria.png', label: 'Batería', type: 'rojo' },
    { id: 'temperatura', imgSrc: '/testigos/temperatura.png', label: 'Temp.', type: 'rojo' },
    { id: 'frenos', imgSrc: '/testigos/frenos.png', label: 'Frenos', type: 'rojo' },
    { id: 'airbag', imgSrc: '/testigos/airbag.png', label: 'Airbag', type: 'rojo' },
    { id: 'abs', imgSrc: '/testigos/abs.png', label: 'ABS', type: 'amarillo' },
    { id: 'tpms', imgSrc: '/testigos/tpms.png', label: 'Neum. TPMS', type: 'amarillo' },
    { id: 'precalentamiento', imgSrc: '/testigos/precalentamiento.png', label: 'Bujías Pre.', type: 'amarillo' },
    { id: 'dpf', imgSrc: '/testigos/dpf.png', label: 'Filtro DPF', type: 'amarillo' },
    { id: 'eps', imgSrc: '/testigos/eps.png', label: 'Dir. EPS', type: 'amarillo' }
];

export default function ModalNuevaOrden({ vehiculo, onClose, soloLectura, session, cargarTodo }: any) {
    const [descripcionOrden, setDescripcionOrden] = useState('')
    const [valorDiagnostico, setValorDiagnostico] = useState('')
    const [mecanicoAsignado, setMecanicoAsignado] = useState('')
    const [kilometrajeOrden, setKilometrajeOrden] = useState('') 
    const [creandoOrden, setCreandoOrden] = useState(false)
    const [mostrarActa, setMostrarActa] = useState(false)
    const [nivelCombustible, setNivelCombustible] = useState<number>(50)
    const [testigosSeleccionados, setTestigosSeleccionados] = useState<string[]>([])
    const [objetosValor, setObjetosValor] = useState('')
    const [danosPrevios, setDanosPrevios] = useState('')
    const [marcadoresDanos, setMarcadoresDanos] = useState<any[]>([])
    const [fotosRecepcion, setFotosRecepcion] = useState<File[]>([])
    const [escuchando, setEscuchando] = useState(false)

    const toggleTestigo = (id: string) => setTestigosSeleccionados(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

    const iniciarDictado = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Tu navegador no soporta dictado por voz.");
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CL';
        recognition.onstart = () => { setEscuchando(true); toast('Escuchando...', { icon: '🎙️' }); };
        recognition.onresult = (e: any) => { setDescripcionOrden(descripcionOrden ? `${descripcionOrden} ${e.results[0][0].transcript}` : e.results[0][0].transcript); toast.success("Voz capturada"); };
        recognition.onend = () => setEscuchando(false);
        try { recognition.start(); } catch(e) { setEscuchando(false); }
    };

    const deshacerUltimoPunto = () => {
        if (marcadoresDanos.length > 0) {
            setMarcadoresDanos(prev => prev.slice(0, -1));
        }
    };

    const confirmarNuevaOrden = async () => {
        if (soloLectura) return;
        setCreandoOrden(true);
        const toastId = toast.loading("Creando orden...");
        try {
            const { data: ordenExistente } = await supabase.from('ordenes_trabajo').select('id').eq('vehiculo_id', vehiculo.id).eq('estado', 'Abierta').maybeSingle();
            if (ordenExistente) { toast.error("Este vehículo ya tiene una orden abierta.", { id: toastId }); return onClose(); }

            const payloadOrden = {
                vehiculo_id: vehiculo.id, estado: 'Abierta', sub_estado: 'Diagnóstico', descripcion: descripcionOrden, mecanico: mecanicoAsignado.trim() || 'Sin asignar',
                kilometraje: kilometrajeOrden ? parseInt(kilometrajeOrden) : null, nivel_combustible: mostrarActa ? nivelCombustible : null, testigos: mostrarActa ? JSON.stringify(testigosSeleccionados) : null,
                objetos_valor: mostrarActa ? objetosValor : null, danos_previos: mostrarActa ? danosPrevios : null, danos_carroceria: mostrarActa ? JSON.stringify(marcadoresDanos) : null, costo_revision: valorDiagnostico ? parseInt(valorDiagnostico) : 0 
            };
            const { data: nuevaOrden, error } = await supabase.from('ordenes_trabajo').insert([payloadOrden]).select();
            if (error) throw error;
            const ordenId = nuevaOrden[0].id;

            if (mostrarActa && fotosRecepcion.length > 0) {
                toast.loading("Subiendo fotos...", { id: toastId });
                for (const foto of fotosRecepcion) {
                    const compressed = await imageCompression(foto, { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true });
                    const fileName = `${ordenId}/recepcion_${Date.now()}.jpg`;
                    const { error: sErr } = await supabase.storage.from('evidencia').upload(fileName, compressed);
                    if (!sErr) await supabase.from('fotos_orden').insert([{ orden_id: ordenId, url: supabase.storage.from('evidencia').getPublicUrl(fileName).data.publicUrl, descripcion: "Estado Inicial (Recepción)" }]);
                }
            }
            toast.success("¡Orden ingresada a la Pizarra!", { id: toastId });
            await cargarTodo(); 
            onClose(); 
        } catch (error: any) { toast.error("Error al crear la orden", { id: toastId }); } 
        finally { setCreandoOrden(false); }
    }

    const gradosAguja = (nivelCombustible / 100) * 180 - 90;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-[35px] p-6 w-full max-w-xl shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto custom-scrollbar-dark">
                
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-emerald-400 transition-colors z-20 bg-slate-900/50 rounded-full p-1 border border-slate-700 shadow-sm">
                    <X size={20} />
                </button>

                <h3 className="text-2xl font-black text-slate-100 uppercase">Nueva Orden</h3>
                <p className="text-sm text-slate-400 mb-5 font-bold">{vehiculo.marca} {vehiculo.modelo} <span className="text-emerald-400 ml-1">{vehiculo.patente}</span></p>

                <div className="space-y-4">
                    <div className="relative">
                        <textarea value={descripcionOrden} onChange={(e) => setDescripcionOrden(e.target.value)} className="w-full p-4 pr-14 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-slate-200 outline-none min-h-[80px] custom-scrollbar-dark" placeholder="Problema Reportado..." />
                        <button type="button" onClick={iniciarDictado} className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${escuchando ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-emerald-400'}`}><Mic size={18} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <input type="number" value={kilometrajeOrden} onChange={(e) => setKilometrajeOrden(e.target.value)} className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-slate-200 outline-none" placeholder="KM" />
                        <input type="number" value={valorDiagnostico} onChange={(e) => setValorDiagnostico(e.target.value)} className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-emerald-400 font-bold outline-none" placeholder="Diag. ($)" />
                        <input value={mecanicoAsignado} onChange={(e) => setMecanicoAsignado(e.target.value)} className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-slate-200 outline-none" placeholder="Mecánico" />
                    </div>

                    <button type="button" onClick={() => setMostrarActa(!mostrarActa)} className={`flex items-center gap-2 text-[10px] font-black uppercase w-full justify-center py-3 rounded-2xl border transition-all ${mostrarActa ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}>
                        {mostrarActa ? <CheckCircle size={14} /> : <Camera size={14} />} Acta de Recepción
                    </button>

                    {mostrarActa && (
                        <div className="mt-4 space-y-6">
                            
                            {/* 🔥 FASE 2: BLOQUE UNIFICADO DE CREACIÓN */}
                            <div className="bg-slate-800/30 border border-emerald-900/30 rounded-3xl p-5 shadow-inner">
                                <div className="mb-6 border-b border-slate-700/50 pb-4">
                                    <h2 className="text-lg md:text-xl font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={22} /> Estado Inicial de Recepción
                                    </h2>
                                    <p className="text-[11px] md:text-xs text-slate-400 font-bold mt-2 leading-relaxed">
                                        Registra el estado visual y técnico exacto de cómo ingresa el vehículo. Documenta daños previos de carrocería, nivel de combustible y alertas en el tablero.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Mapa 3D */}
                                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <Car size={14} className="text-orange-400"/> Mapa de Daños 3D
                                            </h4>
                                            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-sm">
                                                <span className="text-[9px] font-black text-slate-400 px-3 py-1 flex items-center gap-1.5">
                                                    Daños: <span className="text-orange-400 text-xs">{marcadoresDanos.length}</span>
                                                </span>
                                                {marcadoresDanos.length > 0 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={deshacerUltimoPunto} 
                                                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 px-3 py-1 transition-all border-l border-slate-700 text-[10px] font-bold uppercase tracking-wider"
                                                    >
                                                        <Undo2 size={12} /> Deshacer
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/50 bg-slate-900/50 flex justify-center items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            <Car3DViewer marcadores={marcadoresDanos} setMarcadores={setMarcadoresDanos} soloLectura={false} />
                                        </div>
                                        <input type="text" value={danosPrevios} onChange={(e) => setDanosPrevios(e.target.value)} placeholder="Notas adicionales de carrocería (Opcional)..." className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 mt-3 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors" />
                                    </div>

                                    {/* Grid Combustible y Testigos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Fuel size={14} className="text-blue-400" /> Nivel Combustible
                                            </h4>
                                            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center flex-1 justify-center">
                                                <svg viewBox="0 0 200 120" className="w-full max-w-[160px] drop-shadow-[0_0_15px_rgba(51,65,85,0.5)]">
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
                                                <input type="range" min="0" max="100" step="5" value={nivelCombustible} onChange={(e) => setNivelCombustible(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none mt-4" />
                                                <div className={`text-lg font-black mt-2 ${nivelCombustible <= 15 ? 'text-red-400' : 'text-emerald-400'}`}>{nivelCombustible}%</div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <AlertTriangle size={14} className="text-red-400" /> Testigos (Marcar)
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto custom-scrollbar-dark pr-1">
                                                {TESTIGOS_CONFIG.map(t => (
                                                    <button key={t.id} type="button" onClick={() => toggleTestigo(t.id)} className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-300 ${testigosSeleccionados.includes(t.id) ? (t.type==='rojo'?'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]':'bg-yellow-500/10 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]') : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                                                        <img src={t.imgSrc} alt={t.label} className="w-6 h-6 object-contain brightness-150 contrast-125 saturate-150 drop-shadow-md" />
                                                        <span className="text-[7px] font-black uppercase text-center leading-tight">{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Objetos de Valor Independientes */}
                            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ShieldAlert size={14} className="text-purple-400" /> Objetos de Valor Declarados
                                </h4>
                                <input type="text" value={objetosValor} onChange={(e) => setObjetosValor(e.target.value)} placeholder="Ej: Lentes de sol, Silla de bebé, Dinero..." className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors" />
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                        <button type="button" onClick={onClose} disabled={creandoOrden} className="flex-1 text-slate-400 hover:text-slate-300 transition-colors py-3 text-xs font-black uppercase">Cancelar</button>
                        <button type="button" onClick={confirmarNuevaOrden} disabled={creandoOrden || !descripcionOrden.trim()} className="flex-1 bg-emerald-600 text-slate-950 py-3 rounded-full text-xs font-black uppercase hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:shadow-none">{creandoOrden ? 'Creando...' : 'Abrir Orden'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}