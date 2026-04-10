import { MessageSquare } from 'lucide-react'

interface ModalVehiculoInfoProps {
  vehiculoInfo: any;
  onClose: () => void;
}

export default function ModalVehiculoInfo({ vehiculoInfo, onClose }: ModalVehiculoInfoProps) {
  if (!vehiculoInfo) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-sm w-full border border-slate-800 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900 shrink-0">
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-100 flex items-center gap-2">{vehiculoInfo.patente}</h3>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Ficha del Vehículo</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-400 font-black text-xl p-2 bg-slate-800 rounded-full transition-colors border border-slate-700 w-10 h-10 flex items-center justify-center">✕</button>
        </div>
        
    

        <div className="p-8 space-y-6 bg-slate-800/50">
            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Datos del Automóvil</p>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-sm font-bold text-slate-200 uppercase"><span className="text-slate-500">Marca:</span> {vehiculoInfo.marca}</p>
                    <p className="text-sm font-bold text-slate-200 uppercase mt-2"><span className="text-slate-500">Modelo:</span> {vehiculoInfo.modelo}</p>
                    <p className="text-sm font-bold text-slate-200 uppercase mt-2"><span className="text-slate-500">Año:</span> {vehiculoInfo.anho || 'N/A'}</p>
                </div>
            </div>

            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Datos del Propietario</p>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-sm font-bold text-slate-200 uppercase"><span className="text-slate-500">Nombre:</span> {vehiculoInfo.clientes?.nombre}</p>
                    <p className="text-sm font-bold text-slate-200 uppercase mt-2"><span className="text-slate-500">RUT:</span> {vehiculoInfo.clientes?.rut || 'N/A'}</p>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-bold text-emerald-400"><span className="text-slate-500">Teléfono:</span> {vehiculoInfo.clientes?.telefono || 'N/A'}</p>
                        {vehiculoInfo.clientes?.telefono && (
                            <a href={`https://wa.me/${vehiculoInfo.clientes.telefono.replace('+', '')}`} target="_blank" rel="noreferrer" className="bg-emerald-900/50 p-2 rounded-lg text-emerald-400 hover:bg-emerald-600 hover:text-slate-900 transition-colors" title="Abrir WhatsApp">
                                <MessageSquare size={14} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}