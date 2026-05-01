'use client'
import { useState, useEffect } from 'react'
import { Settings, Save, LogOut, Upload, FileText, Percent, Image as ImageIcon, MapPin, Phone, Sparkles, Download, ShieldCheck, CreditCard, BookOpen, ChevronDown, Users, Plus, QrCode, PowerOff, X, Loader2, Key, Check, Copy } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { QRCodeSVG } from 'qrcode.react'

interface ModalConfiguracionProps {
  onClose: () => void;
  onOpenManual: () => void;
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
  onOpenManual,
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

  // --- ESTADOS (MECÁNICOS Y PESTAÑAS) ---
  const [pestañaActiva, setPestañaActiva] = useState<'taller' | 'equipo'>('taller');
  const [mecanicos, setMecanicos] = useState<any[]>([]);
  const [cargandoMecanicos, setCargandoMecanicos] = useState(false);
  const [nuevoMecanico, setNuevoMecanico] = useState({ nombre: '', usuario: '', pin: '' });
  const [guardandoMecanico, setGuardandoMecanico] = useState(false);
  const [qrVisible, setQrVisible] = useState<any | null>(null);

  // 🔥 NUEVOS ESTADOS PARA EDICIÓN DE PIN
  const [editandoPinId, setEditandoPinId] = useState<string | null>(null);
  const [nuevoPinValue, setNuevoPinValue] = useState('');
  const [guardandoPin, setGuardandoPin] = useState(false);

  // --- LÓGICA DE PAGOS Y CSV ---
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
          if (data.url) window.location.href = data.url;
          else { toast.error("Error conectando con Flow"); setCargandoPago(false); }
      } catch (error) { toast.error("Error de conexión"); setCargandoPago(false); }
  };

  const calcularDias = () => {
      if (!fechaVencimiento) return 0;
      const hoy = new Date();
      const vencimiento = new Date(fechaVencimiento);
      return Math.max(0, Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));
  };
  const diasRestantes = calcularDias();

  const exportarDatosCSV = () => {
    if (!vehiculos || vehiculos.length === 0) return alert("No hay datos para exportar.");
    const headers = ["Patente", "Marca", "Modelo", "Anho", "Nombre Cliente", "RUT", "Telefono"];
    const filas = vehiculos.map((v: any) => [
      v.patente || '', v.marca || '', v.modelo || '', v.anho || 'N/A',
      v.clientes?.nombre || 'Sin Nombre', v.clientes?.rut || 'Sin RUT', v.clientes?.telefono || 'Sin Telefono'
    ]);
    const contenidoCSV = [headers.join(";"), ...filas.map(f => f.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Exportacion_Calibre_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LÓGICA DE MECÁNICOS ---
  useEffect(() => {
    if (pestañaActiva === 'equipo') cargarMecanicos();
  }, [pestañaActiva]);

  const cargarMecanicos = async () => {
    setCargandoMecanicos(true);
    const { data } = await supabase.from('mecanicos').select('*').order('created_at', { ascending: false });
    if (data) setMecanicos(data);
    setCargandoMecanicos(false);
  }

  const crearMecanico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMecanico.nombre || !nuevoMecanico.usuario || nuevoMecanico.pin.length !== 4) {
        return toast.error("Completa los datos y usa un PIN de 4 dígitos");
    }
    setGuardandoMecanico(true);
    try {
        const { error } = await supabase.from('mecanicos').insert([{
            taller_id: tallerId,
            nombre: nuevoMecanico.nombre.trim(),
            usuario: nuevoMecanico.usuario.toLowerCase().trim(),
            pin: nuevoMecanico.pin
        }]);
        if (error) throw error;
        toast.success("Mecánico añadido al equipo");
        setNuevoMecanico({ nombre: '', usuario: '', pin: '' });
        cargarMecanicos();
    } catch (err: any) {
        toast.error(err.code === '23505' ? "Ese usuario ya existe en tu taller" : "Error al guardar");
    } finally {
        setGuardandoMecanico(false);
    }
  }

  const toggleEstadoMecanico = async (id: string, estadoActual: boolean) => {
    const toastId = toast.loading("Actualizando...");
    try {
        await supabase.from('mecanicos').update({ activo: !estadoActual }).eq('id', id);
        toast.success(estadoActual ? "Desvinculado (Kill Switch activado)" : "Acceso restaurado", { id: toastId });
        cargarMecanicos();
    } catch {
        toast.error("Error al actualizar", { id: toastId });
    }
  }

  // 🔥 NUEVA FUNCIÓN: Actualizar PIN
  const actualizarPinMecanico = async (id: string) => {
    if (nuevoPinValue.length !== 4) return toast.error("El PIN debe tener 4 dígitos");
    setGuardandoPin(true);
    const toastId = toast.loading("Actualizando PIN...");
    try {
        const { error } = await supabase.from('mecanicos').update({ pin: nuevoPinValue }).eq('id', id);
        if (error) throw error;
        toast.success("PIN actualizado correctamente", { id: toastId });
        setEditandoPinId(null);
        setNuevoPinValue('');
        cargarMecanicos();
    } catch {
        toast.error("Error al actualizar PIN", { id: toastId });
    } finally {
        setGuardandoPin(false);
    }
  }
  
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-4xl w-full border border-slate-800 flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* HEADER DEL MODAL */}
        <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900 shrink-0 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              {esOnboarding ? (
                  <>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-emerald-400 flex items-center gap-2"><Sparkles className="text-emerald-500"/> ¡Bienvenido!</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Configura tu taller para empezar</p>
                  </>
              ) : (
                  <>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-100 flex items-center gap-2"><Settings className="text-emerald-500"/> Centro de Comando</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Configuración y Accesos</p>
                  </>
              )}
            </div>
            {!esOnboarding && (
                <button onClick={onClose} className="text-slate-500 hover:text-red-400 font-black text-xl p-2 bg-slate-800 rounded-full transition-colors border border-slate-700 w-10 h-10 flex items-center justify-center"><X size={20} /></button>
            )}
          </div>

          {!esOnboarding && (
            <div className="flex gap-4">
                <button onClick={() => setPestañaActiva('taller')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${pestañaActiva === 'taller' ? 'bg-emerald-600 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
                    <Settings size={16} /> Ajustes del Taller
                </button>
                <button onClick={() => setPestañaActiva('equipo')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${pestañaActiva === 'equipo' ? 'bg-blue-600 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
                    <Users size={16} /> Tu Equipo
                </button>
            </div>
          )}
        </div>
        
        {/* CONTENIDO ESCROLEABLE */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar-dark flex-1">
            
            {/* 🟢 PESTAÑA: TALLER Y FACTURACIÓN */}
            {pestañaActiva === 'taller' && (
              <div className="space-y-8">
                {/* BLOQUE DE PAGO FLOW */}
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
                            className="w-full bg-slate-950 hover:bg-emerald-600 text-emerald-400 hover:text-slate-950 transition-all py-3 rounded-xl border border-emerald-500/30 hover:border-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {cargandoPago ? 'Conectando...' : <><CreditCard size={14} /> Renovar Mes ($24.990)</>}
                        </button>
                    </div>
                )}

                {/* FORMULARIO DE AJUSTES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Nombre Oficial del Taller <span className="text-red-500">*</span></label>
                        <input value={inputTaller} onChange={(e) => setInputTaller(e.target.value)} placeholder="Ej: LEO'S TALLER" className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800 text-sm text-emerald-400 font-bold uppercase outline-none focus:border-emerald-500 transition-colors shadow-inner" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Phone size={12} className="text-emerald-500"/> Teléfono (WhatsApp) <span className="text-red-500">*</span></label>
                        <input value={inputTelefono || ''} onChange={(e) => setInputTelefono?.(e.target.value)} placeholder="+56912345678" className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950/50 text-xs text-slate-300 font-bold outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12} className="text-slate-500"/> Dirección (PDF)</label>
                        <input value={inputDireccion || ''} onChange={(e) => setInputDireccion?.(e.target.value)} placeholder="Ej: Av. Central 123" className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950/50 text-xs text-slate-300 font-bold outline-none focus:border-emerald-500 transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ImageIcon size={12} className="text-emerald-500"/> Logo para Informes</label>
                        <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {logoPreview ? <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-1" /> : <ImageIcon className="text-slate-700" size={24} />}
                            </div>
                            <div className="flex-1">
                                <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                <button onClick={() => document.getElementById('logo-upload')?.click()} disabled={subiendoLogo} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-black px-4 py-3 rounded-xl uppercase tracking-widest transition-colors flex items-center gap-2 border border-slate-700 w-full justify-center disabled:opacity-50 shadow-sm">
                                    <Upload size={14} /> {subiendoLogo ? 'Subiendo...' : 'Cargar Logo'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><FileText size={12} className="text-emerald-500"/> Términos de Garantía</label>
                        <textarea value={inputGarantia || ''} onChange={(e) => setInputGarantia?.(e.target.value)} placeholder="Garantía de 30 días en mano de obra..." className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-950/50 text-xs text-slate-300 font-bold outline-none focus:border-emerald-500 transition-colors min-h-[100px] resize-none" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Percent size={12} className="text-emerald-500"/> Aplicar IVA (19%)</label>
                        </div>
                        <button onClick={() => setIncluirIva?.(!incluirIva)} className={`w-12 h-6 rounded-full transition-colors relative flex items-center shadow-inner ${incluirIva ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                            <div className={`w-4 h-4 bg-slate-100 rounded-full absolute transition-transform shadow-md ${incluirIva ? 'translate-x-7' : 'translate-x-1'}`}></div>
                        </button>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group cursor-pointer hover:border-emerald-500/50 transition-all" onClick={onOpenManual}>
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/10 p-2 rounded-xl"><BookOpen size={16} className="text-emerald-500" /></div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-wider">Manual de Usuario</h4>
                            </div>
                        </div>
                        <ChevronDown size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors -rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🔵 PESTAÑA: EQUIPO Y MECÁNICOS */}
            {pestañaActiva === 'equipo' && (
                <div className="flex flex-col gap-6">
                    
                    {/* 🔥 🪪 TARJETA DE IDENTIFICACIÓN DEL TALLER (NUEVA) */}
                    <div className="bg-blue-950/30 border border-blue-900/50 p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between shadow-inner gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="text-center md:text-left relative z-10">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">ID de tu Taller (Pase de Acceso para Mecánicos)</p>
                            <p className="text-lg md:text-xl font-mono font-black text-slate-200 tracking-wider bg-slate-950/50 px-3 py-1 rounded-lg border border-blue-900/30 inline-block">{tallerId}</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(tallerId || '');
                                toast.success("¡ID copiado al portapapeles!");
                            }}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:scale-105 flex items-center justify-center gap-2 relative z-10"
                        >
                            <Copy size={16} /> Copiar ID
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Formulario Alta */}
                        <div className="lg:col-span-1 bg-slate-950 border border-slate-800 p-6 rounded-3xl h-fit">
                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2"><Plus size={16}/> Alta Operario</h3>
                            <form onSubmit={crearMecanico} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nombre Real</label>
                                    <input type="text" required value={nuevoMecanico.nombre} onChange={e => setNuevoMecanico({...nuevoMecanico, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-blue-500 outline-none" placeholder="Ej: Pedro Mecánico" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Usuario Único</label>
                                    <input type="text" required value={nuevoMecanico.usuario} onChange={e => setNuevoMecanico({...nuevoMecanico, usuario: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-blue-500 outline-none lowercase" placeholder="Ej: pedro88" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">PIN (4 Dígitos)</label>
                                    <input type="text" required maxLength={4} minLength={4} pattern="\d{4}" value={nuevoMecanico.pin} onChange={e => setNuevoMecanico({...nuevoMecanico, pin: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-center tracking-[0.5em] text-lg font-black text-emerald-400 focus:border-blue-500 outline-none" placeholder="••••" />
                                </div>
                                <button type="submit" disabled={guardandoMecanico} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-colors mt-2 disabled:opacity-50">
                                    {guardandoMecanico ? 'Creando...' : 'Crear Acceso'}
                                </button>
                            </form>
                        </div>

                        {/* Lista Mecánicos */}
                        <div className="lg:col-span-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Personal Autorizado</h3>
                            {cargandoMecanicos ? (
                                <Loader2 className="animate-spin text-blue-500 mx-auto" />
                            ) : mecanicos.length === 0 ? (
                                <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800 border-dashed text-slate-500 text-sm font-bold">
                                    No tienes mecánicos en tu equipo aún.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {mecanicos.map(mec => (
                                        <div key={mec.id} className={`flex flex-col p-5 rounded-2xl border ${mec.activo ? 'bg-slate-950 border-slate-800' : 'bg-red-950/20 border-red-900/50 opacity-70'}`}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${mec.activo ? 'bg-blue-900/30 text-blue-400' : 'bg-red-900/30 text-red-500'}`}>
                                                    {mec.nombre.substring(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-200">{mec.nombre}</h4>
                                                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">USER: {mec.usuario}</p>
                                                </div>
                                            </div>

                                            {/* 🔥 EDICIÓN DE PIN EN LÍNEA */}
                                            {editandoPinId === mec.id ? (
                                                <div className="flex items-center gap-2 mt-auto animate-in fade-in zoom-in duration-200">
                                                    <input
                                                        type="text"
                                                        maxLength={4}
                                                        value={nuevoPinValue}
                                                        onChange={e => setNuevoPinValue(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-slate-900 border border-blue-500 rounded-lg px-3 py-2 text-center font-black tracking-[0.5em] text-blue-400 focus:outline-none placeholder-slate-600"
                                                        placeholder="••••"
                                                    />
                                                    <button onClick={() => actualizarPinMecanico(mec.id)} disabled={guardandoPin || nuevoPinValue.length !== 4} className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors disabled:opacity-50">
                                                        {guardandoPin ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                    </button>
                                                    <button onClick={() => setEditandoPinId(null)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 mt-auto">
                                                    <button onClick={() => setQrVisible(mec)} disabled={!mec.activo} className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-emerald-400 transition-colors disabled:opacity-20 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-slate-800">
                                                        <QrCode size={14} /> Gafete
                                                    </button>
                                                    <button onClick={() => { setEditandoPinId(mec.id); setNuevoPinValue(''); }} disabled={!mec.activo} className="p-2 rounded-lg bg-slate-900 border-slate-800 hover:bg-blue-900/50 hover:border-blue-500/50 hover:text-blue-400 text-slate-400 border transition-colors disabled:opacity-20" title="Modificar PIN">
                                                        <Key size={16} />
                                                    </button>
                                                    <button onClick={() => toggleEstadoMecanico(mec.id, mec.activo)} className={`p-2 rounded-lg transition-colors border ${mec.activo ? 'bg-slate-900 border-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 hover:border-red-500/50' : 'bg-red-900/50 border-red-500/50 text-red-400 hover:bg-emerald-900/50 hover:text-emerald-400'}`} title={mec.activo ? "Desvincular (Bloquear Acceso)" : "Restaurar Acceso"}>
                                                        <PowerOff size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER DEL MODAL */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 shrink-0 flex flex-col md:flex-row gap-3 justify-between items-center relative z-10">
            <button onClick={handleLogout} className="w-full md:w-auto py-3 md:px-6 text-slate-500 hover:text-red-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 bg-transparent">
                <LogOut size={14} /> {esOnboarding ? 'Cancelar y Salir' : 'Cerrar Sesión'}
            </button>
            
            <div className="flex w-full md:w-auto gap-3">
              {pestañaActiva === 'taller' && !esOnboarding && (
                  <button onClick={exportarDatosCSV} className="flex-1 md:flex-none py-3 px-6 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
                      <Download size={14} className="text-emerald-400" /> Excel CSV
                  </button>
              )}
              
              {pestañaActiva === 'taller' && (
                <button onClick={guardarConfiguracion} disabled={guardandoConfiguracion || !inputTaller.trim() || !inputTelefono?.trim()} className="flex-1 md:flex-none py-3 px-8 bg-emerald-600 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={14} /> {guardandoConfiguracion ? '...' : (esOnboarding ? 'Comenzar' : 'Guardar')}
                </button>
              )}
            </div>
        </div>

        {/* 💳 SUB-MODAL GAFETE INTELIGENTE (CÓDIGO QR) */}
        {qrVisible && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200">
                <button onClick={() => setQrVisible(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full"><X size={20}/></button>
                
                <div className="bg-white p-8 rounded-[40px] shadow-[0_0_50px_rgba(16,185,129,0.3)] mb-8 flex flex-col items-center border-[8px] border-slate-100 relative">
                    <QRCodeSVG value={`${window.location.origin}/login?t=${tallerId}&u=${qrVisible.usuario}`} size={200} level="H" fgColor="#0f172a" />
                    <div className="absolute -bottom-4 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 border-2 border-slate-950">
                        <ShieldCheck size={14}/> Acceso Seguro
                    </div>
                </div>

                <h3 className="text-3xl font-black uppercase tracking-tighter text-emerald-400 mb-2">{qrVisible.nombre}</h3>
                <p className="text-slate-400 font-mono mb-8 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                    ID Usuario: <strong className="text-white">@{qrVisible.usuario}</strong>
                </p>

                <p className="text-xs font-bold text-slate-500 max-w-sm">
                    Escanear este gafete llevará al mecánico directo a la pantalla de acceso de tu taller.
                </p>
            </div>
        )}

      </div>
    </div>
  )
}