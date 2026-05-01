'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import toast from 'react-hot-toast'
import { Mic, CheckCircle, Camera, Car, Fuel, AlertTriangle, X, Undo2, ShieldCheck, CalendarClock, DollarSign, Clock } from 'lucide-react'
import Car3DViewer from '@/components/Car3DViewer'

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

    const setTiempoAtajo = (horas: number | 'tarde') => {
        const ahora = new Date();
        if (horas === 'tarde') {
            ahora.setHours(18, 30, 0); // Seteamos a las 6:30 PM
        } else {
            ahora.setHours(ahora.getHours() + horas);
        }
        // Ajuste de formato para input datetime-local (YYYY-MM-DDThh:mm)
        const tzOffset = ahora.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(ahora.getTime() - tzOffset)).toISOString().slice(0, 16);
        setFechaPromesa(localISOTime);
        setDefinirFechaLuego(false);
    };

    // ... (iniciarDictado, confirmarNuevaOrden, etc. se mantienen igual al anterior)
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

            if (mostrarActa && fotosRecepcion.length > 0) {
                for (const foto of fotosRecepcion) {
                    const compressed = await imageCompression(foto, { maxSizeMB: 0.4, maxWidthOrHeight: 1280, useWebWorker: true });
                    const fileName = `${ordenId}/recepcion_${Date.now()}.jpg`;
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
            toast.error("Error al crear orden");
        } finally {
            setCreandoOrden(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700/50 rounded-[35px] p-6 w-full max-w-xl shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto custom-scrollbar-dark">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-emerald-400 z-20"><X size={20} /></button>

                <h3 className="text-2xl font-black text-slate-100 uppercase">Apertura de Orden</h3>
                <p className="text-sm text-slate-400 mb-5 font-bold">{vehiculo.marca} {vehiculo.modelo} | <span className="text-emerald-400">{vehiculo.patente}</span></p>

                <div className="space-y-4">
                    <div className="relative">
                        <textarea value={descripcionOrden} onChange={(e) => setDescripcionOrden(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none min-h-[100px]" placeholder="Motivo de ingreso..." />
                        <button type="button" onClick={iniciarDictado} className={`absolute right-3 top-3 p-2 rounded-xl ${escuchando ? 'bg-red-500 animate-pulse text-white' : 'bg-slate-800 text-emerald-400'}`}><Mic size={18} /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" value={kilometrajeOrden} onChange={(e) => setKilometrajeOrden(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none" placeholder="KM Actual" />
                        <input value={mecanicoAsignado} onChange={(e) => setMecanicoAsignado(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none" placeholder="Mecánico..." />
                    </div>

                    {/* 🔥 PROMESA DE ENTREGA CON ATAJOS */}
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-blue-400" /> Promesa de Entrega
                        </label>
                        
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setTiempoAtajo(1)} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">En 1 Hora</button>
                            <button type="button" onClick={() => setTiempoAtajo(2)} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">En 2 Horas</button>
                            <button type="button" onClick={() => setTiempoAtajo('tarde')} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">Hoy Tarde</button>
                            <button type="button" onClick={() => setDefinirFechaLuego(true)} className={`flex-1 text-[9px] font-black py-2 rounded-lg border transition-all ${definirFechaLuego ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>MÁS TARDE</button>
                        </div>

                        <div className="relative">
                            <input 
                                type="datetime-local" 
                                value={fechaPromesa} 
                                onChange={(e) => { setFechaPromesa(e.target.value); setDefinirFechaLuego(false); }}
                                className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Botón simplificado */}
                    <button type="button" onClick={() => setMostrarActa(!mostrarActa)} className={`w-full py-3 rounded-2xl border text-[10px] font-black uppercase transition-all ${mostrarActa ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                        {mostrarActa ? '✓ Acta Completada' : '📋 Acta de Recepción'}
                    </button>

                    {/* ... Resto del Acta, Combustible, Testigos y Botón de Abrir Orden se mantienen igual */}
                    <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                        <button type="button" onClick={onClose} className="flex-1 text-slate-500 font-black uppercase text-xs">Cancelar</button>
                        <button type="button" onClick={confirmarNuevaOrden} disabled={creandoOrden || !descripcionOrden.trim()} className="flex-[2] bg-emerald-600 text-slate-950 py-4 rounded-full text-xs font-black uppercase shadow-lg">{creandoOrden ? 'Procesando...' : 'Abrir Orden'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}