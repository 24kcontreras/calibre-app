'use client'
import { FolderOpen, Search, FileText, Calendar, User, CheckCircle2, X } from 'lucide-react'
import { generarDocumentoPDF } from '@/utils/pdfGenerator'

interface ModalHistorialProps {
  onClose: () => void;
  busquedaHistorial: string;
  setBusquedaHistorial: (val: string) => void;
  historialFiltrado: any[];
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
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* CABECERA */}
        <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/50">
          <div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-100 flex items-center gap-3">
                <FolderOpen className="text-emerald-500" size={28} /> Archivo General
            </h3>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500/70"/> Historial de Trabajos Finalizados y Entregados
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 transition-colors rounded-xl"
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* BUSCADOR FIJO */}
        <div className="p-6 border-b border-slate-800 shrink-0 bg-slate-950/50">
            <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    value={busquedaHistorial} 
                    onChange={(e) => setBusquedaHistorial(e.target.value)} 
                    placeholder="Buscar patente, nombre del cliente o RUT..." 
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-800 bg-slate-900 text-sm font-bold text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800 transition-all shadow-inner placeholder-slate-600" 
                />
            </div>
        </div>

        {/* LISTADO RESULTADOS (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar-dark flex-1 bg-slate-950/30">
          {historialFiltrado.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-800 rounded-3xl opacity-50 max-w-xl mx-auto">
                <FolderOpen size={48} className="text-slate-600 mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin resultados</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Intenta buscar con otra patente o nombre.</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
                {historialFiltrado.map(o => {
                const subtotal = o.items_orden?.reduce((s:number,i:any)=>s+i.precio,0) || 0;
                const revision = o.costo_revision || 0;
                const descuento = o.descuento || 0;
                const totalFinal = subtotal + revision - descuento;
                
                return (
                    <div key={o.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-colors gap-4 shadow-sm hover:shadow-md">
                    
                        <div className="flex items-center gap-4">
                            {/* Ícono Izquierdo (Da peso visual) */}
                            <div className="hidden md:flex w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center shrink-0">
                                <CheckCircle2 className="text-emerald-500" size={20} />
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-black text-xl text-slate-100 tracking-tighter uppercase leading-none">{o.vehiculos?.patente}</span>
                                    <span className="text-[9px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400 font-bold uppercase flex items-center gap-1">
                                        <Calendar size={10}/> {new Date(o.created_at).toLocaleDateString('es-CL')}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1.5 mt-1.5">
                                    <span className="text-slate-300">{o.vehiculos?.marca} {o.vehiculos?.modelo}</span> 
                                    <span className="text-slate-600">•</span>
                                    <User size={10} className="text-slate-500"/> {o.vehiculos?.clientes?.nombre || 'Sin Nombre'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-5 md:gap-6 border-t border-slate-800 md:border-0 pt-3 md:pt-0">
                            <div className="text-left md:text-right">
                                <p className="text-[8px] text-emerald-500/70 font-black uppercase tracking-widest mb-0.5">Total Cobrado</p>
                                <p className="font-black text-emerald-400 text-xl leading-none">${totalFinal.toLocaleString('es-CL')}</p>
                            </div>
                            
                            <button 
                                onClick={() => generarDocumentoPDF(o, o.resumen_ia, configPDF)} 
                                className="bg-slate-950 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-xl font-black text-[10px] hover:bg-emerald-600 hover:text-slate-950 hover:border-emerald-600 transition-all uppercase tracking-widest flex items-center gap-2 shadow-sm"
                            >
                                <FileText size={14} /> PDF
                            </button>
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