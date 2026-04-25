'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ModalEditarOrden({ orden, onClose, soloLectura, cargarTodo }: any) {
    const [editFalla, setEditFalla] = useState(orden.descripcion || '')
    const [editKm, setEditKm] = useState(orden.kilometraje?.toString() || '')
    const [editMecanico, setEditMecanico] = useState(orden.mecanico && orden.mecanico !== 'Sin asignar' ? orden.mecanico : '')
    const [guardandoEdicion, setGuardandoEdicion] = useState(false)

    const guardarEdicionOrden = async () => {
        if (soloLectura) return;
        setGuardandoEdicion(true);
        try {
            const { error } = await supabase.from('ordenes_trabajo').update({
                descripcion: editFalla, kilometraje: editKm ? parseInt(editKm) : null, mecanico: editMecanico.trim() || 'Sin asignar'
            }).eq('id', orden.id);
            if (error) throw error;
            toast.success("Orden actualizada");
            await cargarTodo();
            onClose();
        } catch (error) { toast.error("Error al editar"); } 
        finally { setGuardandoEdicion(false); }
    }

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900/90 backdrop-blur-md border border-blue-700/50 rounded-[35px] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
                <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-2 flex items-center gap-2">
                    <Edit2 className="text-blue-500"/> Editar Orden
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Problema</label>
                        <textarea value={editFalla} onChange={(e) => setEditFalla(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-950/50 text-slate-200 border border-slate-700/50 outline-none focus:border-blue-500/50 min-h-[80px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">KM Actual</label>
                            <input type="number" value={editKm} onChange={(e) => setEditKm(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-950/50 text-slate-200 border border-slate-700/50 outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mecánico</label>
                            <input value={editMecanico} onChange={(e) => setEditMecanico(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-950/50 text-slate-200 border border-slate-700/50 outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={onClose} disabled={guardandoEdicion} className="flex-1 text-slate-400 py-4 text-xs font-black uppercase">Cancelar</button>
                        <button onClick={guardarEdicionOrden} disabled={guardandoEdicion} className="flex-1 bg-blue-600 text-slate-100 py-4 rounded-full text-xs font-black uppercase">{guardandoEdicion ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}