import { useState } from 'react';
import { X, CarFront, User, Phone, Mail, Edit2, Save, XCircle, Calendar, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface ModalVehiculoInfoProps {
  vehiculoInfo: any;
  onClose: () => void;
  reCargarGlobal: () => void; // 🔥 Esta es la línea que soluciona el error de TypeScript
}

export default function ModalVehiculoInfo({ vehiculoInfo, onClose, reCargarGlobal }: ModalVehiculoInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [telefono, setTelefono] = useState(vehiculoInfo.clientes?.telefono || '');
  const [correo, setCorreo] = useState(vehiculoInfo.clientes?.correo || '');
  const [guardando, setGuardando] = useState(false);

  const guardarCambiosCliente = async () => {
    setGuardando(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ 
            telefono: telefono.trim(), 
            correo: correo.trim() 
        })
        .eq('id', vehiculoInfo.cliente_id);

      if (error) throw error;

      toast.success('Datos del cliente actualizados');
      
      // Actualizamos visualmente el objeto local para no tener que hacer doble fetch
      if (vehiculoInfo.clientes) {
          vehiculoInfo.clientes.telefono = telefono;
          vehiculoInfo.clientes.correo = correo;
      }
      
      reCargarGlobal(); // Actualiza la info en la Pizarra y toda la App
      setIsEditing(false);
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!vehiculoInfo) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
      <div className="bg-slate-900 rounded-[35px] shadow-2xl max-w-md w-full border border-slate-700/50 relative overflow-hidden flex flex-col">
        
        {/* Fondo decorativo */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[50%] bg-emerald-900/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

        {/* Botón de cierre */}
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-emerald-400 transition-colors z-20 bg-slate-900/50 rounded-full p-1">
          <X size={20} />
        </button>

        <div className="p-8 relative z-10">
            {/* Cabecera del Vehículo */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner shrink-0">
                    <CarFront className="text-emerald-500" size={28} />
                </div>
                <div className="overflow-hidden">
                    <h2 className="text-3xl font-black tracking-tighter text-slate-100 uppercase truncate">{vehiculoInfo.patente}</h2>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Ficha del Vehículo</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1"><Tag size={10}/> Marca/Modelo</p>
                    <p className="text-sm font-bold text-slate-200 uppercase truncate">{vehiculoInfo.marca} {vehiculoInfo.modelo}</p>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1"><Calendar size={10}/> Año</p>
                    <p className="text-sm font-bold text-slate-200 uppercase truncate">{vehiculoInfo.anho || 'N/A'}</p>
                </div>
            </div>

            {/* Cabecera del Cliente */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} className="text-blue-500" /> Información del Cliente
                </h3>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1 hover:text-blue-300 transition-colors bg-blue-900/20 px-2 py-1 rounded-md border border-blue-900/50">
                        <Edit2 size={10}/> Editar
                    </button>
                ) : (
                    <button onClick={() => setIsEditing(false)} className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 hover:text-slate-300 transition-colors bg-slate-800 px-2 py-1 rounded-md">
                        <XCircle size={10}/> Cancelar
                    </button>
                )}
            </div>

            {/* Ficha del Cliente */}
            <div className="space-y-4">
                <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Nombre (Propietario)</label>
                    <p className="text-sm font-bold text-slate-200 capitalize bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 truncate cursor-not-allowed opacity-80">{vehiculoInfo.clientes?.nombre}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Phone size={10}/> Teléfono</label>
                        {isEditing ? (
                            <input 
                                type="tel" 
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                className="w-full p-3 rounded-xl border border-blue-500/50 bg-slate-950/50 text-sm font-bold text-blue-400 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="+569..."
                            />
                        ) : (
                            <p className="text-sm font-bold text-slate-200 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 truncate">{vehiculoInfo.clientes?.telefono || 'Sin registrar'}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Mail size={10}/> Correo Electrónico (Opcional)</label>
                        {isEditing ? (
                            <input 
                                type="email" 
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                className="w-full p-3 rounded-xl border border-blue-500/50 bg-slate-950/50 text-sm font-bold text-blue-400 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="cliente@correo.com"
                            />
                        ) : (
                            <p className="text-sm font-bold text-slate-200 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 truncate">{vehiculoInfo.clientes?.correo || 'Sin registrar'}</p>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <button 
                        onClick={guardarCambiosCliente}
                        disabled={guardando}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-slate-100 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    >
                        {guardando ? 'Guardando...' : <><Save size={14}/> Guardar Cambios</>}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}