'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, User, ClipboardList, Share2, Camera, Edit2, Plus, CheckCircle2, Circle, MessageSquare, Trash2, Send, CheckCircle, Settings, Box, X, MoreVertical, Hammer, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { generarDocumentoPDF } from '@/utils/pdfGenerator'
import { Session } from '@supabase/supabase-js'
import { OrdenTrabajo, ItemOrden, ComentarioOrden } from '@/hooks/types'

const COLOR_ESTADO: Record<string, string> = {
  'Diagnóstico': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Pendiente Aprobación': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  'Esperando Repuestos': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  'En Reparación': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Listo para Entrega': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
};

interface PizarraProps {
  ordenesAbiertas: OrdenTrabajo[];
  soloLectura: boolean;
  nombreTaller: string;
  session: Session | null;
  cargarTodo: () => Promise<void>;
  setGenerandoPDF: (val: boolean) => void;
  abrirModalActa: (orden: OrdenTrabajo) => void;
  abrirModalEvidencia: (ordenId: string) => void;
  abrirModalEditar: (orden: OrdenTrabajo) => void;
  abrirModalItem: (ordenId: string, item?: ItemOrden) => void;
  mecanicoActivo?: any; 
}

export default function Pizarra({ 
  ordenesAbiertas, soloLectura, nombreTaller, session, cargarTodo, 
  setGenerandoPDF, abrirModalActa, abrirModalEvidencia, abrirModalEditar, abrirModalItem, mecanicoActivo 
}: PizarraProps) {

  const [comentarioInputs, setComentarioInputs] = useState<Record<string, string>>({})
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setMenuAbierto(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const calcularTiempoEnTaller = (fechaIngreso: string) => {
      const inicio = new Date(fechaIngreso).getTime();
      const ahora = new Date().getTime();
      const dif = ahora - inicio;
      const dias = Math.floor(dif / (1000 * 60 * 60 * 24));
      const horas = Math.floor((dif / (1000 * 60 * 60)) % 24);
      if (dias > 0) return `${dias}d ${horas}h`;
      return `${horas}h`;
  }

  const obtenerEstadoPromesa = (fechaPromesa: string | null) => {
      if (!fechaPromesa) return null; 
      const promesa = new Date(fechaPromesa).getTime();
      const ahora = new Date().getTime();
      const difHoras = (promesa - ahora) / (1000 * 60 * 60);

      if (difHoras < 0) return 'atrasado';
      if (difHoras <= 2) return 'peligro';
      return 'ok';
  }

  const cambiarSubEstado = async (ordenId: string, nuevoEstado: string) => {
      if (soloLectura) return;
      const { error } = await supabase.from('ordenes_trabajo').update({ sub_estado: nuevoEstado }).eq('id', ordenId);
      if (!error) {
          toast.success(`Estado actualizado`);
          await cargarTodo();
      } else {
          toast.error("Error al actualizar el estado");
      }
  }

  const actualizarCobrosBD = async (ordenId: string, campo: 'costo_revision' | 'descuento', valor: string) => {
      if (soloLectura) return;
      const num = parseInt(valor) || 0;
      try {
          await supabase.from('ordenes_trabajo').update({ [campo]: num }).eq('id', ordenId);
          await cargarTodo();
          toast.success("Monto actualizado", { position: 'bottom-left' });
      } catch (error) { toast.error("Error al actualizar monto"); }
  }

  const handleAsignarMecanico = async (ordenId: string, actual: string) => {
    if (soloLectura) return;
    const nuevoMecanico = window.prompt("Ingrese el nombre del mecánico a cargo:", actual === 'Sin asignar' ? '' : actual);
    if (nuevoMecanico !== null) { 
        await supabase.from('ordenes_trabajo').update({ mecanico: nuevoMecanico.trim() || 'Sin asignar' }).eq('id', ordenId);
        await cargarTodo();
        toast.success("Mecánico asignado");
    }
  }

  const enviarComentario = async (ordenId: string) => {
      const texto = comentarioInputs[ordenId];
      if (!texto || !texto.trim() || soloLectura) return;
      const autor = mecanicoActivo ? mecanicoActivo.nombre : (session?.user?.user_metadata?.nombre_taller || 'Mecánico');
      try {
          await supabase.from('comentarios_orden').insert([{ 
              orden_id: ordenId, taller_id: mecanicoActivo?.taller_id || session?.user?.id, texto: texto.trim(), autor_nombre: autor 
          }]);
          setComentarioInputs(prev => ({...prev, [ordenId]: ''}));
          await cargarTodo();
      } catch (error) { toast.error("Error al enviar nota"); }
  }

  const anularOrden = async (idOrden: string) => {
      if (soloLectura) return;
      if (!window.confirm("¿Estás seguro de ANULAR y borrar esta orden? Esta acción no se puede deshacer y borrará los ítems asociados.")) return;
      try {
          await supabase.from('fotos_orden').delete().eq('orden_id', idOrden);
          await supabase.from('items_orden').delete().eq('orden_id', idOrden);
          const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', idOrden);
          if (error) throw error;
          toast.success("Orden anulada y eliminada");
          await cargarTodo();
      } catch (error: unknown) { 
          const msg = error instanceof Error ? error.message : "Error desconocido";
          toast.error("Error al anular la orden: " + msg); 
      }
  }

  const eliminarItemBD = async (idItem: string) => {
      if (soloLectura) return;
      if (!window.confirm("¿Estás seguro de eliminar este ítem? Si es un trabajo principal, también se borrarán y devolverán los repuestos asociados.")) return;
      
      try {
          const { data: itemsBorrados } = await supabase
              .from('items_orden')
              .select('*')
              .or(`id.eq.${idItem},parent_id.eq.${idItem}`);

          if (itemsBorrados && itemsBorrados.length > 0) {
              for (const item of itemsBorrados) {
                  if (item.tipo_item === 'repuesto' && item.procedencia === 'Bodega Interna' && item.inventario_id) {
                      const { data: inv } = await supabase.from('inventario').select('cantidad').eq('id', item.inventario_id).single();
                      if (inv) {
                          await supabase.from('inventario').update({ cantidad: inv.cantidad + item.cantidad }).eq('id', item.inventario_id);
                      }
                  }
              }
          }

          await supabase.from('items_orden').delete().eq('id', idItem);
          toast.success("Ítem eliminado (Stock devuelto si aplica)");
          await cargarTodo();
      } catch (error: unknown) { 
          const msg = error instanceof Error ? error.message : "Error desconocido";
          toast.error("Error al eliminar el ítem: " + msg); 
      }
  }

  const toggleItemRealizado = async (idItem: string, estadoActual: boolean) => {
      if (soloLectura) return;
      try {
          const { error } = await supabase.from('items_orden').update({ realizado: !estadoActual }).eq('id', idItem);
          if (error) throw error;
          await cargarTodo(); 
      } catch (error) { toast.error("Error al actualizar la tarea"); }
  }

  const solicitarAprobacion = (o: OrdenTrabajo) => {
      const subtotalItems = o.items_orden?.reduce((sum: number, item: ItemOrden) => sum + item.precio, 0) || 0;
      const totalFinal = subtotalItems + (o.costo_revision || 0) - (o.descuento || 0); 
      
      const telefono = o.vehiculos?.clientes?.telefono;
      const cliente = o.vehiculos?.clientes?.nombre || 'Estimado(a)';
      const vehiculo = `${o.vehiculos?.marca} ${o.vehiculos?.modelo}`;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://calibreapp.cl';
      const linkUrl = `${baseUrl}/presupuesto/${o.id}`;
      
      const msj = `Hola ${cliente}, te escribimos de ${nombreTaller}. 🔧\nEl presupuesto preliminar para tu ${vehiculo} (Patente: ${o.vehiculos?.patente}) es de *$${totalFinal.toLocaleString('es-CL')}*.\n\nPuedes revisar el detalle y seguir el estado de tu vehículo en tiempo real aquí:\n👉 ${linkUrl}\n\n¿Nos confirmas por aquí para proceder con el trabajo? Quedamos atentos.`;
      
      if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
          window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
          if (!soloLectura) cambiarSubEstado(o.id, 'Pendiente Aprobación'); 
      } else { toast.error("El cliente no tiene un teléfono válido registrado."); }
  }

  const compartirLinkCliente = async (o: OrdenTrabajo) => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://calibreapp.cl';
      const linkUrl = `${baseUrl}/estado/${o.id}`;
      const patente = o.vehiculos?.patente || 'tu vehículo';
      const mensaje = `¡Hola! Puedes revisar el detalle y seguir el estado de ${patente} en tiempo real aquí:\n👉 ${linkUrl}`;

      if (navigator.share) {
          try { await navigator.share({ title: `Estado de Reparación - ${nombreTaller}`, text: mensaje });
              toast.success("¡Enlace compartido!", { icon: '🚀' });
          } catch (error) { console.log('Menú de compartir cerrado'); }
      } else {
          navigator.clipboard.writeText(mensaje);
          toast.success("¡Link copiado al portapapeles!", { icon: '🔗' });
      }
  }

  const entregarOrdenYFinalizar = async (o: OrdenTrabajo) => {
      if (soloLectura) return;
      setGenerandoPDF(true); 
      try {
          let resumenGenerado = "";
          if (o.items_orden && o.items_orden.length > 0) {
              try {
                  const res = await fetch('/api/resumen', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ vehiculo: o.vehiculos, items: o.items_orden, falla: o.descripcion })
                  });
                  if (!res.ok) throw new Error("Error HTTP de IA");
                  const data = await res.json();
                  if (data && data.resumen) resumenGenerado = data.resumen;
              } catch (error: unknown) { 
                  const msg = error instanceof Error ? error.message : "Error desconocido";
                  toast.error(`La IA no respondió: ${msg}, cerraremos con informe básico.`); 
              }
          }

          await supabase.from('ordenes_trabajo').update({ estado: 'Finalizada', resumen_ia: resumenGenerado }).eq('id', o.id);

          const ordenParaPDF = {
              ...o,
              vehiculos: { ...o.vehiculos, alertas_desgaste: o.vehiculos?.alertas_desgaste?.filter((a: any) => a.estado !== 'Resuelta') || [] }
          };

          const configPDF = {
              nombreTaller,
              direccion: session?.user?.user_metadata?.direccion_taller || '',
              telefono: session?.user?.user_metadata?.telefono_taller || '',
              garantia: session?.user?.user_metadata?.garantia_taller || '',
              logoUrl: session?.user?.user_metadata?.logo_url || null,
              incluirIva: session?.user?.user_metadata?.incluir_iva || false
          };

          await generarDocumentoPDF(ordenParaPDF, resumenGenerado, configPDF);
          
          const telefono = o.vehiculos?.clientes?.telefono;
          const cliente = o.vehiculos?.clientes?.nombre || 'Estimado(a)';
          const patente = o.vehiculos?.patente;

          if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
              const msj = `Hola *${cliente}*, te escribimos de *${nombreTaller}*. 🔧\n\nTe informamos que tu vehículo patente *${patente}* ya se encuentra listo para entrega.\n\nEn un momento te adjuntaremos por este medio el *Informe Técnico Oficial* con los detalles de los trabajos y repuestos aplicados.\n\n¡Gracias por tu confianza!`;
              window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
              toast.success("¡Orden lista! Abriendo WhatsApp...");
          } else { toast.success("Orden finalizada. (El cliente no tiene celular para WhatsApp)"); }
          await cargarTodo();
      } catch (error) { toast.error("Error al procesar el cierre de la orden.");
      } finally { setGenerandoPDF(false); }
  }

  const avisarRetrasoCliente = (o: OrdenTrabajo) => {
      const telefono = o.vehiculos?.clientes?.telefono;
      if (!telefono) return toast.error("El cliente no tiene número de teléfono registrado.");
      
      const cliente = o.vehiculos?.clientes?.nombre || 'Estimado(a)';
      const auto = `${o.vehiculos?.marca} ${o.vehiculos?.modelo}`;
      
      const msj = `Hola ${cliente}, te escribimos de ${nombreTaller}. \nTuvimos un pequeño imprevisto técnico con tu ${auto} y nos demoraremos un poco más de lo acordado en la entrega. Te mantendremos informado en breve sobre el nuevo horario. Disculpa las molestias.`;
      
      window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
  }

  return (
    <section className="relative flex-1 flex flex-col overflow-hidden">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
        
        <div className="flex items-center gap-3 mb-5 relative z-10 shrink-0">
            <span className="h-3 w-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
            <h2 className="text-2xl font-black text-slate-100 tracking-tighter uppercase">Pizarra Activa</h2>
        </div>

        {ordenesAbiertas.length === 0 ? (
            <div className="flex-1 min-h-[500px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 relative z-10 bg-slate-900/20 backdrop-blur-sm">
                <Settings size={48} className="text-slate-700 mb-4 animate-[spin_10s_linear_infinite]" />
                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-1">Taller Despejado</h3>
                <p className="text-xs text-slate-500 font-bold">Registra un vehículo a la izquierda para comenzar el trabajo.</p>
            </div>
        ) : (
            <div className="flex flex-col md:flex-row md:overflow-x-auto gap-4 relative z-10 pb-4 custom-scrollbar-dark md:snap-x p-1 items-start h-full">
                {ordenesAbiertas.map((o) => {
                    const subtotalItems = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;
                    const costoRev = o.costo_revision || 0;
                    const desc = o.descuento || 0;
                    const subtotalBruto = subtotalItems + costoRev;
                    const totalNeto = subtotalBruto - desc;

                    const colorGlow = o.vehiculos?.color || '#334155';
                    const estadoPromesa = obtenerEstadoPromesa(o.fecha_promesa);
                    const isMenuOpen = menuAbierto === o.id;

                    return (
                    <div 
                        key={o.id} 
                        // 🔥 1. Z-INDEX DINÁMICO: Si el menú está abierto, esta tarjeta se viene hacia adelante (z-50)
                        // 🔥 2. ALTURA ELÁSTICA (h-calc): Toma casi toda la pantalla hacia abajo, con un mínimo seguro.
                        className={`w-full md:min-w-[340px] md:max-w-[340px] h-[calc(100vh-160px)] min-h-[550px] bg-slate-900/90 rounded-2xl border-x border-b border-slate-800 flex flex-col md:snap-center shrink-0 transition-all duration-200 shadow-xl relative ${isMenuOpen ? 'z-50' : 'z-10'}`}
                        style={{ borderTop: `4px solid ${colorGlow}` }}
                    >
                        {/* 🟢 CABECERA (Fija arriba) */}
                        <div className="p-4 pb-2 shrink-0">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex flex-col overflow-hidden flex-1">
                                    {/* 🔥 3. NUEVO SÁNDWICH VISUAL: Patente y píldoras en la misma línea */}
                                    <div className="flex items-center gap-2 mb-1 w-full">
                                        <p className="font-black text-3xl tracking-tighter text-slate-100 leading-none truncate shrink-0">{o.vehiculos?.patente}</p>
                                        
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="text-slate-400 font-bold text-[9px] bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800/50 shrink-0">
                                                {calcularTiempoEnTaller(o.created_at)}
                                            </span>
                                            {o.fecha_promesa && (
                                                <div className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 transition-all ${
                                                    estadoPromesa === 'atrasado' ? 'bg-red-500/20 text-red-400 border-red-500/50 cursor-pointer animate-pulse' :
                                                    estadoPromesa === 'peligro' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                                                    'bg-slate-950/50 text-emerald-400 border-slate-800/50'
                                                }`}
                                                onClick={(e) => { if(estadoPromesa === 'atrasado') { e.stopPropagation(); avisarRetrasoCliente(o); } }}
                                                title={estadoPromesa === 'atrasado' ? 'Clic para avisar retraso' : ''}
                                                >
                                                    <Clock size={10} />
                                                    <span>
                                                        {estadoPromesa === 'atrasado' ? 'RETRASO' : new Date(o.fecha_promesa).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 'h'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                                        {o.vehiculos?.marca} {o.vehiculos?.modelo}
                                    </p>
                                </div>
                                
                                {/* MENÚ DE TRES PUNTOS */}
                                <div className="relative shrink-0">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setMenuAbierto(isMenuOpen ? null : o.id); }}
                                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                    
                                    {isMenuOpen && (
                                        <div className="absolute right-0 top-full mt-1 z-[60] bg-slate-800 border border-slate-700 shadow-2xl rounded-xl p-1.5 w-44 animate-in fade-in zoom-in-95 duration-100">
                                            <button disabled={soloLectura} onClick={() => { setMenuAbierto(null); abrirModalEditar(o); }} className="w-full flex items-center gap-2 p-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"><Edit2 size={14}/> Editar Orden</button>
                                            <button onClick={() => { setMenuAbierto(null); abrirModalActa(o); }} className="w-full flex items-center gap-2 p-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><FileText size={14}/> Ver Informe</button>
                                            <button disabled={soloLectura} onClick={() => { setMenuAbierto(null); abrirModalEvidencia(o.id); }} className="w-full flex items-center gap-2 p-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"><Camera size={14}/> Subir Fotos</button>
                                            <button onClick={() => { setMenuAbierto(null); compartirLinkCliente(o); }} className="w-full flex items-center gap-2 p-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><Share2 size={14}/> Compartir Link</button>
                                            <div className="h-px bg-slate-700 my-1 mx-2"></div>
                                            <button disabled={soloLectura} onClick={() => { setMenuAbierto(null); anularOrden(o.id); }} className="w-full flex items-center gap-2 p-2 text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={14}/> Anular Orden</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ASIGNACIÓN DE MECÁNICO E INFO INGRESO */}
                            <div className="mt-2.5 flex flex-col gap-2">
                                <div onClick={(e) => { e.stopPropagation(); handleAsignarMecanico(o.id, o.mecanico); }} className={`flex items-center gap-1.5 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800/50 w-full truncate ${soloLectura ? 'opacity-50' : 'cursor-pointer hover:bg-emerald-900/30 hover:border-emerald-700/50 transition-colors'}`}>
                                    <Hammer size={12} className="text-blue-500 shrink-0" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase truncate">
                                        {o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico : 'Sin Asignar'}
                                    </span>
                                </div>

                                {o.descripcion && (
                                <div className="px-1">
                                    <div className="text-[10px] text-slate-400 italic line-clamp-2 px-2 py-1 border-l-2 border-slate-700">"{o.descripcion}"</div>
                                </div>
                                )}
                            </div>
                        </div>

                        {/* 🟡 ZONA CENTRAL DE SCROLL (Tareas y Bitácora unificadas) */}
                        {/* 🔥 4. min-h-0 es crucial para que el flex interno respete el scroll unificado sin romper el layout */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-dark px-4 pb-2 space-y-4">
                            
                            <div className="space-y-2.5">
                                <select 
                                    value={o.sub_estado || 'Diagnóstico'}
                                    disabled={soloLectura}
                                    onChange={(e) => cambiarSubEstado(o.id, e.target.value)}
                                    className={`w-full text-[10px] font-black py-2 rounded-lg border uppercase tracking-widest text-center appearance-none shadow-sm outline-none transition-all cursor-pointer ${COLOR_ESTADO[o.sub_estado || 'Diagnóstico']}`}
                                >
                                    <option className="bg-slate-900 text-slate-100" value="Diagnóstico">DIAGNÓSTICO</option>
                                    <option className="bg-slate-900 text-slate-100" value="Pendiente Aprobación">ESPERA APROBACIÓN</option>
                                    <option className="bg-slate-900 text-slate-100" value="Esperando Repuestos">ESPERA REPUESTOS</option>
                                    <option className="bg-slate-900 text-slate-100" value="En Reparación">EN REPARACIÓN</option>
                                    <option className="bg-slate-900 text-slate-100" value="Listo para Entrega">LISTO PARA ENTREGA</option>
                                </select>

                                <button 
                                    disabled={soloLectura} 
                                    onClick={() => abrirModalItem(o.id)} 
                                    className="w-full py-2 border border-emerald-500/30 rounded-lg text-[10px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 uppercase tracking-widest transition-all bg-emerald-950/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Añadir Tarea
                                </button>
                            </div>

                            {/* LISTA DE ÍTEMS */}
                            <div className="space-y-2.5">
                                {o.items_orden?.length === 0 ? (
                                    <p className="text-[10px] text-center text-slate-600 italic font-bold py-3 bg-slate-950/30 rounded-lg border border-dashed border-slate-800 px-1">No hay tareas registradas.</p>
                                ) : (
                                    o.items_orden?.filter((item: any) => !item.parent_id).map((padre: any) => {
                                        const hijos = o.items_orden?.filter((item: any) => item.parent_id === padre.id) || [];
                                        return (
                                            <div key={padre.id} className="flex flex-col gap-1">
                                                {/* SERVICIO PADRE */}
                                                <div className={`flex justify-between items-center text-[10px] font-bold p-2 rounded-lg border transition-colors ${padre.realizado ? 'bg-emerald-900/10 border-emerald-900/30 opacity-60' : 'bg-slate-950 border-slate-800'}`}>
                                                    <div className="flex items-center gap-2 flex-1 pr-2 overflow-hidden">
                                                        <button disabled={soloLectura} onClick={() => toggleItemRealizado(padre.id, padre.realizado)} className="shrink-0 hover:scale-110 transition-transform disabled:opacity-50">
                                                            {padre.realizado ? <CheckCircle2 className="text-emerald-500" size={14} /> : <Circle className="text-slate-600" size={14} />}
                                                        </button>
                                                        <span className={`uppercase truncate font-black ${padre.realizado ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{padre.descripcion}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {!mecanicoActivo && <span className={`font-black ${padre.realizado ? 'text-slate-500' : 'text-emerald-400'}`}>${padre.precio.toLocaleString()}</span>}
                                                        <button disabled={soloLectura} onClick={() => eliminarItemBD(padre.id)} className="text-slate-600 disabled:opacity-50 hover:text-red-400 transition-colors bg-slate-900 p-1 rounded"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>

                                                {/* REPUESTOS HIJOS */}
                                                {hijos.length > 0 && (
                                                    <div className="flex flex-col gap-1 border-l border-slate-800/50 ml-3 pl-2">
                                                        {hijos.map((hijo: any) => (
                                                            <div key={hijo.id} className={`flex justify-between items-center text-[9px] font-bold py-1.5 px-2 rounded-md transition-colors ${hijo.realizado ? 'opacity-60' : 'bg-slate-900/40'}`}>
                                                                <div className="flex items-center gap-1.5 flex-1 pr-2 overflow-hidden">
                                                                    <span className="text-slate-700 shrink-0">↳</span>
                                                                    <span className={`uppercase truncate ${hijo.realizado ? 'text-slate-500 line-through' : 'text-slate-400'}`}>{hijo.descripcion}</span>
                                                                    <span className="text-slate-600 font-black">x{hijo.cantidad || 1}</span>
                                                                    <span title={hijo.procedencia} className={`shrink-0 ${hijo.procedencia === 'Cliente' ? 'text-blue-500' : 'text-emerald-600'}`}>
                                                                        {hijo.procedencia === 'Cliente' ? <User size={10}/> : <Box size={10}/>}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    {!mecanicoActivo && <span className={`font-black ${hijo.realizado ? 'text-slate-600' : (hijo.procedencia === 'Cliente' ? 'text-blue-500/70' : 'text-emerald-500/70')}`}>{hijo.precio === 0 ? '$0' : `$${hijo.precio.toLocaleString()}`}</span>}
                                                                    <button disabled={soloLectura} onClick={() => eliminarItemBD(hijo.id)} className="text-slate-700 disabled:opacity-50 hover:text-red-500 transition-colors"><X size={10} /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* BITÁCORA */}
                            <div className="pt-2"> 
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 ml-1">
                                    <MessageSquare size={10} /> Bitácora
                                </h4>
                                {/* Quité el límite de altura individual. Todo hace scroll de forma unificada en el padre central */}
                                <div className="bg-slate-950/40 rounded-xl border border-slate-800/50 p-2 flex flex-col gap-1.5 relative">
                                     {(!o.comentarios_orden || o.comentarios_orden.length === 0) && (
                                         <p className="text-[9px] text-slate-600 text-center font-bold italic py-2">Sin novedades registradas.</p>
                                     )}
                                     {o.comentarios_orden?.map((com: ComentarioOrden) => (
                                         <div key={com.id} className="text-[9px] border-b border-slate-800/50 pb-1.5 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-center mb-0.5 px-0.5">
                                                <span className="font-black text-blue-400 uppercase tracking-wide">{com.autor_nombre}</span>
                                                <span className="text-slate-600 font-bold">{new Date(com.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-slate-300 font-medium italic leading-relaxed px-0.5">"{com.texto}"</p>
                                        </div>
                                    ))}
                                    
                                    <div className="flex gap-1.5 mt-1 sticky bottom-0 bg-slate-950/90 py-1 rounded-lg">
                                        <input 
                                            type="text" 
                                            value={comentarioInputs[o.id] || ''}
                                            disabled={soloLectura}
                                            onChange={e => setComentarioInputs({...comentarioInputs, [o.id]: e.target.value})}
                                            onKeyDown={e => { if (e.key === 'Enter') enviarComentario(o.id) }}
                                            placeholder="Añadir recado..." 
                                            className="flex-1 bg-slate-900 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-200 outline-none border border-slate-700 focus:border-blue-500 transition-colors placeholder-slate-600"
                                        />
                                        <button onClick={() => enviarComentario(o.id)} disabled={soloLectura} className="bg-blue-600 text-white px-2.5 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center">
                                            <Send size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 🔴 RESUMEN DE COBROS (Fijo al fondo) */}
                        {!mecanicoActivo && (
                            <div className="p-4 bg-slate-900/95 border-t-2 border-slate-800 shrink-0 mt-auto z-20">
                                
                                <div className="flex justify-between items-center mb-2.5 px-1.5">
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Subtotal Tareas</span>
                                    <span className="text-[10px] text-slate-300 font-bold">${subtotalItems.toLocaleString()}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-4">
                                    <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 focus-within:border-slate-600 transition-colors">
                                        <span className="text-[8px] text-slate-500 font-black uppercase">Diag:</span>
                                        <div className="flex items-center gap-0.5">
                                            <span className="text-slate-600 text-[9px]">$</span>
                                            <input type="number" defaultValue={o.costo_revision || ''} disabled={soloLectura} onBlur={(e) => actualizarCobrosBD(o.id, 'costo_revision', e.target.value)} className="w-10 bg-transparent text-slate-300 text-[10px] text-right outline-none font-bold" placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 focus-within:border-orange-500 transition-colors">
                                        <span className="text-[8px] text-orange-500/70 font-black uppercase">Desc:</span>
                                        <div className="flex items-center gap-0.5">
                                            <span className="text-orange-600 text-[9px]">-$</span>
                                            <input type="number" defaultValue={o.descuento || ''} disabled={soloLectura} onBlur={(e) => actualizarCobrosBD(o.id, 'descuento', e.target.value)} className="w-10 bg-transparent text-orange-400 text-[10px] text-right outline-none font-black" placeholder="0" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end gap-3 px-0.5">
                                    <div className="flex gap-2">
                                        <button disabled={soloLectura || totalNeto === 0} onClick={() => solicitarAprobacion(o)} className="bg-slate-800 border border-slate-700 disabled:opacity-50 text-slate-300 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all shadow-sm" title="Solicitar Aprobación (Wsp)">
                                            <MessageSquare size={14}/>
                                        </button>
                                        <button disabled={soloLectura} onClick={() => entregarOrdenYFinalizar(o)} className="bg-emerald-600 disabled:opacity-50 text-slate-950 px-3 h-9 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                            Entregar <CheckCircle size={14} />
                                        </button>
                                    </div>
                                    <div className="text-right overflow-hidden">
                                        <p className="text-[8px] text-emerald-500/70 uppercase font-black tracking-widest leading-none mb-1">Total</p>
                                        <p className="font-black text-emerald-400 text-3xl leading-none truncate">${totalNeto.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </div>
                    );
                })}
            </div>
        )}
    </section>
  );
}