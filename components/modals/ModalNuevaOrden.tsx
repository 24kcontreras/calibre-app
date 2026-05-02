'use client'
import { useState, useEffect } from 'react' // 🔥 Aseguramos tener useEffect
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import { Mic, CheckCircle, Camera, Car, Fuel, AlertTriangle, X, Undo2, ShieldCheck, DollarSign, Clock } from 'lucide-react'
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
    const [marcadoresDanos, setMarcadoresDanos] = useState<any[]>([])
    const [fotosRecepcion, setFotosRecepcion] = useState<File[]>([])
    const [escuchando, setEscuchando] = useState(false)
    const [danosPrevios, setDanosPrevios] = useState('')
    
    // 🔥 Lógica de Promesa de Entrega con Atajos
    const [fechaPromesa, setFechaPromesa] = useState<string>('')
    const [definirFechaLuego, setDefinirFechaLuego] = useState(true)
    
    // 🔥 ESTADO DE LA LISTA DE MECÁNICOS
    const [listaMecanicos, setListaMecanicos] = useState<any[]>([])

    // 🔥 EFECTO PARA CARGAR LOS MECÁNICOS DESDE SUPABASE
    useEffect(() => {
        const cargarMecanicos = async () => {
            let tallerId = session?.user?.id;
            if (!tallerId) {
                const credencial = localStorage.getItem('calibre_mecanico_session');
                if (credencial) tallerId = JSON.parse(credencial).taller_id;
            }

            if (tallerId) {
                const { data } = await supabase
                    .from('mecanicos')
                    .select('id, nombre')
                    .eq('taller_id', tallerId)
                    .eq('activo', true)
                    .order('nombre', { ascending: true });
                
                if (data) setListaMecanicos(data);
            }
        };
        cargarMecanicos();
    }, [session]);

    const setTiempoAtajo = (horas: number | 'tarde') => {
        const ahora = new Date();
        if (horas === 'tarde') {
            ahora.setHours(18, 30, 0); 
        } else {
            ahora.setHours(ahora.getHours() + horas);
        }
        const tzOffset = ahora.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(ahora.getTime() - tzOffset)).toISOString().slice(0, 16);
        setFechaPromesa(localISOTime);
        setDefinirFechaLuego(false);
    };

    const toggleTestigo = (id: string) => setTestigosSeleccionados(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

    const iniciarDictado = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Tu navegador no soporta voz.");
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CL';
        recognition.onstart = () => { setEscuchando(true); toast('Escuchando...', { icon: '🎙️' }); };
        recognition.onresult = (e: any) => { setDescripcionOrden(prev => prev ? prev + " " + e.results[0][0].transcript : e.results[0][0].transcript); toast.success("Voz capturada"); };
        recognition.onend = () => setEscuchando(false);
        recognition.start();
    };

    const deshacerUltimoPunto = () => {
        if (marcadoresDanos.length > 0) {
            setMarcadoresDanos(prev => prev.slice(0, -1));
        }
    };

    const removerFoto = (index: number) => {
        setFotosRecepcion(prev => prev.filter((_, i) => i !== index));
    };

    const confirmarNuevaOrden = async () => {
        if (soloLectura) return;
        setCreandoOrden(true);
        const toastId = toast.loading("Abriendo orden...");
        try {
            const { data: ordenExistente } = await supabase.from('ordenes_trabajo').select('id').eq('vehiculo_id', vehiculo.id).eq('estado', 'Abierta').maybeSingle();
            if (ordenExistente) { toast.error("Este vehículo ya tiene una orden abierta.", { id: toastId }); return onClose(); }

            const payload = {
                vehiculo_id: vehiculo.id,
                estado: 'Abierta',
                sub_estado: 'Diagnóstico',
                descripcion: descripcionOrden,
                mecanico: mecanicoAsignado || 'Sin asignar',
                kilometraje: parseInt(kilometrajeOrden) || null,
                costo_revision: valorDiagnostico ? parseInt(valorDiagnostico) : 0,
                fecha_promesa: definirFechaLuego ? null : fechaPromesa, 
                nivel_combustible: mostrarActa ? nivelCombustible : null,
                testigos: mostrarActa ? JSON.stringify(testigosSeleccionados) : null,
                danos_carroceria: mostrarActa ? JSON.stringify(marcadoresDanos) : null,
                danos_previos: mostrarActa ? danosPrevios : null
            };

            const { data: nuevaOrden, error } = await supabase.from('ordenes_trabajo').insert([payload]).select();
            if (error) throw error;
            const ordenId = nuevaOrden[0].id;

            // 🔥 SUBIDA DE FOTOS
            if (mostrarActa && fotosRecepcion.length > 0) {
                toast.loading(`Subiendo ${fotosRecepcion.length} fotos...`, { id: toastId });
                for (const foto of fotosRecepcion) {
                    const compressed = await imageCompression(foto, { maxSizeMB: 0.4, maxWidthOrHeight: 1280, useWebWorker: true });
                    const fileName = `${ordenId}/recepcion_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                    const { error: sErr } = await supabase.storage.from('evidencia').upload(fileName, compressed);
                    if (!sErr) {
                        const { data: { publicUrl } } = supabase.storage.from('evidencia').getPublicUrl(fileName);
                        await supabase.from('fotos_orden').insert([{ orden_id: ordenId, url: publicUrl, descripcion: "Evidencia Inicial de Recepción" }]);
                    }
                }
            }

            toast.success("¡Orden abierta correctamente!", { id: toastId });
            await cargarTodo();
            onClose();
        } catch (error) {
            toast.error("Error al crear orden", { id: toastId });
        } finally {
            setCreandoOrden(false);
        }
    }

    const gradosAguja = (nivelCombustible / 100) * 180 - 90;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="bg-slate-900 border border-slate-700/50 rounded-[35px] p-6 w-full max-w-xl shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto custom-scrollbar-dark">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-emerald-400 transition-colors bg-slate-900 p-1.5 rounded-full border border-slate-800 z-20"><X size={20} /></button>

                <h3 className="text-2xl font-black text-slate-100 uppercase">Apertura de Orden</h3>
                <div className="flex items-center gap-2 mb-5">
                    <span className="w-3 h-3 rounded-full border border-slate-600 shadow-inner" style={{ backgroundColor: vehiculo.color || '#94a3b8' }}></span>
                    <p className="text-sm text-slate-400 font-bold">{vehiculo.marca} {vehiculo.modelo} | <span className="text-emerald-400">{vehiculo.patente}</span></p>
                </div>

                <div className="space-y-4">
                    {/* Motivo de ingreso */}
                    <div className="relative">
                        <textarea value={descripcionOrden} onChange={(e) => setDescripcionOrden(e.target.value)} className="w-full p-4 pr-14 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none min-h-[100px] focus:border-emerald-500 transition-colors" placeholder="Motivo de ingreso o falla reportada por el cliente..." />
                        <button type="button" onClick={iniciarDictado} className={`absolute right-3 top-3 p-2 rounded-xl transition-all shadow-md ${escuchando ? 'bg-red-500 animate-pulse text-white' : 'bg-slate-800 text-emerald-400 hover:bg-emerald-900 hover:text-emerald-300'}`}><Mic size={18} /></button>
                    </div>

                    {/* Fila: KM y Mecánico */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">KM Actual</label>
                            <input type="number" value={kilometrajeOrden} onChange={(e) => setKilometrajeOrden(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500" placeholder="000.000" />
                        </div>
                        <div className="space-y-1">
                            {/* 🔥 NUEVO DESPLEGABLE DE MECÁNICOS */}
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Mecánico Asignado</label>
                            <select 
                                value={mecanicoAsignado} 
                                onChange={(e) => setMecanicoAsignado(e.target.value)} 
                                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500 appearance-none"
                            >
                                <option value="" disabled>Seleccionar...</option>
                                {listaMecanicos.map(mec => (
                                    <option key={mec.id} value={mec.nombre}>
                                        {mec.nombre}
                                    </option>
                                ))}
                                <option value="Sin asignar">Dejar sin asignar por ahora</option>
                            </select>
                        </div>
                    </div>

                    {/* 🔥 PROMESA DE ENTREGA CON ATAJOS */}
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-blue-400" /> Promesa de Entrega
                        </label>
                        
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setTiempoAtajo(1)} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">En 1 Hora</button>
                            <button type="button" onClick={() => setTiempoAtajo(2)} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">En 2 Horas</button>
                            <button type="button" onClick={() => setTiempoAtajo('tarde')} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">Hoy Tarde</button>
                            <button type="button" onClick={() => setDefinirFechaLuego(true)} className={`flex-1 text-[9px] font-black py-2 rounded-lg border transition-all ${definirFechaLuego ? 'bg-orange-600 text-white border-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.4)]' : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}>MÁS TARDE</button>
                        </div>

                        {!definirFechaLuego && (
                            <div className="relative mt-2 animate-in fade-in zoom-in duration-200">
                                <input 
                                    type="datetime-local" 
                                    value={fechaPromesa} 
                                    onChange={(e) => { setFechaPromesa(e.target.value); setDefinirFechaLuego(false); }}
                                    className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        )}
                    </div>

                    {/* Botón para expandir Acta */}
                    <button type="button" onClick={() => setMostrarActa(!mostrarActa)} className={`w-full py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${mostrarActa ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        {mostrarActa ? '✓ Acta Completada' : '📋 Acta de Recepción'}
                    </button>

                    {/* 🔥 EL CONTENIDO DEL ACTA QUE SE HABÍA PERDIDO */}
                    {mostrarActa && (
                        <div className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-800/20 p-4 md:p-5 rounded-3xl border border-slate-700/50">
                            
                            {/* CÁMARA */}
                            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Camera size={14} className="text-emerald-400" /> Registro Fotográfico Visual
                                </h4>
                                
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    id="foto-recepcion-input"
                                    onChange={(e) => setFotosRecepcion(prev => [...prev, ...Array.from(e.target.files || [])])}
                                    className="hidden"
                                />
                                <label 
                                    htmlFor="foto-recepcion-input"
                                    className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-emerald-500/50 rounded-2xl bg-emerald-950/20 hover:bg-emerald-900/40 transition-colors cursor-pointer group shadow-sm"
                                >
                                    <div className="bg-emerald-500/20 p-3.5 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <Camera size={26} className="text-emerald-400" />
                                    </div>
                                    <span className="text-sm font-black text-emerald-400 uppercase tracking-widest text-center">Toca Aquí Para Tomar Fotos</span>
                                    <span className="text-[10px] text-emerald-500/60 font-bold mt-1 text-center px-4">Evidencia de rayones, tablero o nivel de bencina.</span>
                                </label>

                                {fotosRecepcion.length > 0 && (
                                    <div className="flex gap-3 mt-4 overflow-x-auto custom-scrollbar-dark pb-2">
                                        {fotosRecepcion.map((foto, idx) => (
                                            <div key={idx} className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 border-2 border-emerald-500/30 shadow-md">
                                                <img src={URL.createObjectURL(foto)} alt="Preview" className="w-full h-full object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.preventDefault(); removerFoto(idx); }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md hover:bg-red-600 hover:scale-110 transition-transform shadow-lg"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* MAPA 3D */}
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Car size={14} className="text-orange-400"/> Mapa de Daños 3D
                                    </h4>
                                    {marcadoresDanos.length > 0 && (
                                        <button type="button" onClick={deshacerUltimoPunto} className="flex items-center gap-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 px-3 py-1.5 rounded-lg transition-all border border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                                            <Undo2 size={12} /> Deshacer Último Punto
                                        </button>
                                    )}
                                </div>
                                <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/50 bg-slate-900/50 flex justify-center items-center">
                                    <Car3DViewer marcadores={marcadoresDanos} setMarcadores={setMarcadoresDanos} soloLectura={false} colorAuto={vehiculo.color} />
                                </div>
                                <input type="text" value={danosPrevios} onChange={(e) => setDanosPrevios(e.target.value)} placeholder="Notas adicionales de carrocería (Opcional)..." className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 mt-3 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-colors" />
                            </div>

                            {/* BENCINA Y TESTIGOS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col shadow-inner">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Fuel size={14} className="text-blue-400" /> Nivel Combustible
                                    </h4>
                                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex flex-col items-center flex-1 justify-center">
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

                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
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
                    )}

                    {/* COBRO DIAGNÓSTICO */}
                    <div className="pt-2">
                        <div className="flex items-center gap-3 bg-slate-800/40 p-4 rounded-2xl border border-dashed border-slate-700 hover:border-emerald-500/50 transition-colors">
                            <div className="bg-slate-900 p-2.5 rounded-xl text-emerald-500 border border-slate-800 shadow-inner"><DollarSign size={20}/></div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cobro por Diagnóstico / Revisión Inicial</p>
                                <input 
                                    type="number" 
                                    value={valorDiagnostico} 
                                    onChange={(e) => setValorDiagnostico(e.target.value)} 
                                    className="bg-transparent w-full text-base font-black text-emerald-400 outline-none placeholder:text-slate-600" 
                                    placeholder="Dejar en blanco si es $0 o no aplica..." 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-5 border-t border-slate-800/50">
                        <button type="button" onClick={onClose} className="flex-1 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-300 transition-colors">Cancelar</button>
                        <button 
                            type="button" 
                            onClick={confirmarNuevaOrden} 
                            disabled={creandoOrden || !descripcionOrden.trim()} 
                            className="flex-[2] bg-emerald-600 text-slate-950 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 hover:bg-emerald-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            {creandoOrden ? 'Creando Orden...' : <><ShieldCheck size={16}/> Abrir Orden y Notificar</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}