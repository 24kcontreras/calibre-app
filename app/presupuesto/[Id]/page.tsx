'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, CheckCircle2, Circle, Receipt, ShieldCheck, Wrench, Clock, Phone, ArrowRight } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function PresupuestoCliente() {
  const [orden, setOrden] = useState<any>(null);
  const [taller, setTaller] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aprobando, setAprobando] = useState(false);
  const [aprobado, setAprobado] = useState(false);

  useEffect(() => {
    const ruta = window.location.pathname;
    const idOrden = ruta.split('/').pop();

    if (!idOrden || idOrden === 'presupuesto') {
        setError('Enlace de presupuesto inválido.');
        setCargando(false);
        return;
    }

    const fetchPresupuesto = async () => {
      try {
        // 1. Traemos la orden y el vehículo
        const { data: dataOrden, error: errOrden } = await supabase
          .from('ordenes_trabajo')
          .select('*, vehiculos(*, clientes(*)), items_orden(*)')
          .eq('id', idOrden)
          .single();

        if (errOrden) throw errOrden;
        setOrden(dataOrden);

        // Si ya estaba aprobado o más avanzado, lo marcamos
        if (dataOrden.sub_estado !== 'Diagnóstico' && dataOrden.sub_estado !== 'Pendiente Aprobación') {
            setAprobado(true);
        }

        // 2. Traemos los datos del taller para el botón de contacto
        if (dataOrden.taller_id) {
            const { data: dataTaller } = await supabase
                .from('talleres')
                .select('nombre_taller, telefono_taller')
                .eq('id', dataOrden.taller_id)
                .single();
            if (dataTaller) setTaller(dataTaller);
        }

      } catch (err: any) {
        setError('No pudimos encontrar este presupuesto. Verifica que el enlace sea el correcto.');
      } finally {
        setCargando(false); 
      }
    };

    fetchPresupuesto();
  }, []);

  const handleAprobarPresupuesto = async () => {
      setAprobando(true);
      try {
          const { error } = await supabase
              .from('ordenes_trabajo')
              .update({ sub_estado: 'Esperando Repuestos' }) // Avanzamos el estado automáticamente
              .eq('id', orden.id);
          
          if (error) throw error;
          
          setAprobado(true);
          toast.success("¡Reparación Aprobada con éxito!");

          // Opcional: Podrías disparar un email o notificación al taller aquí en el futuro
      } catch (err) {
          toast.error("Hubo un error al aprobar. Intenta nuevamente o contacta al taller.");
      } finally {
          setAprobando(false);
      }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Receipt className="animate-pulse text-emerald-500 mb-4" size={48} />
        <p className="text-emerald-400 font-black uppercase tracking-widest text-sm animate-pulse">Cargando Presupuesto...</p>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-2">Presupuesto no encontrado</h1>
        <p className="text-slate-400 font-bold max-w-md">{error}</p>
      </div>
    );
  }

  const nombreCliente = orden.vehiculos?.clientes?.nombre ? orden.vehiculos.clientes.nombre.split(' ')[0] : 'Cliente';
  const servicios = orden.items_orden?.filter((i: any) => i.tipo_item === 'servicio') || [];
  const repuestos = orden.items_orden?.filter((i: any) => i.tipo_item === 'repuesto') || [];
  
  // Cálculos matemáticos
  const subtotalServicios = servicios.reduce((sum: number, item: any) => sum + item.precio, 0);
  const subtotalRepuestos = repuestos.reduce((sum: number, item: any) => sum + item.precio, 0);
  const costoRevision = orden.costo_revision || 0;
  const descuento = orden.descuento || 0;
  const totalBruto = subtotalServicios + subtotalRepuestos + costoRevision;
  const totalNeto = totalBruto - descuento;

  const urlWhatsapp = taller?.telefono_taller ? `https://wa.me/${taller.telefono_taller.replace('+', '')}?text=Hola,%20tengo%20una%20duda%20con%20el%20presupuesto%20de%20mi%20vehículo%20${orden.vehiculos?.patente}` : '#';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <Toaster position="bottom-center" />

      <div className="w-full max-w-xl relative z-10">
        
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 border border-slate-800 rounded-2xl mb-4 shadow-xl">
             <Receipt className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-100 mb-1">
             Presupuesto Oficial
          </h1>
          <p className="text-slate-400 font-bold uppercase text-xs">
            {taller?.nombre_taller || 'Taller Automotriz'}
          </p>
        </header>

        {/* BANNERS DE ESTADO */}
        {aprobado ? (
            <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-2xl mb-6 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="text-emerald-400 shrink-0" size={28} />
                <div>
                    <h3 className="text-emerald-400 font-black uppercase tracking-widest text-sm">Presupuesto Aprobado</h3>
                    <p className="text-emerald-500/80 text-xs font-bold mt-0.5">El taller ya está gestionando tu reparación.</p>
                </div>
            </div>
        ) : (
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl mb-6 flex items-center gap-3">
                <Clock className="text-blue-400 shrink-0" size={24} />
                <div>
                    <h3 className="text-blue-400 font-black uppercase tracking-widest text-xs">Acción Requerida</h3>
                    <p className="text-slate-400 text-[10px] font-bold mt-0.5">Este presupuesto tiene una <strong className="text-slate-200">validez de 5 días</strong> desde su emisión.</p>
                </div>
            </div>
        )}

        <section className="bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-6">
            <h2 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Vehículo de {nombreCliente}</h2>
            <p className="text-2xl font-black text-slate-100 uppercase tracking-tighter">{orden.vehiculos?.marca} {orden.vehiculos?.modelo}</p>
            <p className="text-slate-500 font-bold uppercase text-xs mt-1">Patente: <span className="text-slate-300">{orden.vehiculos?.patente}</span></p>
        </section>

        {/* DESGLOSE ESTRATÉGICO */}
        <section className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                <Wrench size={16} /> Detalle de Inversión
            </h3>
            
            {/* MANO DE OBRA Y REVISIÓN (Con Precios Visibles) */}
            <div className="mb-6">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Servicios y Mano de Obra</h4>
                <div className="space-y-3">
                    {costoRevision > 0 && (
                        <div className="flex justify-between items-start border-b border-slate-800/50 pb-2">
                            <span className="text-xs uppercase leading-tight text-slate-300 w-[70%]">Diagnóstico / Revisión Inicial</span>
                            <span className="text-xs font-bold text-slate-300 shrink-0">${costoRevision.toLocaleString('es-CL')}</span>
                        </div>
                    )}
                    {servicios.map((s: any) => (
                        <div key={s.id} className="flex justify-between items-start border-b border-slate-800/50 pb-2 last:border-0">
                            <span className="text-xs uppercase leading-tight text-slate-300 w-[70%]">{s.descripcion}</span>
                            <span className="text-xs font-bold text-slate-300 shrink-0">${s.precio.toLocaleString('es-CL')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* REPUESTOS (Ocultamos precios unitarios para evitar cotizaciones externas) */}
            {repuestos.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">Repuestos e Insumos</h4>
                    <div className="space-y-2 mb-3">
                        {repuestos.map((r: any) => (
                            <div key={r.id} className="flex items-start gap-2 border-b border-slate-800/50 pb-2 last:border-0">
                                <Circle size={10} className="text-orange-500 shrink-0 mt-1" />
                                <span className="text-xs uppercase leading-tight text-slate-300">{r.descripcion}</span>
                            </div>
                        ))}
                    </div>
                    {/* Solo mostramos el subtotal de repuestos sumado */}
                    <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Subtotal Repuestos</span>
                        <span className="text-xs font-black text-orange-400">${subtotalRepuestos.toLocaleString('es-CL')}</span>
                    </div>
                </div>
            )}

            {/* TOTALES FINALES */}
            <div className="border-t-2 border-dashed border-slate-700 pt-6 mt-6">
                {descuento > 0 && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Descuento Especial</span>
                        <span className="text-sm font-black text-red-400">-${descuento.toLocaleString('es-CL')}</span>
                    </div>
                )}
                <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total a Pagar</span>
                    <span className="text-4xl font-black text-emerald-400 tracking-tighter">${totalNeto.toLocaleString('es-CL')}</span>
                </div>
            </div>
        </section>

        {/* ZONA DE ACCIÓN: APROBACIÓN O CONTACTO */}
        {!aprobado && (
            <div className="space-y-4 mb-12">
                <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-700 text-center">
                    <ShieldCheck className="text-emerald-500 mx-auto mb-3" size={28} />
                    <p className="text-[11px] text-slate-300 font-bold mb-5 leading-relaxed px-2">
                        Al presionar el siguiente botón, autorizas formalmente al taller a comenzar los trabajos detallados por el valor total de <strong className="text-emerald-400">${totalNeto.toLocaleString('es-CL')}</strong>.
                    </p>
                    
                    <button 
                        onClick={handleAprobarPresupuesto}
                        disabled={aprobando}
                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                    >
                        {aprobando ? 'Procesando...' : <>✅ APROBAR REPARACIÓN</>}
                    </button>
                </div>

                <a 
                    href={urlWhatsapp} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-4 bg-transparent border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                    <Phone size={16} /> Tengo una duda, contactar al taller
                </a>
            </div>
        )}

        <footer className="text-center pb-8 mt-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Documento generado de forma segura por</p>
            <div className="flex items-center justify-center gap-2 text-slate-300">
                <Wrench className="text-emerald-500" size={16} />
                <span className="font-black text-xl tracking-tighter">CALIBRE</span>
            </div>
        </footer>
      </div>
    </main>
  )
}