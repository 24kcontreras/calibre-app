'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Circle, Clock, Wrench, Search, Package, CheckSquare, CarFront, AlertCircle } from 'lucide-react'

// Definimos el orden lógico de los estados para la línea de tiempo
const PASOS_PROCESO = [
  { id: 'Diagnóstico', nombre: 'Diagnóstico en curso', icono: Search, desc: 'Revisando el vehículo detalladamente.' },
  { id: 'Pendiente Aprobación', nombre: 'Presupuesto enviado', icono: Clock, desc: 'Esperando tu confirmación para proceder.' },
  { id: 'Esperando Repuestos', nombre: 'Esperando repuestos', icono: Package, desc: 'Las piezas están en camino al taller.' },
  { id: 'En Reparación', nombre: 'En Reparación', icono: Wrench, desc: 'Nuestros mecánicos están trabajando en tu vehículo.' },
  { id: 'Listo para Entrega', nombre: '¡Listo para Entrega!', icono: CheckSquare, desc: 'Tu vehículo está listo. ¡Te esperamos!' }
];

export default function EstadoVehiculoCliente() {
  const params = useParams();
  const idOrden = params.id as string;

  const [orden, setOrden] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEstado = async () => {
      if (!idOrden) return;
      setCargando(true);
      try {
        // Consultamos la orden, el vehículo y el nombre del taller (del metadata del usuario creador)
        // NOTA: Para que esta consulta pública funcione con RLS activado, 
        // asegúrate de tener una política que permita SELECT público a ordenes_trabajo por ID.
        // Si no la tienes aún, la agregaremos en el siguiente paso.
        const { data, error: err } = await supabase
          .from('ordenes_trabajo')
          .select('*, vehiculos(*, clientes(nombre)), perfiles_talleres:taller_id(nombre_taller)') // Asumiendo que tienes una forma de traer el nombre, sino lo sacamos del metadata
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

    // Sincronización en tiempo real (Opcional, pero le da un toque mágico)
    const channel = supabase.channel(`public:ordenes_trabajo:id=eq.${idOrden}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ordenes_trabajo', filter: `id=eq.${idOrden}` }, (payload) => {
        setOrden((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idOrden]);

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

  // Lógica para determinar qué paso está activo
  const estadoActual = orden.estado === 'Finalizada' ? 'Listo para Entrega' : (orden.sub_estado || 'Diagnóstico');
  const indiceActual = PASOS_PROCESO.findIndex(p => p.id === estadoActual);
  
  // Ofuscamos la patente por privacidad (Ej: AB•CD•12)
  const patenteOculta = orden.vehiculos?.patente ? `${orden.vehiculos.patente.substring(0, 2)}•••${orden.vehiculos.patente.slice(-2)}` : 'S/N';
  const nombreCliente = orden.vehiculos?.clientes?.nombre ? orden.vehiculos.clientes.nombre.split(' ')[0] : 'Cliente';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans flex flex-col items-center relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-xl relative z-10">
        
        {/* Cabecera Taller */}
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

        {/* Tarjeta de Información del Vehículo */}
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

        {/* Línea de Tiempo (Timeline) */}
        <section className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl mb-12">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Progreso de la Reparación</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                {PASOS_PROCESO.map((paso, index) => {
                    const completado = index < indiceActual;
                    const activo = index === indiceActual;
                    const pendiente = index > indiceActual;
                    
                    const Icono = paso.icono;

                    return (
                        <div key={paso.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            {/* Icono central */}
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-10 transition-colors duration-500
                                ${completado ? 'bg-emerald-500 border-emerald-900 text-slate-950' : 
                                  activo ? 'bg-blue-500 border-blue-900 text-slate-950 animate-pulse' : 
                                  'bg-slate-900 border-slate-800 text-slate-600'}`}
                            >
                                {completado ? <CheckCircle2 size={20} /> : <Icono size={18} />}
                            </div>

                            {/* Contenido (Texto) */}
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl transition-all duration-300
                                ${activo ? 'bg-slate-800/80 border border-slate-700 shadow-lg' : 'bg-transparent border border-transparent'}">
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

        {/* Footer Comercial (La "trampa" de marketing) */}
        <footer className="text-center pb-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Transparencia garantizada por</p>
            <div className="flex items-center justify-center gap-2 text-slate-300">
                <Wrench className="text-emerald-500" size={16} />
                <span className="font-black text-xl tracking-tighter">CALIBRE</span>
            </div>
            <p className="text-[8px] text-slate-600 mt-2 font-bold">SOFTWARE PARA TALLERES MODERNOS</p>
        </footer>

      </div>
    </main>
  )
}