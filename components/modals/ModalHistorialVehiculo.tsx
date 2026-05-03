'use client'
import { useState, useEffect } from 'react'
import { X, Calendar, FileText, CheckCircle, Hammer, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Vehiculo, OrdenTrabajo } from '@/hooks/types'

interface ModalHistorialVehiculoProps {
  vehiculo: Vehiculo | null;
  onClose: () => void;
}

export default function ModalHistorialVehiculo({ vehiculo, onClose }: ModalHistorialVehiculoProps) {
  const [historial, setHistorial] = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vehiculo) return;
    
    const fetchHistorial = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('ordenes_trabajo')
          .select(`
            *,
            items_orden (*)
          `)
          .eq('vehiculo_id', vehiculo.id)
          .eq('estado', 'Finalizada')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistorial(data || []);
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistorial();
  }, [vehiculo])

  if (!vehiculo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* CABECERA */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-slate-100 tracking-tighter uppercase leading-none">
                {vehiculo.patente}
              </h2>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                Ficha Clínica
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {vehiculo.marca} {vehiculo.modelo} {vehiculo.anho ? `• ${vehiculo.anho}` : ''}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <User size={12}/> {vehiculo.clientes?.nombre} {vehiculo.clientes?.telefono ? `• ${vehiculo.clientes.telefono}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 transition-colors rounded-xl">
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL HISTORIAL (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-6 bg-slate-950/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 opacity-50">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Buscando en los archivos...</p>
            </div>
          ) : historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
              <FileText size={48} className="text-slate-600 mb-4" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin historial previo</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Este vehículo no tiene órdenes finalizadas en el taller.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
              {historial.map((orden) => {
                const subt = orden.items_orden?.reduce((sum, i) => sum + i.precio, 0) || 0;
                const rev = orden.costo_revision || 0;
                const desc = orden.descuento || 0;
                const total = subt + rev - desc;
                const fecha = new Date(orden.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

                return (
                  <div key={orden.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-emerald-500 text-slate-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10">
                      <CheckCircle size={18} />
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-700 bg-slate-900/80 shadow-lg hover:border-emerald-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          <Calendar size={12}/> {fecha}
                        </span>
                        <span className="text-xs font-black text-slate-300 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          ${total.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Motivo Ingreso</p>
                        <p className="text-xs text-slate-200 font-medium italic border-l-2 border-slate-700 pl-2">"{orden.descripcion || 'Sin descripción'}"</p>
                      </div>

                      {orden.resumen_ia && (
                        <div className="mb-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <p className="text-[9px] text-blue-400 uppercase font-black tracking-widest mb-1 flex items-center gap-1"><Hammer size={10}/> Resumen Técnico</p>
                          <p className="text-[10px] text-slate-400 line-clamp-3">{orden.resumen_ia}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}