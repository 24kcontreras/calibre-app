import { Wrench, Package } from 'lucide-react'

interface ModalItemProps {
  itemForm: { 
    id: string | null; 
    orden_id: string; 
    nombre: string; 
    detalle: string; 
    precio: string; 
    tipo_item: string; 
    procedencia: string;
  };
  setItemForm: (val: any) => void;
  guardarItemBD: (e: React.FormEvent<HTMLFormElement>) => void;
  guardandoItem: boolean;
  onClose: () => void;
}

export default function ModalItem({
  itemForm,
  setItemForm,
  guardarItemBD,
  guardandoItem,
  onClose
}: ModalItemProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[160]">
      <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl max-w-md w-full border border-slate-800">
        <h3 className="text-2xl font-black mb-6 tracking-tighter uppercase text-slate-100">{itemForm.id ? 'Editar Ítem' : 'Agregar Ítem'}</h3>
        <form onSubmit={guardarItemBD} className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-800 rounded-2xl border border-slate-700">
              <button type="button" onClick={() => setItemForm({...itemForm, tipo_item: 'servicio'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${itemForm.tipo_item === 'servicio' ? 'bg-emerald-600 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-emerald-400'}`}><Wrench size={12}/> Servicio</button>
              <button type="button" onClick={() => setItemForm({...itemForm, tipo_item: 'repuesto'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${itemForm.tipo_item === 'repuesto' ? 'bg-emerald-600 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-emerald-400'}`}><Package size={12}/> Repuesto</button>
          </div>
          
          <input value={itemForm.nombre} onChange={e => setItemForm({...itemForm, nombre: e.target.value})} required placeholder={itemForm.tipo_item === 'repuesto' ? "Nombre repuesto (Ej: Pastillas freno)" : "Descripción del servicio..."} className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800 font-bold text-slate-100 outline-none focus:border-emerald-500" />
          
          {itemForm.tipo_item === 'repuesto' && (
              <input value={itemForm.detalle} onChange={e => setItemForm({...itemForm, detalle: e.target.value})} placeholder="Detalle/Marca (Opcional, Ej: Original Valeo)" className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800 font-bold text-slate-100 outline-none focus:border-emerald-500" />
          )}

          {itemForm.tipo_item === 'repuesto' && (
            <select value={itemForm.procedencia} onChange={e => setItemForm({...itemForm, procedencia: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800 font-bold text-slate-300 outline-none focus:border-emerald-500">
                <option value="Taller">Vendido por el Taller</option>
                <option value="Cliente">Traído por el Cliente</option>
            </select>
          )}
          
          <input value={itemForm.precio} onChange={e => setItemForm({...itemForm, precio: e.target.value})} type="number" required placeholder="Precio ($)" className="w-full p-4 rounded-2xl border-2 border-emerald-900 bg-slate-800 font-black text-xl text-emerald-400 outline-none focus:border-emerald-500 shadow-inner placeholder:text-emerald-900" />
          
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 font-black text-slate-500 uppercase text-xs tracking-widest hover:text-slate-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={guardandoItem} className="flex-1 bg-emerald-600 text-slate-950 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all hover:scale-[1.02] disabled:opacity-50">
                {guardandoItem ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}