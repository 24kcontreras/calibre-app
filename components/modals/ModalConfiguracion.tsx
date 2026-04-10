import { Settings, Save, LogOut } from 'lucide-react'

interface ModalConfiguracionProps {
  onClose: () => void;
  inputTaller: string;
  setInputTaller: (val: string) => void;
  guardarNombreTaller: () => void;
  handleLogout: () => void;
}

export default function ModalConfiguracion({
  onClose,
  inputTaller,
  setInputTaller,
  guardarNombreTaller,
  handleLogout
}: ModalConfiguracionProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-sm w-full border border-slate-800 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-100 flex items-center gap-2"><Settings className="text-emerald-500"/> Ajustes</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Configuración de Plataforma</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-400 font-black text-xl p-2 bg-slate-800 rounded-full transition-colors border border-slate-700 w-10 h-10 flex items-center justify-center">✕</button>
        </div>
        
        <div className="p-8 space-y-6">
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre Oficial del Taller</label>
                <div className="flex gap-2">
                    <input 
                        value={inputTaller} 
                        onChange={(e) => setInputTaller(e.target.value)} 
                        className="flex-1 p-4 rounded-2xl border border-slate-700 bg-slate-800 text-sm text-emerald-400 font-bold uppercase outline-none focus:border-emerald-500 transition-colors" 
                    />
                    <button onClick={guardarNombreTaller} className="bg-emerald-600 text-slate-950 px-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-colors flex items-center justify-center">
                        <Save size={16} />
                    </button>
                </div>
                <p className="text-[9px] text-slate-500 mt-2">Este nombre aparecerá en los PDFs y mensajes de WhatsApp.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 opacity-50">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Servidor de Correos SMTP</label>
                <p className="text-xs text-slate-600 italic">Esta función se desbloqueará en la próxima actualización.</p>
            </div>

            <button onClick={handleLogout} className="w-full py-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-900 hover:text-red-200 transition-colors flex items-center justify-center gap-2">
                <LogOut size={16} /> Cerrar Sesión
            </button>
        </div>
      </div>
    </div>
  )
}