'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import { Mic, CheckCircle, Camera, Car, Fuel, AlertTriangle, ShieldAlert, X, AlertCircle, Droplets, BatteryWarning, Thermometer, CircleDot, LifeBuoy, Settings, Zap, Wind, Activity } from 'lucide-react'
import Car3DViewer from '@/components/Car3DViewer'

const TESTIGOS_CONFIG = [
    { id: 'check_engine', icon: AlertCircle, label: 'Check Engine', type: 'rojo' },
    { id: 'aceite', icon: Droplets, label: 'Aceite', type: 'rojo' },
    { id: 'bateria', icon: BatteryWarning, label: 'Batería', type: 'rojo' },
    { id: 'temperatura', icon: Thermometer, label: 'Temp.', type: 'rojo' },
    { id: 'frenos', icon: CircleDot, label: 'Frenos', type: 'rojo' },
    { id: 'airbag', icon: LifeBuoy, label: 'Airbag', type: 'rojo' },
    { id: 'abs', icon: AlertCircle, label: 'ABS', type: 'amarillo' },
    { id: 'tpms', icon: Settings, label: 'Neum. TPMS', type: 'amarillo' },
    { id: 'precalentamiento', icon: Zap, label: 'Bujías Pre.', type: 'amarillo' },
    { id: 'dpf', icon: Wind, label: 'Filtro DPF', type: 'amarillo' },
    { id: 'eps', icon: Activity, label: 'Dir. EPS', type: 'amarillo' }
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
    const [previewsRecepcion, setPreviewsRecepcion] = useState<string[]>([])
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-[35px] p-6 w-full max-w-xl shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto custom-scrollbar-dark">
                <h3 className="text-2xl font-black text-slate-100 uppercase">Nueva Orden</h3>
                <p className="text-sm text-slate-400 mb-5 font-bold">{vehiculo.marca} {vehiculo.modelo} <span className="text-emerald-400 ml-1">{vehiculo.patente}</span></p>

                <div className="space-y-4">
                    <div className="relative">
                        <textarea value={descripcionOrden} onChange={(e) => setDescripcionOrden(e.target.value)} className="w-full p-4 pr-14 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-slate-200 outline-none min-h-[80px]" placeholder="Problema Reportado..." />
                        <button type="button" onClick={iniciarDictado} className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${escuchando ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-emerald-400'}`}><Mic size={18} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <input type="number" value={kilometrajeOrden} onChange={(e) => setKilometrajeOrden(e.target.value)} className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-slate-200 outline-none" placeholder="KM" />
                        <input type="number" value={valorDiagnostico} onChange={(e) => setValorDiagnostico(e.target.value)} className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-emerald-400 font-bold outline-none" placeholder="Diag. ($)" />
                        <input value={mecanicoAsignado} onChange={(e) => setMecanicoAsignado(e.target.value)} className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-slate-200 outline-none" placeholder="Mecánico" />
                    </div>

                    <button type="button" onClick={() => setMostrarActa(!mostrarActa)} className={`flex items-center gap-2 text-[10px] font-black uppercase w-full justify-center py-3 rounded-2xl border ${mostrarActa ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400'}`}>
                        {mostrarActa ? <CheckCircle size={14} /> : <Camera size={14} />} Acta de Recepción
                    </button>

                    {mostrarActa && (
                        <div className="mt-4 p-5 bg-slate-950/50 border border-slate-800 rounded-[25px] space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Combustible</label>
                                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
                                    <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
                                        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                                        <g style={{ transform: `rotate(${gradosAguja}deg)`, transformOrigin: '100px 100px', transition: 'transform 1s' }}>
                                            <polygon points="97,100 103,100 100,25" fill="#ef4444" /><circle cx="100" cy="100" r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
                                        </g>
                                    </svg>
                                    <input type="range" min="0" max="100" step="5" value={nivelCombustible} onChange={(e) => setNivelCombustible(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none mt-4" />
                                    <div className={`text-xl font-black mt-2 ${nivelCombustible <= 15 ? 'text-red-400' : 'text-emerald-400'}`}>{nivelCombustible}%</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                {TESTIGOS_CONFIG.map(t => (
                                    <button key={t.id} type="button" onClick={() => toggleTestigo(t.id)} className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${testigosSeleccionados.includes(t.id) ? (t.type==='rojo'?'bg-red-500/20 border-red-500 text-red-400':'bg-yellow-500/20 border-yellow-500 text-yellow-400') : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                                        <t.icon size={16} /> <span className="text-[8px] font-black uppercase text-center">{t.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-slate-800 pt-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Car size={14} className="text-orange-400"/> Mapa 3D</div></label>
                                <Car3DViewer marcadores={marcadoresDanos} setMarcadores={setMarcadoresDanos} soloLectura={false} />
                                <input type="text" value={danosPrevios} onChange={(e) => setDanosPrevios(e.target.value)} placeholder="Notas (Ej: Parachoques trizado)..." className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 mt-2 text-xs text-slate-200 outline-none" />
                            </div>

                            <input type="text" value={objetosValor} onChange={(e) => setObjetosValor(e.target.value)} placeholder="Objetos de Valor..." className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none" />
                        </div>
                    )}
                    
                    <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                        <button type="button" onClick={onClose} disabled={creandoOrden} className="flex-1 text-slate-400 py-3 text-xs font-black uppercase">Cancelar</button>
                        <button type="button" onClick={confirmarNuevaOrden} disabled={creandoOrden || !descripcionOrden.trim()} className="flex-1 bg-emerald-600 text-slate-950 py-3 rounded-full text-xs font-black uppercase">{creandoOrden ? 'Creando...' : 'Abrir Orden'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}