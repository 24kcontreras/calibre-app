'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { X, Save, Clock, Calendar, User, Clipboard } from 'lucide-react'

export default function ModalEditarOrden({ orden, onClose, cargarTodo, soloLectura }: any) {
    const [descripcion, setDescripcion] = useState(orden.descripcion || '')
    const [kilometraje, setKilometraje] = useState(orden.kilometraje || '')
    const [mecanico, setMecanico] = useState(orden.mecanico || '')
    const [fechaPromesa, setFechaPromesa] = useState(orden.fecha_promesa ? orden.fecha_promesa.slice(0, 16) : '')
    const [objetosValor, setObjetosValor] = useState(orden.objetos_valor || '')
    const [guardando, setGuardando] = useState(false)

    const setTiempoAtajo = (horas: number | 'tarde') => {
        const ahora = new Date();
        if (horas === 'tarde') { ahora.setHours(18, 30, 0); } 
        else { ahora.setHours(ahora.getHours() + horas); }
        const tzOffset = ahora.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(ahora.getTime() - tzOffset)).toISOString().slice(0, 16);
        setFechaPromesa(localISOTime);
    };

    const guardarCambios = async () => {
        if (soloLectura) return;
        setGuardando(true);
        try {
            const { error } = await supabase.from('ordenes_trabajo').update({
                descripcion,
                kilometraje: parseInt(kilometraje) || null,
                mecanico,
                fecha_promesa: fechaPromesa || null,
                objetos_valor: objetosValor
            }).eq('id', orden.id);

            if (error) throw error;
            toast.success("Orden actualizada");
            await cargarTodo();
            onClose();
        } catch (error) {
            toast.error("Error al guardar cambios");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>

                <h3 className="text-xl font-black text-slate-100 uppercase mb-1">Gestionar Orden</h3>
                <p className="text-xs text-slate-500 font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: orden.vehiculos?.color }}></span>
                    {orden.vehiculos?.marca} {orden.vehiculos?.modelo} | {orden.vehiculos?.patente}
                </p>

                <div className="space-y-5">
                    {/* 🔥 ATAJOS DE FECHA PROMESA (Lo que faltaba) */}
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl space-y-3">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} /> Definir Promesa de Entrega
                        </label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setTiempoAtajo(1)} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">1 Hora</button>
                            <button type="button" onClick={() => setTiempoAtajo(2)} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">2 Horas</button>
                            <button type="button" onClick={() => setTiempoAtajo('tarde')} className="flex-1 bg-slate-800 hover:bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg border border-slate-700 transition-colors uppercase">Hoy Tarde</button>
                        </div>
                        <input 
                            type="datetime-local" 
                            value={fechaPromesa} 
                            onChange={(e) => setFechaPromesa(e.target.value)}
                            className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-slate-200 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1.5 mb-1.5"><Clipboard size={12}/> Problema / Motivo</label>
                            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none min-h-[80px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1.5 mb-1.5"><Save size={12}/> KM Actual</label>
                                <input type="number" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1.5 mb-1.5"><User size={12}/> Mecánico</label>
                                <input value={mecanico} onChange={(e) => setMecanico(e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1.5 mb-1.5">📦 Inventario de Objetos</label>
                            <textarea value={objetosValor} onChange={(e) => setObjetosValor(e.target.value)} placeholder="Ej: Radio, Gafas, Soporte celular..." className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none min-h-[60px]" />
                        </div>
                    </div>

                    <button 
                        onClick={guardarCambios} 
                        disabled={guardando} 
                        className="w-full bg-blue-600 text-white py-4 rounded-full text-xs font-black uppercase shadow-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                        {guardando ? 'Guardando...' : <><Save size={16}/> Guardar Cambios</>}
                    </button>
                </div>
            </div>
        </div>
    )
}