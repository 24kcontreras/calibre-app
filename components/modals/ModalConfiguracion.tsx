import { useState } from 'react'
import { Settings, Save, LogOut, Upload, FileText, Percent, Image as ImageIcon, MapPin, Phone, Sparkles, Download, ShieldCheck, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

interface ModalConfiguracionProps {
  onClose: () => void;
  inputTaller: string;
  setInputTaller: (val: string) => void;
  guardarConfiguracion: () => void; 
  guardandoConfiguracion?: boolean;
  handleLogout: () => void;
  inputDireccion?: string;
  setInputDireccion?: (val: string) => void;
  inputTelefono?: string;
  setInputTelefono?: (val: string) => void;
  logoPreview?: string | null;
  handleLogoChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  subiendoLogo?: boolean;
  inputGarantia?: string;
  setInputGarantia?: (val: string) => void;
  incluirIva?: boolean;
  setIncluirIva?: (val: boolean) => void;
  esOnboarding?: boolean; 
  vehiculos?: any[];
  fechaVencimiento?: string;
  tallerId?: string;
  email?: string;
}

export default function ModalConfiguracion({
  onClose,
  inputTaller,
  setInputTaller,
  guardarConfiguracion,
  guardandoConfiguracion,
  handleLogout,
  inputDireccion,
  setInputDireccion,
  inputTelefono,
  setInputTelefono,
  logoPreview,
  handleLogoChange,
  subiendoLogo,
  inputGarantia,
  setInputGarantia,
  incluirIva,
  setIncluirIva,
  esOnboarding = false,
  vehiculos = [],
  fechaVencimiento,
  tallerId,
  email
}: ModalConfiguracionProps) {

  const [cargandoPago, setCargandoPago] = useState(false);

  const iniciarPago = async () => {
      if (!tallerId || !email) return toast.error("Error identificando tu cuenta");
      setCargandoPago(true);
      try {
          const res = await fetch('/api/flow/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ taller_id: tallerId, email: email, monto: 24990 })
          });
          const data = await res.json();
          if (data.url) {
              window.location.href = data.url;
          } else {
              toast.error("Error conectando con Flow: " + data.error);
              setCargandoPago(false);
          }
      } catch (error) {
          toast.error("Error de conexión. Revisa tu internet.");
          setCargandoPago(false);
      }
  };

  const calcularDias = () => {
      if (!fechaVencimiento) return 0;
      const hoy = new Date();
      const vencimiento = new Date(fechaVencimiento);
      const diffTime = Math.max(0, vencimiento.getTime() - hoy.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const diasRestantes = calcularDias();

  const exportarDatosCSV = () => {
    if (!vehiculos || vehiculos.length === 0) {
      alert("No hay clientes o vehículos registrados para exportar.");
      return;
    }
    const headers = ["Patente", "Marca", "Modelo", "Anho", "Nombre Cliente", "RUT", "Telefono"];
    const filas = vehiculos.map((v: any) => [
      v.patente || '', v.marca || '', v.modelo || '', v.anho || 'N/A',
      v.clientes?.nombre || 'Sin Nombre', v.clientes?.rut || 'Sin RUT', v.clientes?.telefono || 'Sin Telefono'
    ]);
    const contenidoCSV = [headers.join(";"), ...filas.map(f => f.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Exportacion_Calibre_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-md w-full border border-slate-800 flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* HEADER DEL MODAL */}
        <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0 relative z-10">
          <div>
            {esOnboarding ? (
                <>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-emerald-400 flex items-center gap-2"><Sparkles className="text-emerald-500"/> ¡Bienvenido!</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Configura tu taller para empezar</p>
                </>
            ) : (
                <>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-100 flex items-center gap-2"><Settings className="text-emerald-500"/> Ajustes</h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Configuración de Plataforma</p>
                </>
            )}
          </div>
          {!esOnboarding && (
              <button onClick={onClose} className="text-slate-500 hover:text-red-400 font-black text-xl p-2 bg-slate-800 rounded-full transition-colors border border-slate-700 w-10 h-10 flex items-center justify-center">✕</button>
          )}
        </div>
        
        {/* CONTENIDO ESCROLEABLE */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar-dark">
            
            {!esOnboarding && fechaVencimiento && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-emerald-500" /> Plan Activo
                            </h4>
                            <p className="text-[8px] text-slate-500 font-bold mt-1 uppercase">Suscripción Calibre OS</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${diasRestantes <= 5 ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                            {diasRestantes > 0 ? `${diasRestantes} Días Restantes` : 'Vencida'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={iniciarPago}
                        disabled={cargandoPago}
                        className="w-full bg-slate-950 hover:bg-emerald-600 text-emerald-400 hover:text-slate-950 transition-all py-3 rounded-xl border border-emerald-500/30 hover:border-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:hover:bg-slate-950 disabled:hover:text-emerald-400"
                    >
                        {cargandoPago ? 'Conectando...' : <><CreditCard size={14} /> Renovar Mes ($24.990)</>}
                    </button>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Nombre Oficial del Taller <span className="text-red-500">*</span></label>
                    <input 
                        value={inputTaller} 
                        onChange={(e) => setInputTaller(e.target.value)} 
                        placeholder="Ej: LEO'S TALLER"
                        className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800 text-sm text-emerald-400 font-bold uppercase outline-none focus:border-emerald-500 transition-colors shadow-inner" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* 🔥 PASO 1.1: EL TELÉFONO AHORA ES OBLIGATORIO Y ESTÁ DESTACADO */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Phone size={12} className="text-emerald-500"/> Teléfono (WhatsApp) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            value={inputTelefono || ''} 
                            onChange={(e) => setInputTelefono?.(e.target.value)} 
                            placeholder="+56912345678"
                            className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950/50 text-xs text-slate-300 font-bold outline-none focus:border-emerald-500 transition-colors" 
                        />
                        {esOnboarding && <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Vital para notificaciones</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12} className="text-slate-500"/> Dirección (PDF)</label>
                        <input 
                            value={inputDireccion || ''} 
                            onChange={(e) => setInputDireccion?.(e.target.value)} 
                            placeholder="Ej: Av. Central 123"
                            className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950/50 text-xs text-slate-300 font-bold outline-none focus:border-emerald-500 transition-colors" 
                        />
                    </div>
                </div>
            </div>

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
                        <button onClick={() => document.getElementById('logo-upload')?.click()} disabled={subiendoLogo} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-black px-4 py-3 rounded-xl uppercase tracking-widest transition-colors flex items-center gap-2 border border-slate-700 hover:border-emerald-500/50 w-full justify-center disabled:opacity-50 shadow-sm">
                            <Upload size={14} /> {subiendoLogo ? 'Subiendo...' : 'Cargar Logo'}
                        </button>
                        <p className="text-[8px] text-slate-600 mt-2 font-bold uppercase tracking-wider text-center">Fondo transparente recomendado</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><FileText size={12} className="text-emerald-500"/> Términos de Garantía</label>
                <textarea
                    value={inputGarantia || ''}
                    onChange={(e) => setInputGarantia?.(e.target.value)}
                    placeholder="Ej: Garantía de 30 días en mano de obra. El taller no se responsabiliza por objetos de valor dejados en el vehículo..."
                    className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-950/50 text-xs text-slate-300 font-bold outline-none focus:border-emerald-500 transition-colors min-h-[100px] resize-none custom-scrollbar-dark"
                />
            </div>

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
        </div>

        {/* FOOTER DEL MODAL */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 shrink-0 space-y-3 relative z-10">
            {/* 🔥 PASO 1.2: BLOQUEO DE BOTÓN SI NO HAY TELÉFONO O NOMBRE */}
            <button 
                onClick={guardarConfiguracion} 
                disabled={guardandoConfiguracion || !inputTaller.trim() || !inputTelefono?.trim()}
                className="w-full py-4 bg-emerald-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
                <Save size={16} /> {guardandoConfiguracion ? 'Guardando...' : (esOnboarding ? 'Guardar y Comenzar' : 'Guardar Ajustes')}
            </button>

            {!esOnboarding && (
                <button 
                    type="button"
                    onClick={exportarDatosCSV}
                    className="w-full py-3 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                >
                    <Download size={14} className="text-emerald-400" /> Exportar Base de Datos a Excel
                </button>
            )}

            <button 
                onClick={handleLogout} 
                className="w-full py-3 text-slate-500 hover:text-red-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 bg-transparent mt-2"
            >
                <LogOut size={14} /> {esOnboarding ? 'Cancelar y Salir' : 'Cerrar Sesión'}
            </button>
        </div>

      </div>
    </div>
  )
}