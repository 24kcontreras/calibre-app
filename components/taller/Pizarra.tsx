'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, User, ClipboardList, Share2, Camera, Edit2, Plus, CheckCircle2, Circle, MessageSquare, Trash2, Send, CheckCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [tarjetaExpandida, setTarjetaExpandida] = useState<string | null>(null);

  const calcularTiempoEnTaller = (fechaIngreso: string) => {
      const inicio = new Date(fechaIngreso).getTime();
      const ahora = new Date().getTime();
      const dif = ahora - inicio;
      const dias = Math.floor(dif / (1000 * 60 * 60 * 24));
      const horas = Math.floor((dif / (1000 * 60 * 60)) % 24);
      if (dias > 0) return `${dias}d ${horas}h`;
      return `${horas}h`;
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
      if (!window.confirm("¿Estás seguro de eliminar este ítem de la orden?")) return;
      try {
          await supabase.from('items_orden').delete().eq('id', idItem);
          toast.success("Ítem eliminado correctamente");
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

  return (
    <section className="relative h-full flex flex-col">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
        
        <div className="flex items-center gap-3 mb-5 relative z-10 shrink-0">
            <span className="h-3 w-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
            <h2 className="text-2xl font-black text-slate-100 tracking-tighter uppercase">Pizarra Activa</h2>
        </div>

        {ordenesAbiertas.length === 0 ? (
            <div className="flex-1 min-h-[500px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 relative z-10 bg-slate-900/20 backdrop-blur-sm">
                <Settings size={48} className="text-slate-700 mb-4 animate-[spin_10s_linear_infinite]" />
                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-1">Taller Despejado</h3>
                <p className="text-xs text-slate-500 font-bold">Registra un vehículo a la izquierda para comenzar el trabajo.</p>
            </div>
        ) : (
            <div className="flex flex-col md:flex-row md:overflow-x-auto gap-4 md:gap-5 relative z-10 pb-4 custom-scrollbar-dark md:snap-x h-full md:min-h-[650px]">
                {ordenesAbiertas.map(o => {
                    const subtotalItems = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;
                    const costoRev = o.costo_revision || 0;
                    const desc = o.descuento || 0;
                    const subtotalBruto = subtotalItems + costoRev;
                    const totalNeto = subtotalBruto - desc;
                    const porcentajeDesc = subtotalBruto > 0 ? Math.round((desc / subtotalBruto) * 100) : 0;

                    const isExpanded = tarjetaExpandida === o.id;

                    return (
                    <div key={o.id} className={`w-full md:min-w-[320px] md:max-w-[360px] bg-slate-900/60 backdrop-blur-md p-4 md:p-5 rounded-3xl shadow-2xl border-2 hover:border-orange-500/50 transition-all duration-300 relative overflow-hidden group flex flex-col md:snap-center shrink-0 ${isExpanded ? 'h-auto border-orange-500/30' : 'h-auto md:h-full border-slate-800'}`}>
                        
                        {/* 🟢 CABECERA DE LA TARJETA (Jerarquía Mejorada) */}
                        <div className="shrink-0 cursor-pointer md:cursor-default" onClick={() => { if (window.innerWidth < 768) setTarjetaExpandida(isExpanded ? null : o.id) }}>
                            <div className="flex justify-between items-start w-full gap-3">
                                
                                {/* Izquierda: Patente y Vehículo */}
                                <div className="flex flex-col overflow-hidden flex-1">
                                    <p className="font-black text-3xl md:text-3xl tracking-tighter text-slate-100 truncate leading-none mb-1">{o.vehiculos?.patente}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                                        {o.vehiculos?.marca} {o.vehiculos?.modelo} 
                                        {o.kilometraje ? ` • ${o.kilometraje.toLocaleString()} KM` : ''}
                                    </p>
                                </div>

                                {/* Derecha: Estado y Chevron (Solo Móvil) */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {!isExpanded && (
                                        <div className={`md:hidden text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border shadow-sm ${COLOR_ESTADO[o.sub_estado || 'Diagnóstico']}`}>
                                            {o.sub_estado || 'Diagnóstico'}
                                        </div>
                                    )}
                                    <div className={`md:hidden p-1.5 rounded-full transition-colors border ${isExpanded ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                            </div>
                            
                            {/* Píldoras de Tiempo y Mecánico */}
                            <div className={`${isExpanded ? 'flex flex-wrap' : 'hidden md:flex flex-wrap'} gap-2 mt-4`}>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 bg-slate-950/50 w-fit px-2 py-1.5 rounded-lg border border-slate-700/50 shadow-inner">
                                    <Clock size={12} className="text-orange-400" />
                                    <span>{calcularTiempoEnTaller(o.created_at)}</span>
                                </div>

                                <div onClick={(e) => { e.stopPropagation(); handleAsignarMecanico(o.id, o.mecanico); }} className={`flex items-center gap-1.5 w-fit bg-slate-800/80 backdrop-blur-sm text-slate-200 font-bold text-[9px] px-2.5 py-1.5 rounded-lg border border-slate-600/50 shadow-sm uppercase truncate max-w-[140px] ${soloLectura ? 'opacity-50' : 'cursor-pointer hover:bg-emerald-900/50 hover:text-emerald-400 hover:border-emerald-700 transition-all'}`} title="Clic para cambiar mecánico">
                                    <User size={12} className="shrink-0 text-blue-400" /> <span className="truncate">{o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico : 'Sin Mecánico'}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* 🔵 CUERPO DE LA TARJETA (Oculto en móvil colapsado) */}
                        <div className={`${isExpanded ? 'flex flex-col mt-4 animate-in fade-in slide-in-from-top-2 duration-300' : 'hidden md:flex md:flex-col md:mt-4'} flex-1 overflow-hidden`}>
                            
                            {/* Selector de Estado Expandido */}
                            <div className="mb-4">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 block ml-1">Fase del Vehículo</label>
                                <select 
                                    value={o.sub_estado || 'Diagnóstico'}
                                    disabled={soloLectura}
                                    onChange={(e) => cambiarSubEstado(o.id, e.target.value)}
                                    className={`w-full text-xs font-black px-3 py-2.5 rounded-xl border uppercase tracking-wider outline-none cursor-pointer text-center appearance-none shadow-sm ${COLOR_ESTADO[o.sub_estado || 'Diagnóstico']}`}
                                >
                                    <option className="bg-slate-900 text-slate-100" value="Diagnóstico">DIAGNÓSTICO</option>
                                    <option className="bg-slate-900 text-slate-100" value="Pendiente Aprobación">ESPERA APROBACIÓN</option>
                                    <option className="bg-slate-900 text-slate-100" value="Esperando Repuestos">ESPERA REPUESTOS</option>
                                    <option className="bg-slate-900 text-slate-100" value="En Reparación">EN REPARACIÓN</option>
                                    <option className="bg-slate-900 text-slate-100" value="Listo para Entrega">LISTO PARA ENTREGA</option>
                                </select>
                            </div>

                            {/* Botones de Acción Superiores */}
                            <div className="flex gap-2 shrink-0 mb-4 justify-between">
                                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/50 flex flex-1 justify-between items-center group shadow-inner">
                                    <div className="italic text-[10px] text-slate-400 line-clamp-1 w-full px-1" title={o.descripcion}>"{o.descripcion}"</div>
                                    <button 
                                        onClick={() => abrirModalEditar(o)} 
                                        disabled={soloLectura}
                                        className="ml-2 bg-slate-800 p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600 transition-colors disabled:opacity-50" 
                                        title="Editar Orden"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                                
                                <button onClick={() => abrirModalActa(o)} className="bg-cyan-950/30 p-2.5 rounded-xl hover:bg-cyan-900 text-cyan-400 hover:text-white transition-all border border-cyan-900/50 shadow-sm" title="Ver Acta">
                                    <ClipboardList size={16} />
                                </button>
                                <button onClick={() => compartirLinkCliente(o)} className="bg-blue-950/30 p-2.5 rounded-xl hover:bg-blue-900 text-blue-400 hover:text-white transition-all border border-blue-900/50 shadow-sm" title="Compartir Link">                                        
                                    <Share2 size={16} />
                                </button>
                                <button onClick={() => abrirModalEvidencia(o.id)} disabled={soloLectura} className="bg-emerald-950/30 disabled:opacity-50 p-2.5 rounded-xl hover:bg-emerald-900 text-emerald-400 hover:text-white transition-all border border-emerald-900/50 shadow-sm" title="Subir Evidencia">
                                    <Camera size={16} />
                                </button>
                            </div>
                            
                            {/* Botón Añadir Ítem */}
                            <button 
                                disabled={soloLectura} 
                                onClick={() => abrirModalItem(o.id)} 
                                className="w-full shrink-0 mb-3 py-3 border border-emerald-500/30 rounded-xl text-[10px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 uppercase tracking-widest transition-all bg-emerald-950/20 shadow-sm flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Añadir Tarea / Repuesto
                            </button>

                            {/* Lista de Ítems */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-1 space-y-2 mb-4 max-h-[250px] md:max-h-none">
                                {o.items_orden?.map((item: ItemOrden) => (
                                    <div key={item.id} className={`flex justify-between items-center text-[10px] font-bold backdrop-blur-sm p-2.5 rounded-xl border group/item transition-colors ${item.realizado ? 'bg-emerald-900/10 border-emerald-900/30 opacity-70' : 'bg-slate-950/80 border-slate-800'}`}>

                                        <div className="flex items-center gap-2.5 flex-1 pr-2 overflow-hidden">
                                            <button disabled={soloLectura} onClick={() => toggleItemRealizado(item.id, item.realizado)} className="shrink-0 hover:scale-110 transition-transform disabled:opacity-50">
                                                {item.realizado ? <CheckCircle2 className="text-emerald-500" size={16} /> : <Circle className="text-slate-600" size={16} />}
                                            </button>
                                            <div className="flex flex-col">
                                                <span className={`uppercase truncate ${item.realizado ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.descripcion}</span>
                                                
                                                {item.tipo_item === 'repuesto' && !item.realizado && (
                                                    <span className="text-[8px] text-orange-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">En Bodega</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!mecanicoActivo && (
                                                <span className={`mr-2 font-black ${item.realizado ? 'text-slate-500' : 'text-emerald-400'}`}>${item.precio.toLocaleString()}</span>
                                            )}
                                            <button disabled={soloLectura} onClick={() => abrirModalItem(o.id, item)} className="text-slate-600 disabled:opacity-50 hover:text-blue-400 transition-colors bg-slate-900 p-1.5 rounded-md border border-slate-800"><Edit2 size={12} /></button>
                                            <button disabled={soloLectura} onClick={() => eliminarItemBD(item.id)} className="text-slate-600 disabled:opacity-50 hover:text-red-400 transition-colors bg-slate-900 p-1.5 rounded-md border border-slate-800"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                                {o.items_orden?.length === 0 && <p className="text-[10px] text-center text-slate-600 italic font-bold py-4 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">No hay tareas registradas.</p>}
                                
                                {/* Notas del Turno */}
                                <div className="mt-4 pt-3">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 ml-1">
                                        <MessageSquare size={12} /> Bitácora de Turno
                                    </h4>
                                    <div className="bg-slate-950/60 rounded-2xl border border-slate-800/50 p-2.5 flex flex-col gap-2 shadow-inner">
                                        
                                         {o.comentarios_orden?.map((com: ComentarioOrden) => (
                                             <div key={com.id} className="bg-slate-900 rounded-xl p-2.5 text-[9px] border border-slate-800">
                                                <div className="flex justify-between items-center mb-1.5 border-b border-slate-800/50 pb-1.5">
                                                    <span className="font-black text-blue-400 tracking-wider uppercase">{com.autor_nombre}</span>
                                                    <span className="text-slate-500 font-bold">{new Date(com.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-slate-300 font-medium leading-relaxed">{com.texto}</p>
                                            </div>
                                        ))}
                                        
                                        <div className="flex gap-1.5 mt-1">
                                            <input 
                                                type="text" 
                                                value={comentarioInputs[o.id] || ''}
                                                disabled={soloLectura}
                                                onChange={e => setComentarioInputs({...comentarioInputs, [o.id]: e.target.value})}
                                                onKeyDown={e => { if (e.key === 'Enter') enviarComentario(o.id) }}
                                                placeholder="Añadir un recado..." 
                                                className="w-full bg-slate-900 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-200 outline-none border border-slate-700 focus:border-blue-500 transition-colors placeholder-slate-600"
                                            />
                                            <button onClick={() => enviarComentario(o.id)} disabled={soloLectura} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center">
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 🔥 BLOQUE DE COBROS Y FINALIZACIÓN (Solo visible para el dueño) */}
                            {!mecanicoActivo && (
                                <div className="shrink-0 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 mt-auto shadow-[0_-10px_20px_rgba(2,6,23,0.5)]">
                                    
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-black px-1">
                                        <span className="uppercase tracking-widest">Servicios/Repuestos:</span>
                                        <span className="text-slate-200">${subtotalItems.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-[10px] font-black px-1">
                                        <span className="text-slate-400 uppercase tracking-widest">Diagnóstico:</span>
                                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 focus-within:border-emerald-500 transition-colors">
                                            <span className="text-slate-500">$</span>
                                            <input 
                                                type="number" 
                                                defaultValue={o.costo_revision || ''} 
                                                disabled={soloLectura}
                                                onBlur={(e) => actualizarCobrosBD(o.id, 'costo_revision', e.target.value)}
                                                className="w-16 bg-transparent outline-none text-right text-slate-200" 
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] font-black px-1">
                                        <span className="text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            Descuento 
                                            {porcentajeDesc > 0 && <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-md font-black">-{porcentajeDesc}%</span>}
                                        </span>
                                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 focus-within:border-orange-500 transition-colors">
                                            <span className="text-orange-500 font-bold">-$</span>
                                            <input 
                                                type="number" 
                                                defaultValue={o.descuento || ''} 
                                                disabled={soloLectura}
                                                onBlur={(e) => actualizarCobrosBD(o.id, 'descuento', e.target.value)}
                                                className="w-16 bg-transparent outline-none text-right text-orange-400 font-black" 
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-800 w-full my-1"></div>

                                    <div className="flex justify-between items-end px-1">
                                        <button onClick={() => anularOrden(o.id)} disabled={soloLectura} className="text-[9px] disabled:opacity-50 font-black text-slate-600 uppercase tracking-widest hover:text-red-500 transition-colors">
                                            Anular Orden
                                        </button>
                                        <div className="text-right">
                                            <p className="text-[9px] text-emerald-500/70 uppercase font-black tracking-widest mb-1">Total a Cobrar</p>
                                            <p className="font-black text-emerald-400 text-3xl leading-none">${totalNeto.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <button disabled={soloLectura || totalNeto === 0} onClick={() => solicitarAprobacion(o)} className="bg-slate-800 border border-slate-700 disabled:opacity-50 text-slate-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                                            <MessageSquare size={14}/> Aprobar
                                        </button>
                                        <button disabled={soloLectura} onClick={() => entregarOrdenYFinalizar(o)} className="bg-emerald-600 disabled:opacity-50 text-slate-950 py-3 rounded-xl text-[10px] font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500 hover:scale-[1.02] transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                            Entregar <CheckCircle size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )})}
            </div>
        )}
    </section>
  )
}