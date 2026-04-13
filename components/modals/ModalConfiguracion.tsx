import { Settings, Save, LogOut, Upload, FileText, Percent, Image as ImageIcon } from 'lucide-react'

interface ModalConfiguracionProps {
  onClose: () => void;
  inputTaller: string;
  setInputTaller: (val: string) => void;
  guardarNombreTaller: () => void; // 🔥 Tu función original intacta
  handleLogout: () => void;

  // 🔥 Nuevos Props (Opcionales por ahora para no romper tu page.tsx)
  logoPreview?: string | null;
  handleLogoChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  subiendoLogo?: boolean;
  
  inputGarantia?: string;
  setInputGarantia?: (val: string) => void;
  
  incluirIva?: boolean;
  setIncluirIva?: (val: boolean) => void;
}

export default function ModalConfiguracion({
  onClose,
  inputTaller,
  setInputTaller,
  guardarNombreTaller,
  handleLogout,
  logoPreview,
  handleLogoChange,
  subiendoLogo,
  inputGarantia,
  setInputGarantia,
  incluirIva,
  setIncluirIva
}: ModalConfiguracionProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      {/* Le dimos max-h-[90vh] y overflow-hidden para que el modal no se salga de la pantalla */}
      <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-md w-full border border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* HEADER DEL MODAL (Fijo arriba) */}
        <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-100 flex items-center gap-2"><Settings className="text-emerald-500"/> Ajustes</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Configuración de Plataforma</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-400 font-black text-xl p-2 bg-slate-800 rounded-full transition-colors border border-slate-700 w-10 h-10 flex items-center justify-center">✕</button>
        </div>
        
        {/* CONTENIDO ESCROLEABLE */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar-dark">
            
            {/* 1. NOMBRE DEL TALLER (Intacto como pediste) */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre Oficial del Taller</label>
                <div className="flex gap-2">
                    <input 
                        value={inputTaller} 
                        onChange={(e) => setInputTaller(e.target.value)} 
                        className="flex-1 p-4 rounded-2xl border border-slate-700 bg-slate-800 text-sm text-emerald-400 font-bold uppercase outline-none focus:border-emerald-500 transition-colors" 
                    />
                    <button onClick={guardarNombreTaller} className="bg-emerald-600 text-slate-950 px-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Save size={16} />
                    </button>
                </div>
                <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase">Este nombre aparecerá en los PDFs y mensajes de WhatsApp.</p>
            </div>

            {/* 2. LOGO DEL TALLER PARA PDFs */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ImageIcon size={12} className="text-emerald-500"/> Logo para Informes PDF</label>
                <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                        ) : (
                            <ImageIcon className="text-slate-700" size={24} />
                        )}
                    </div>
                    <div className="flex-1">
                        <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoChange} />
                        <button onClick={() => document.getElementById('logo-upload')?.click()} disabled={subiendoLogo} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-black px-4 py-3 rounded-xl uppercase tracking-widest transition-colors flex items-center gap-2 border border-slate-700 hover:border-emerald-500/50 w-full justify-center disabled:opacity-50">
                            <Upload size={14} /> {subiendoLogo ? 'Subiendo...' : 'Cargar Logo'}
                        </button>
                        <p className="text-[8px] text-slate-600 mt-2 font-bold uppercase tracking-wider text-center">Fondo transparente recomendado</p>
                    </div>
                </div>
            </div>

            {/* 3. TÉRMINOS DE GARANTÍA */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><FileText size={12} className="text-emerald-500"/> Términos de Garantía</label>
                <textarea
                    value={inputGarantia || ''}
                    onChange={(e) => setInputGarantia?.(e.target.value)}
                    placeholder="Ej: Garantía de 30 días en mano de obra. El taller no se responsabiliza por objetos de valor..."
                    className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-950/50 text-xs text-slate-300 font-bold outline-none focus:border-emerald-500 transition-colors min-h-[100px] resize-none custom-scrollbar-dark"
                />
            </div>

            {/* 4. CONFIGURACIÓN DE IVA (TOGGLE) */}
            <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Percent size={12} className="text-emerald-500"/> Aplicar IVA (19%)</label>
                    <p className="text-[8px] text-slate-600 mt-1 uppercase font-bold tracking-wider">Se reflejará en los Informes PDF</p>
                </div>
                <button
                    onClick={() => setIncluirIva?.(!incluirIva)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center shadow-inner ${incluirIva ? 'bg-emerald-500' : 'bg-slate-800'}`}
                >
                    <div className={`w-4 h-4 bg-slate-100 rounded-full absolute transition-transform shadow-md ${incluirIva ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
            </div>

            <div className="h-px bg-slate-800/50 w-full my-4"></div>

            {/* LOGOUT */}
            <button onClick={handleLogout} className="w-full py-4 bg-red-950/20 text-red-400 border border-red-900/30 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/40 hover:border-red-500/50 hover:text-red-300 transition-all flex items-center justify-center gap-2 shadow-sm">
                <LogOut size={16} /> Cerrar Sesión Segura
            </button>
        </div>
      </div>
    </div>
  )
}