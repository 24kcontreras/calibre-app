import { useState, useMemo } from 'react'
import { Megaphone, Sparkles, Send, X, Users, ChevronRight, ChevronLeft, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

interface ModalMarketingProps {
  onClose: () => void;
  vehiculos: any[];
  historial: any[];
  nombreTaller: string;
}

export default function ModalMarketing({ onClose, vehiculos, historial, nombreTaller }: ModalMarketingProps) {
  const [filtro, setFiltro] = useState<'todos' | 'marca' | 'inactivos'>('todos');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
  const [borrador, setBorrador] = useState('');
  const [mensajeFinal, setMensajeFinal] = useState('');
  const [mejorandoConIA, setMejorandoConIA] = useState(false);
  const [pagina, setPagina] = useState(1);

  // 1. Extraemos las marcas únicas para el selector
  const marcasDisponibles = Array.from(new Set(vehiculos.map(v => v.marca))).filter(Boolean);

  // 2. Filtramos la audiencia para las promociones masivas
  const audiencia = useMemo(() => {
    const hoy = new Date();
    const hace6Meses = new Date();
    hace6Meses.setMonth(hoy.getMonth() - 6);

    // Solo clientes con número válido
    let filtrados = vehiculos.filter(v => v.clientes?.telefono && v.clientes.telefono.length >= 11);

    if (filtro === 'marca' && marcaSeleccionada) {
      filtrados = filtrados.filter(v => v.marca === marcaSeleccionada);
    } 
    else if (filtro === 'inactivos') {
      filtrados = filtrados.filter(v => {
        const ultimaOrden = historial.find(o => o.vehiculo_id === v.id);
        if (!ultimaOrden) return false;
        return new Date(ultimaOrden.created_at) < hace6Meses;
      });
    }
    
    // Eliminamos duplicados (si un cliente tiene 2 autos, le mandamos solo 1 msj)
    const unicos = [];
    const telefonosVistos = new Set();
    for (const v of filtrados) {
        if (!telefonosVistos.has(v.clientes.telefono)) {
            telefonosVistos.add(v.clientes.telefono);
            unicos.push(v);
        }
    }
    return unicos;
  }, [vehiculos, historial, filtro, marcaSeleccionada]);

  // Paginación (20 por página para cuidar el WhatsApp)
  const totalPaginas = Math.ceil(audiencia.length / 20) || 1;
  const audienciaPaginada = audiencia.slice((pagina - 1) * 20, pagina * 20);

  const mejorarTextoIA = async () => {
    if (!borrador.trim()) { toast.error("Escribe una idea primero"); return; }
    setMejorandoConIA(true);
    const toastId = toast.loading("La IA está redactando tu oferta...");

    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrador })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setMensajeFinal(data.resultado);
      toast.success("¡Oferta lista para enviar!", { id: toastId });
    } catch (error) {
      toast.error("Error al conectar con la IA", { id: toastId });
    } finally {
      setMejorandoConIA(false);
    }
  };

  const enviarWhatsApp = (vehiculo: any) => {
    if (!mensajeFinal) { toast.error("Debes generar una oferta primero"); return; }

    const cliente = vehiculo.clientes?.nombre || 'Estimado(a)';
    const vehiculoNombre = `${vehiculo.marca} ${vehiculo.modelo}`;
    
    // Reemplazamos las etiquetas mágicas
    const mensajePersonalizado = mensajeFinal
      .replace(/\[NOMBRE\]/gi, cliente)
      .replace(/\[VEHICULO\]/gi, vehiculoNombre)
      .replace(/\[TALLER\]/gi, nombreTaller);

    const telefono = vehiculo.clientes.telefono.replace('+', '');
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensajePersonalizado)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
      <div className="bg-slate-900 border border-slate-700/50 rounded-[35px] shadow-2xl max-w-5xl w-full relative overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Halo de luz decorativo */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-cyan-400 bg-slate-950/50 p-2 rounded-full border border-slate-800 transition-all hover:scale-110 z-20">
          <X size={20} />
        </button>

        {/* ========================================================= */}
        {/* COLUMNA IZQUIERDA: EL LABORATORIO DE CAMPAÑAS (CREACIÓN)  */}
        {/* ========================================================= */}
        <div className="w-full md:w-[55%] flex flex-col p-6 lg:p-8 border-b md:border-b-0 md:border-r border-slate-800/50 relative z-10 overflow-y-auto custom-scrollbar-dark shrink-0 bg-slate-900/50">
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                <Megaphone className="text-cyan-500" /> Creador de Ofertas
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
               <Zap size={12} className="text-yellow-500"/> Campañas masivas y promociones
            </p>
          </div>

          <div className="space-y-6 flex-1">
            {/* PASO 1: SEGMENTACIÓN */}
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                    <span className="bg-cyan-500/20 text-cyan-500 w-5 h-5 rounded-full flex items-center justify-center">1</span> 
                    Selecciona tu Audiencia
                </label>
                <select value={filtro} onChange={e => {setFiltro(e.target.value as any); setPagina(1)}} className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-slate-200 outline-none focus:border-cyan-500 transition-all mb-3 hover:border-slate-600">
                <option value="todos">Toda mi base de datos</option>
                <option value="marca">Solo dueños de una Marca Específica</option>
                <option value="inactivos">Clientes Dormidos (+6 meses sin venir)</option>
                </select>
                
                {filtro === 'marca' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <select value={marcaSeleccionada} onChange={e => {setMarcaSeleccionada(e.target.value); setPagina(1)}} className="w-full p-4 rounded-xl bg-slate-900 border border-cyan-900/50 text-sm font-bold text-cyan-100 outline-none focus:border-cyan-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <option value="">Selecciona qué marca atacar...</option>
                        {marcasDisponibles.map((m: any) => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                )}
            </div>

            {/* PASO 2: REDACCIÓN */}
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex-1 flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                    <span className="bg-purple-500/20 text-purple-500 w-5 h-5 rounded-full flex items-center justify-center">2</span> 
                    ¿Qué quieres promocionar?
                </label>
                
                <textarea 
                    value={borrador} onChange={e => setBorrador(e.target.value)} 
                    placeholder="Ej: Solo por octubre, todos los dueños de Toyota tienen un 15% de descuento en cambio de aceite. Escríbeme para agendar."
                    className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 min-h-[100px] resize-none outline-none focus:border-purple-500 transition-all mb-4 custom-scrollbar-dark hover:border-slate-600"
                />
                
                <button 
                    onClick={mejorarTextoIA} 
                    disabled={mejorandoConIA} 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] disabled:opacity-50 hover:scale-[1.01]"
                >
                    <Sparkles size={16} className={mejorandoConIA ? "animate-spin" : ""} /> 
                    {mejorandoConIA ? 'La IA está escribiendo...' : 'Generar Oferta Irresistible (IA)'}
                </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA DERECHA: RESULTADO Y DISTRIBUCIÓN                 */}
        {/* ========================================================= */}
        <div className="w-full md:w-[45%] flex flex-col relative z-10 bg-slate-900">
            
            {/* PANTALLA RESULTADO IA */}
            <div className="p-6 lg:p-8 border-b border-slate-800/50 bg-slate-950/30">
                <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                    <span className="bg-cyan-500/20 text-cyan-500 w-5 h-5 rounded-full flex items-center justify-center">3</span> 
                    Mensaje Final de la Campaña
                </label>
                <textarea 
                    value={mensajeFinal} onChange={e => setMensajeFinal(e.target.value)} 
                    placeholder="Aquí aparecerá tu oferta lista y formateada por la IA..."
                    className="w-full p-4 rounded-xl bg-slate-900 border-2 border-cyan-900/30 text-sm font-medium text-slate-200 min-h-[160px] resize-none outline-none focus:border-cyan-500 transition-all custom-scrollbar-dark shadow-inner"
                />
                <p className="text-[9px] text-slate-500 font-bold mt-2 text-right">
                    Variables dinámicas: <span className="text-cyan-600 font-black">[NOMBRE]</span> y <span className="text-cyan-600 font-black">[VEHICULO]</span>
                </p>
            </div>

            {/* LISTA DE DISTRIBUCIÓN (LA ESCOPETA) */}
            <div className="p-6 lg:p-8 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            <Users size={16} className="text-cyan-500" /> Lista de Envío
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                            Impacto estimado: <span className="text-cyan-400 font-black">{audiencia.length} clientes</span>
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-2 space-y-2">
                    {audienciaPaginada.map(v => (
                        <div key={v.id} className="bg-slate-950/50 p-3 rounded-xl flex justify-between items-center border border-slate-800 hover:border-cyan-900/50 transition-colors group">
                            <div className="overflow-hidden pr-2">
                                <p className="font-black text-xs text-slate-200 uppercase truncate">{v.clientes.nombre}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold truncate">{v.marca} {v.modelo}</p>
                            </div>
                            <button 
                                onClick={() => enviarWhatsApp(v)}
                                disabled={!mensajeFinal}
                                className="bg-cyan-600/10 text-cyan-500 hover:bg-cyan-600 hover:text-white p-2.5 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-cyan-600/10 flex items-center justify-center gap-2 shrink-0 group-hover:scale-105"
                                title="Disparar Oferta"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    ))}
                    
                    {audiencia.length === 0 && (
                        <div className="h-full flex items-center justify-center flex-col text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                            <Users size={32} className="mb-3 opacity-20" />
                            <p className="text-xs font-bold text-center leading-tight uppercase tracking-widest">Sin audiencia<br/>para este filtro</p>
                        </div>
                    )}
                </div>

                {/* PAGINACIÓN */}
                {totalPaginas > 1 && (
                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center shrink-0">
                        <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="bg-slate-900 p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-900/20 border border-slate-800 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lote {pagina} de {totalPaginas}</span>
                        <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="bg-slate-900 p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-900/20 border border-slate-800 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  )
}