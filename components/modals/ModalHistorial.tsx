import { FolderOpen, Search, FileText } from 'lucide-react'
import { generarDocumentoPDF } from '@/utils/pdfGenerator'

interface ModalHistorialProps {
  onClose: () => void;
  busquedaHistorial: string;
  setBusquedaHistorial: (val: string) => void;
  historialFiltrado: any[];
  // 🔥 Recibimos la configuración completa en vez de solo el nombre
  configPDF: {
      nombreTaller: string;
      direccion: string;
      telefono: string;
      garantia: string;
      logoUrl: string | null;
      incluirIva: boolean;
  };
}

export default function ModalHistorial({
  onClose,
  busquedaHistorial,
  setBusquedaHistorial,
  historialFiltrado,
  configPDF
}: ModalHistorialProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-3xl w-full border border-slate-800 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0 relative">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-100 flex items-center gap-2">
                <FolderOpen className="text-emerald-500"/> Historial de Trabajos
            </h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Busca cualquier vehículo finalizado</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-400 font-black text-xl p-2 bg-slate-800 rounded-full transition-colors border border-slate-700 w-10 h-10 flex items-center justify-center absolute top-8 right-8 md:static">✕</button>
        </div>
        
        <div className="p-6 border-b border-slate-800 shrink-0">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    value={busquedaHistorial} 
                    onChange={(e) => setBusquedaHistorial(e.target.value)} 
                    placeholder="Buscar por patente, nombre o RUT..." 
                    className="w-full p-4 pl-12 rounded-2xl border border-slate-700 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors" 
                />
            </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar-dark flex-1 space-y-3">
          {historialFiltrado.length === 0 ? (
            <p className="text-center text-sm font-bold text-slate-500 py-10">No se encontraron resultados.</p>
          ) : (
            historialFiltrado.map(o => {
              const total = o.items_orden?.reduce((s:number,i:any)=>s+i.precio,0) || 0;
              return (
                <div key={o.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-colors gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-lg text-slate-100 tracking-wider">{o.vehiculos?.patente}</span>
                        <span className="text-[10px] bg-slate-950 px-2 py-1 rounded text-emerald-400 border border-slate-800 font-bold uppercase">{new Date(o.created_at).toLocaleDateString('es-CL')}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase">{o.vehiculos?.clientes?.nombre} | {o.vehiculos?.marca} {o.vehiculos?.modelo}</p>
                  </div>
                  <div className="flex items-center gap-4 justify-between md:justify-end">
                    <p className="font-black text-emerald-400">${total.toLocaleString('es-CL')}</p>
                    
                    {/* 🔥 AQUÍ LE MANDAMOS LA CONFIGURACIÓN COMPLETA AL GENERADOR DE PDF */}
                    <button onClick={() => generarDocumentoPDF(o, o.resumen_ia, configPDF)} className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 px-4 py-2 rounded-xl font-bold text-[10px] hover:bg-emerald-600 hover:text-slate-950 transition-all uppercase tracking-widest flex items-center gap-1">
                        <FileText size={12} /> Generar PDF
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}