import { useState, useMemo } from 'react'
import { Megaphone, Sparkles, Send, X, AlertOctagon, Users, ChevronRight, ChevronLeft } from 'lucide-react'
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

  // 2. Filtramos la audiencia según lo que elija el mecánico
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
      toast.success("¡Texto mejorado y listo para enviar!", { id: toastId });
    } catch (error) {
      toast.error("Error al conectar con la IA", { id: toastId });
    } finally {
      setMejorandoConIA(false);
    }
  };

  const enviarWhatsApp = (vehiculo: any) => {
    if (!mensajeFinal) { toast.error("Debes generar un mensaje primero"); return; }

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
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      {/* 🟢 AJUSTE: El overflow-y-auto está AHORA en el padre para móviles. Así hace scroll completo como una página */}
      <div className="bg-slate-900 p-5 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl max-w-4xl w-full border border-slate-800 relative flex flex-col md:flex-row gap-6 md:gap-8 max-h-[90vh] overflow-y-auto md:overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-500 hover:text-purple-400 transition-colors z-10">
          <X size={24} />
        </button>

        {/* COLUMNA IZQUIERDA: CREACIÓN */}
        {/* 🟢 AJUSTE: Quitamos el scroll de esta columna en móvil (md:overflow-y-auto) */}
        <div className="flex-1 flex flex-col space-y-5 md:space-y-6 md:border-r border-slate-800/50 pr-0 md:pr-8 md:overflow-y-auto custom-scrollbar-dark shrink-0">
          <div className="pr-8 md:pr-0"> {/* Padding derecho en móvil para no pisar la X */}
            <h3 className="text-xl md:text-2xl font-black mb-1 tracking-tighter uppercase text-slate-100 flex items-center gap-2">
              <Megaphone className="text-purple-500" /> Campañas <span className="hidden sm:inline">de Venta</span>
            </h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold leading-tight">Genera ventas instantáneas contactando a tu base de datos.</p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest block">1. ¿A quién le enviaremos esto?</label>
            <select value={filtro} onChange={e => {setFiltro(e.target.value as any); setPagina(1)}} className="w-full p-3 rounded-xl md:rounded-2xl bg-slate-800 border border-slate-700 text-xs md:text-sm font-bold text-slate-200 outline-none focus:border-purple-500 transition-all">
              <option value="todos">Toda mi base de datos</option>
              <option value="marca">Filtro por Marca de Vehículo</option>
              <option value="inactivos">Clientes Inactivos (+6 meses sin venir)</option>
            </select>
            
            {filtro === 'marca' && (
              <select value={marcaSeleccionada} onChange={e => {setMarcaSeleccionada(e.target.value); setPagina(1)}} className="w-full p-3 rounded-xl md:rounded-2xl bg-slate-950 border border-slate-800 text-xs md:text-sm font-bold text-slate-200 outline-none focus:border-purple-500 transition-all">
                <option value="">Selecciona una marca...</option>
                {marcasDisponibles.map((m: any) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest block">2. ¿Cuál es la promoción?</label>
            <textarea 
              value={borrador} onChange={e => setBorrador(e.target.value)} 
              placeholder="Ej: Cambio de aceite sintético por $25.000 solo esta semana."
              className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-800 border border-slate-700 text-xs md:text-sm text-slate-200 min-h-[80px] resize-none outline-none focus:border-purple-500 transition-all"
            />
            <button onClick={mejorarTextoIA} disabled={mejorandoConIA} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 transition-all uppercase text-[10px] md:text-xs tracking-widest shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-50">
              <Sparkles size={16} /> Mejorar Texto con IA
            </button>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[9px] md:text-[10px] font-black text-purple-400 uppercase tracking-widest block">3. Mensaje Final (Editable)</label>
            <textarea 
              value={mensajeFinal} onChange={e => setMensajeFinal(e.target.value)} 
              placeholder="Aquí aparecerá el mensaje listo para enviar..."
              className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-950 border-2 border-purple-900/50 text-xs md:text-sm text-slate-300 min-h-[120px] md:min-h-[140px] resize-none outline-none focus:border-purple-500 transition-all"
            />
            <p className="text-[8px] md:text-[9px] text-slate-500 font-bold leading-tight">Nota: Deja las etiquetas [NOMBRE] y [VEHICULO], el sistema las cambiará por el nombre real de cada persona.</p>
          </div>
        </div>

        {/* COLUMNA DERECHA: ENVÍO */}
        {/* 🟢 AJUSTE: Limitamos la altura de esta columna en móvil a un mínimo de 350px, pero en PC sigue siendo h-full */}
        <div className="flex-1 flex flex-col md:h-full md:overflow-hidden shrink-0 mt-4 md:mt-0">
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col h-full min-h-[350px] md:min-h-0 relative">
            
            <div className="flex justify-between items-end mb-3 md:mb-4">
              <div>
                <h4 className="text-xs md:text-sm font-black text-slate-200 uppercase flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> Audiencia Lista
                </h4>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-1">
                  Se encontraron <span className="text-blue-400">{audiencia.length}</span> clientes.
                </p>
              </div>
            </div>

            <div className="bg-orange-950/20 border border-orange-900/50 rounded-xl p-3 mb-3 md:mb-4 flex gap-2">
              <AlertOctagon size={16} className="text-orange-500 shrink-0" />
              <p className="text-[8px] md:text-[9px] text-orange-400 font-bold leading-tight">
                Para evitar que WhatsApp bloquee tu número por SPAM, enviamos las campañas en bloques de 20. Envía los de esta página y toma un descanso antes de seguir.
              </p>
            </div>

            {/* 🟢 AJUSTE: flex-1 solo aplica bien si el padre controla la altura.  */}
            <div className="flex-1 overflow-y-auto custom-scrollbar-dark space-y-2 pr-1 md:pr-2">
              {audienciaPaginada.map(v => (
                <div key={v.id} className="bg-slate-800/40 p-2.5 md:p-3 rounded-xl flex justify-between items-center border border-slate-700/50 hover:border-slate-600 transition-colors group">
                  <div className="overflow-hidden pr-2">
                    <p className="font-black text-[10px] md:text-xs text-slate-200 uppercase truncate">{v.clientes.nombre}</p>
                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold truncate">{v.marca} {v.modelo}</p>
                  </div>
                  <button 
                    onClick={() => enviarWhatsApp(v)}
                    disabled={!mensajeFinal}
                    className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-blue-600/20 flex items-center gap-1 shrink-0"
                    title="Enviar Oferta"
                  >
                    <Send size={14} /> <span className="text-[9px] md:text-[10px] font-black uppercase hidden sm:block">Enviar</span>
                  </button>
                </div>
              ))}
              
              {audiencia.length === 0 && (
                <div className="h-full flex items-center justify-center flex-col text-slate-600 py-8">
                  <Users size={24} className="mb-2 opacity-50 md:w-8 md:h-8" />
                  <p className="text-[10px] md:text-xs font-bold text-center leading-tight">No hay clientes que cumplan<br/>este filtro con celular válido.</p>
                </div>
              )}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-800 flex justify-between items-center shrink-0">
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="p-1 md:p-2 text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Lote {pagina} de {totalPaginas}</span>
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="p-1 md:p-2 text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}