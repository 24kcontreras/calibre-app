'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, ClipboardList, Circle, Clock, Wrench, Search, Package, CheckSquare, CarFront, AlertCircle, Fuel, AlertTriangle, ShieldAlert, Camera, Car, BatteryWarning, Droplets, ChevronDown, ShieldCheck, Thermometer, CircleDot } from 'lucide-react'
import CalificacionCliente from '@/components/CalificacionCliente';
import Car3DViewer from '@/components/Car3DViewer'

const PASOS_PROCESO = [
  { id: 'Diagnóstico', nombre: 'Diagnóstico en curso', icono: Search, desc: 'Revisando el vehículo detalladamente.' },
  { id: 'Pendiente Aprobación', nombre: 'Presupuesto enviado', icono: Clock, desc: 'Esperando tu confirmación para proceder.' },
  { id: 'Esperando Repuestos', nombre: 'Esperando repuestos', icono: Package, desc: 'Las piezas están en camino al taller.' },
  { id: 'En Reparación', nombre: 'En Reparación', icono: Wrench, desc: 'Nuestros mecánicos están trabajando en tu vehículo.' },
  { id: 'Listo para Entrega', nombre: '¡Listo para Entrega!', icono: CheckSquare, desc: 'Tu vehículo está listo. ¡Te esperamos!' }
];

export default function EstadoVehiculoCliente() {
  const [orden, setOrden] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // 🔥 ESTADO PARA EL ACORDEÓN
  const [recepcionDesplegada, setRecepcionDesplegada] = useState(false);

  useEffect(() => {
    const ruta = window.location.pathname;
    const idOrden = ruta.split('/').pop();

    if (!idOrden || idOrden === 'estado') {
        setError('Enlace incompleto o inválido.');
        setCargando(false);
        return;
    }

    const fetchEstado = async () => {
      try {
        const { data, error: err } = await supabase
          .from('ordenes_trabajo')
          .select('*, vehiculos(*, clientes(nombre)), items_orden(*), fotos_orden(*)')
          .eq('id', idOrden)
          .single();

        if (err) throw err;
        setOrden(data);
      } catch (err: any) {
        console.error('Error cargando orden:', err);
        setError('No pudimos encontrar la información de este vehículo. Verifica que el enlace sea correcto.');
      } finally {
        setCargando(false); 
      }
    };

    fetchEstado();

    const channel = supabase.channel(`public:ordenes_trabajo:id=eq.${idOrden}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ordenes_trabajo', filter: `id=eq.${idOrden}` }, (payload) => {
        setOrden((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items_orden', filter: `orden_id=eq.${idOrden}` }, () => {
        fetchEstado();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Wrench className="animate-spin text-emerald-500 mb-4" size={48} />
        <p className="text-emerald-400 font-black uppercase tracking-widest text-sm animate-pulse">Buscando tu vehículo...</p>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-2">Enlace no válido</h1>
        <p className="text-slate-400 font-bold max-w-md">{error}</p>
      </div>
    );
  }

  const estadoActual = orden.estado === 'Finalizada' ? 'Listo para Entrega' : (orden.sub_estado || 'Diagnóstico');
  const indiceActual = PASOS_PROCESO.findIndex(p => p.id === estadoActual);
  const patenteOculta = orden.vehiculos?.patente ? `${orden.vehiculos.patente.substring(0, 2)}•••${orden.vehiculos.patente.slice(-2)}` : 'S/N';
  const nombreCliente = orden.vehiculos?.clientes?.nombre ? orden.vehiculos.clientes.nombre.split(' ')[0] : 'Cliente';

  const servicios = orden.items_orden?.filter((i: any) => i.tipo_item === 'servicio') || [];
  const repuestos = orden.items_orden?.filter((i: any) => i.tipo_item === 'repuesto') || [];

  const combustibleValue = Number(orden.nivel_combustible) || 0;
  const gradosAguja = (combustibleValue / 100) * 180 - 90; // 🔥 Calculamos los grados para el cliente

  let testigosPrendidos: string[] = [];
  try { testigosPrendidos = typeof orden.testigos === 'string' ? JSON.parse(orden.testigos) : (orden.testigos || []); } catch (e) { testigosPrendidos = []; }
  
  let marcadoresDanos: any[] = [];
  try { marcadoresDanos = typeof orden.danos_carroceria === 'string' ? JSON.parse(orden.danos_carroceria) : (orden.danos_carroceria || []); } catch (e) { marcadoresDanos = []; }
  
  const fotosRecepcion = orden.fotos_orden?.filter((f: any) => f.descripcion === "Estado Inicial (Recepción)") || [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-xl relative z-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 border border-slate-800 rounded-2xl mb-4 shadow-xl">
             <CarFront className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-100 mb-1">
             Estado de tu Vehículo
          </h1>
          <p className="text-emerald-400 font-bold tracking-widest uppercase text-xs">
            Actualizado en tiempo real
          </p>
        </header>

        <section className="bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-8">
            <h2 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Hola, {nombreCliente}</h2>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-2xl font-black text-slate-100 uppercase tracking-tighter">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</p>
                    <p className="text-slate-500 font-bold uppercase text-xs mt-1">Patente: <span className="text-slate-300">{patenteOculta}</span></p>
                </div>
                <div className="text-right">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${orden.estado === 'Finalizada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {orden.estado === 'Finalizada' ? 'FINALIZADO' : 'EN TALLER'}
                    </span>
                </div>
            </div>
        </section>

        {/* 🔥 FASE 2: SECCIÓN UNIFICADA ACTA DE RECEPCIÓN + 3D */}
        <section className="bg-slate-900/30 backdrop-blur-md rounded-3xl border border-emerald-900/30 shadow-xl mb-8 overflow-hidden transition-all duration-300">
            {/* BOTÓN PARA DESPLEGAR */}
            <button 
                onClick={() => setRecepcionDesplegada(!recepcionDesplegada)}
                className="w-full flex items-center justify-between p-6 focus:outline-none hover:bg-slate-800/50 transition-colors"
            >
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-500"/> Estado Inicial de Recepción
                </h3>
                <ChevronDown size={20} className={`text-emerald-400 transition-transform duration-500 ${recepcionDesplegada ? 'rotate-180' : ''}`} />
            </button>
            
            {/* CONTENIDO OCULTO/VISIBLE */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden px-6 ${recepcionDesplegada ? 'max-h-[2500px] pb-6 opacity-100' : 'max-h-0 opacity-0 pb-0'}`}>
                <div className="border-t border-slate-800/50 pt-5 space-y-6">
                    
                    <p className="text-[11px] md:text-xs text-slate-400 font-bold leading-relaxed mb-2">
                        Este es el reporte visual y técnico exacto de cómo ingresó tu vehículo a nuestras instalaciones. Documenta daños previos de carrocería, nivel de combustible y alertas en el tablero.
                    </p>

                    {/* Mapa 3D */}
                    {marcadoresDanos.length > 0 && (
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Car size={14} className="text-orange-400" /> Mapa de Daños Carrocería 3D
                            </h4>
                            <div className="rounded-xl overflow-hidden border border-slate-800/50 relative">
                                <Car3DViewer marcadores={marcadoresDanos} soloLectura={true} />
                            </div>
                            <p className="text-[11px] text-slate-300 font-bold italic text-center w-full mt-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                                {orden.danos_previos ? `"${orden.danos_previos}"` : "Carrocería sin detalles adicionales reportados."}
                            </p>
                        </div>
                    )}

                    {/* Combustible y Testigos en Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Combustible SVG Premium */}
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Fuel size={14} className="text-blue-400" /> Nivel Combustible
                            </h4>
                            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col items-center flex-1 justify-center">
                                <svg viewBox="0 0 200 120" className="w-full max-w-[160px] drop-shadow-[0_0_15px_rgba(51,65,85,0.5)]">
                                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                                    <line x1="20" y1="100" x2="35" y2="100" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/> 
                                    <line x1="43" y1="43" x2="54" y2="54" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/> 
                                    <line x1="100" y1="20" x2="100" y2="35" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/> 
                                    <line x1="157" y1="43" x2="146" y2="54" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/> 
                                    <line x1="180" y1="100" x2="165" y2="100" stroke="#10b981" strokeWidth="6" strokeLinecap="round"/> 
                                    <g style={{ transform: `rotate(${gradosAguja}deg)`, transformOrigin: '100px 100px', transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                        <polygon points="97,100 103,100 100,25" fill="#ef4444" />
                                        <circle cx="100" cy="100" r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
                                    </g>
                                    <text x="28" y="118" fill="#ef4444" fontSize="16" fontWeight="900" textAnchor="middle">E</text>
                                    <text x="100" y="55" fill="#64748b" fontSize="14" fontWeight="bold" textAnchor="middle">1/2</text>
                                    <text x="172" y="118" fill="#10b981" fontSize="16" fontWeight="900" textAnchor="middle">F</text>
                                </svg>
                                <div className={`text-lg font-black mt-2 ${combustibleValue <= 15 ? 'text-red-400' : 'text-emerald-400'}`}>{combustibleValue}%</div>
                            </div>
                        </div>

                        {/* Testigos */}
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-red-400" /> Testigos Encendidos
                            </h4>
                            {testigosPrendidos.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {testigosPrendidos.includes('check_engine') && <span className="bg-red-950/30 text-red-400 border border-red-900/50 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><AlertCircle size={12}/> Check Engine</span>}
                                    {testigosPrendidos.includes('aceite') && <span className="bg-red-950/30 text-red-400 border border-red-900/50 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><Droplets size={12}/> Presión Aceite</span>}
                                    {testigosPrendidos.includes('bateria') && <span className="bg-red-950/30 text-red-400 border border-red-900/50 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><BatteryWarning size={12}/> Batería</span>}
                                    {testigosPrendidos.includes('abs') && <span className="bg-yellow-950/30 text-yellow-400 border border-yellow-900/50 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><AlertCircle size={12}/> ABS</span>}
                                    {testigosPrendidos.includes('temperatura') && <span className="bg-red-950/30 text-red-400 border border-red-900/50 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><Thermometer size={12}/> Temperatura</span>}
                                    {testigosPrendidos.includes('frenos') && <span className="bg-red-950/30 text-red-400 border border-red-900/50 px-3 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><CircleDot size={12}/> Frenos</span>}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-xl p-4 bg-slate-900/30">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sin alertas en tablero</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Objetos de valor */}
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><ShieldAlert size={14} className="text-purple-400"/> Objetos de Valor</h4>
                        <p className="text-xs text-slate-300 font-bold italic">{orden.objetos_valor ? `"${orden.objetos_valor}"` : "Sin objetos declarados al ingresar."}</p>
                    </div>

                    {/* Fotos Iniciales */}
                    {fotosRecepcion.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1"><Camera size={14} className="text-emerald-400"/> Evidencia Fotográfica</h4>
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-dark snap-x">
                                {fotosRecepcion.map((foto: any) => (
                                    <a href={foto.url} target="_blank" rel="noreferrer" key={foto.id} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-700 block snap-center shadow-md">
                                        <img src={foto.url} alt="Evidencia" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* SECCIÓN: DESGLOSE DE TRABAJOS (REPUESTOS SIN PRECIO) */}
        {(servicios.length > 0 || repuestos.length > 0 || orden.costo_revision > 0) && (
            <section className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl mb-8">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Desglose de Trabajos</h3>
                
                {/* Servicios y Revisión */}
                {(servicios.length > 0 || orden.costo_revision > 0) && (
                    <div className="mb-6">
                        <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Servicios y Mano de Obra</h4>
                        <div className="space-y-3">
                            {/* Mostramos el Costo de Revisión como si fuera un servicio más */}
                            {orden.costo_revision > 0 && (
                                <div className="flex justify-between items-start border-b border-slate-800/50 pb-2">
                                    <div className="flex gap-2 items-start w-[70%]">
                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-xs uppercase leading-tight text-slate-300">Diagnóstico / Revisión Inicial</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 shrink-0">${orden.costo_revision.toLocaleString('es-CL')}</span>
                                </div>
                            )}

                            {servicios.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-start border-b border-slate-800/50 pb-2 last:border-0">
                                    <div className="flex gap-2 items-start w-[70%]">
                                        {s.realizado ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> : <Circle size={14} className="text-slate-600 shrink-0 mt-0.5" />}
                                        <span className={`text-xs uppercase leading-tight ${s.realizado ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{s.descripcion}</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 shrink-0">${s.precio.toLocaleString('es-CL')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Repuestos SIN PRECIO */}
                {repuestos.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">Repuestos e Insumos Aplicados</h4>
                        <div className="space-y-3">
                            {repuestos.map((r: any) => (
                                <div key={r.id} className="flex justify-between items-start border-b border-slate-800/50 pb-2 last:border-0">
                                    <div className="flex gap-2 items-start w-full">
                                        {r.realizado ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> : <Circle size={14} className="text-slate-600 shrink-0 mt-0.5" />}
                                        <div className="flex flex-col">
                                            <span className={`text-xs uppercase leading-tight ${r.realizado ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{r.descripcion}</span>
                                            {r.procedencia && <span className="text-[9px] text-slate-600 uppercase mt-1">({r.procedencia})</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        )}

        <section className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Progreso de la Reparación</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                {PASOS_PROCESO.map((paso, index) => {
                    const completado = index < indiceActual;
                    const activo = index === indiceActual;
                    const Icono = paso.icono;

                    return (
                        <div key={paso.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-10 transition-colors duration-500
                                ${completado ? 'bg-emerald-500 border-emerald-900 text-slate-950' : 
                                  activo ? 'bg-blue-500 border-blue-900 text-slate-950 animate-pulse' : 
                                  'bg-slate-900 border-slate-800 text-slate-600'}`}
                            >
                                {completado ? <CheckCircle2 size={20} /> : <Icono size={18} />}
                            </div>

                            <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl transition-all duration-300
                                ${activo ? 'bg-slate-800/80 border border-slate-700 shadow-lg' : 'bg-transparent border border-transparent'}`}>
                                <h4 className={`font-black text-sm uppercase tracking-wider mb-1 
                                    ${completado ? 'text-slate-300' : activo ? 'text-blue-400' : 'text-slate-600'}`}>
                                    {paso.nombre}
                                </h4>
                                <p className={`text-xs font-bold leading-relaxed
                                    ${activo ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {paso.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>

        {orden.estado === 'Abierta' && orden.sub_estado === 'En Reparación' && (
            <div className="mb-12">
                <CalificacionCliente ordenId={orden.id} tipo="intermedio" />
            </div>
        )}

        {orden.estado === 'Finalizada' && (
            <div className="mb-12">
                <CalificacionCliente ordenId={orden.id} tipo="final" />
            </div>
        )}

        <footer className="text-center pb-8 mt-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Transparencia garantizada por</p>
            <div className="flex items-center justify-center gap-2 text-slate-300">
                <Wrench className="text-emerald-500" size={16} />
                <span className="font-black text-xl tracking-tighter">CALIBRE</span>
            </div>
        </footer>
      </div>
    </main>
  )
}