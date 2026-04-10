import { Camera, FolderOpen, CheckCircle } from 'lucide-react'

interface ModalEvidenciaProps {
  fotoForm: {ordenId: string, file: File | null, preview: string, descripcion: string} | null;
  setFotoForm: (val: any) => void;
  handleSeleccionarFoto: (e: any) => void;
  subirFotoDefinitiva: () => void;
  subiendoFoto: boolean;
}

export default function ModalEvidencia({
  fotoForm,
  setFotoForm,
  handleSeleccionarFoto,
  subirFotoDefinitiva,
  subiendoFoto
}: ModalEvidenciaProps) {
  if (!fotoForm) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[170]">
      <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl max-w-sm w-full border border-slate-800">
        <h3 className="text-2xl font-black mb-6 tracking-tighter uppercase text-slate-100 text-center">Evidencia</h3>
        
        {!fotoForm.preview ? (
            <div className="space-y-4">
                <label className="flex flex-col items-center justify-center bg-slate-800 hover:bg-emerald-900/50 border-2 border-dashed border-emerald-500/50 p-8 rounded-3xl cursor-pointer transition-all group">
                    <Camera className="mb-2 text-emerald-400 group-hover:scale-110 transition-transform" size={48} />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Tomar Foto</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleSeleccionarFoto} className="hidden" />
                </label>
                <div className="text-center text-[10px] font-black text-slate-600 uppercase">Ó</div>
                <label className="flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl cursor-pointer transition-all">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><FolderOpen size={16} /> Subir de Galería</span>
                    <input type="file" accept="image/*" onChange={handleSeleccionarFoto} className="hidden" />
                </label>
                <button onClick={() => setFotoForm(null)} className="w-full mt-4 font-black text-slate-500 uppercase text-xs tracking-widest hover:text-red-400 transition-colors">Cancelar</button>
            </div>
        ) : (
            <div className="space-y-4">
                <img src={fotoForm.preview} alt="Preview" className="w-full h-48 object-cover rounded-2xl border border-slate-700" />
                <input 
                    value={fotoForm.descripcion} 
                    onChange={(e) => setFotoForm({...fotoForm, descripcion: e.target.value})} 
                    placeholder="Describe la foto (Ej: Rayón puerta delantera)" 
                    className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800 font-bold text-sm text-slate-200 outline-none focus:border-emerald-500" 
                />
                <div className="flex gap-4 pt-2">
                    <button onClick={() => setFotoForm(null)} className="flex-1 font-black text-slate-500 uppercase text-xs tracking-widest hover:text-slate-300 transition-colors">Cancelar</button>
                    <button onClick={subirFotoDefinitiva} disabled={subiendoFoto} className="flex-1 bg-emerald-600 text-slate-950 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {subiendoFoto ? 'Subiendo...' : <>Guardar <CheckCircle size={16}/></>}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}