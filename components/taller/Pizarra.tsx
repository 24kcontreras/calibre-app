'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, User, ClipboardList, Share2, Camera, Edit2, Plus, CheckCircle2, Circle, MessageSquare, Trash2, Send, CheckCircle, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { generarDocumentoPDF } from '@/utils/pdfGenerator'

const COLOR_ESTADO: Record<string, string> = {
  'Diagnóstico': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'Pendiente Aprobación': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'Esperando Repuestos': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  'En Reparación': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'Listo para Entrega': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
};

interface PizarraProps {
  ordenesAbiertas: any[];
  soloLectura: boolean;
  nombreTaller: string;
  session: any;
  cargarTodo: () => Promise<void>;
  setGenerandoPDF: (val: boolean) => void;
  abrirModalActa: (orden: any) => void;
  abrirModalEvidencia: (ordenId: string) => void;
  abrirModalEditar: (orden: any) => void;
  abrirModalItem: (ordenId: string, item?: any) => void;
}

export default function Pizarra({ 
  ordenesAbiertas, soloLectura, nombreTaller, session, cargarTodo, 
  setGenerandoPDF, abrirModalActa, abrirModalEvidencia, abrirModalEditar, abrirModalItem 
}: PizarraProps) {

  const [comentarioInputs, setComentarioInputs] = useState<Record<string, string>>({})

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
      const autor = session?.user?.user_metadata?.nombre_taller || 'Mecánico';
      try {
          await supabase.from('comentarios_orden').insert([{ 
              orden_id: ordenId, taller_id: session?.user?.id, texto: texto.trim(), autor_nombre: autor 
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
      } catch (error: any) { toast.error("Error al anular la orden"); }
  }

  const eliminarItemBD = async (idItem: string) => {
      if (soloLectura) return;
      if (!window.confirm("¿Estás seguro de eliminar este ítem de la orden?")) return;
      try {
          await supabase.from('items_orden').delete().eq('id', idItem);
          toast.success("Ítem eliminado correctamente");
          await cargarTodo();
      } catch (error: any) { toast.error("Error al eliminar el ítem"); }
  }

  const toggleItemRealizado = async (idItem: string, estadoActual: boolean) => {
      if (soloLectura) return;
      try {
          const { error } = await supabase.from('items_orden').update({ realizado: !estadoActual }).eq('id', idItem);
          if (error) throw error;
          await cargarTodo(); 
      } catch (error) { toast.error("Error al actualizar la tarea"); }
  }

  const solicitarAprobacion = (o: any) => {
      const subtotalItems = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;
      const totalFinal = subtotalItems + (o.costo_revision || 0) - (o.descuento || 0); 
      
      const telefono = o.vehiculos?.clientes?.telefono;
      const cliente = o.vehiculos?.clientes?.nombre || 'Estimado(a)';
      const vehiculo = `${o.vehiculos?.marca} ${o.vehiculos?.modelo}`;
      const linkUrl = `${window.location.origin}/estado/${o.id}`;
      
      const msj = `Hola ${cliente}, te escribimos de ${nombreTaller}. 🔧\nEl presupuesto preliminar para tu ${vehiculo} (Patente: ${o.vehiculos?.patente}) es de *$${totalFinal.toLocaleString('es-CL')}*.\n\nPuedes revisar el detalle y seguir el estado de tu vehículo en tiempo real aquí:\n👉 ${linkUrl}\n\n¿Nos confirmas por aquí para proceder con el trabajo? Quedamos atentos.`;
      
      if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
          window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
          if (!soloLectura) cambiarSubEstado(o.id, 'Pendiente Aprobación'); 
      } else { toast.error("El cliente no tiene un teléfono válido registrado."); }
  }

  const compartirLinkCliente = async (o: any) => {
      const linkUrl = `${window.location.origin}/estado/${o.id}`;
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

  const entregarOrdenYFinalizar = async (o: any) => {
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
              } catch (error: any) { toast.error(`La IA no respondió, cerraremos con informe básico.`); }
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
            <div className="flex flex-row overflow-x-auto gap-5 relative z-10 pb-4 custom-scrollbar-dark snap-x h-full min-h-[650px]">
                {ordenesAbiertas.map(o => {
                    const subtotalItems = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;
                    const costoRev = o.costo_revision || 0;
                    const desc = o.descuento || 0;
                    const subtotalBruto = subtotalItems + costoRev;
                    const totalNeto = subtotalBruto - desc;
                    const porcentajeDesc = subtotalBruto > 0 ? Math.round((desc / subtotalBruto) * 100) : 0;

                    return (
                    <div key={o.id} className="min-w-[320px] max-w-[360px] w-full bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border-2 border-slate-800 hover:border-orange-500/50 transition-all relative overflow-hidden group flex flex-col snap-center flex-shrink-0 h-full">
                        
                        <div className="shrink-0 mb-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="overflow-hidden pr-2">
                                    <div className="flex flex-col gap-2 mb-1">
                                        <p className="font-black text-3xl tracking-tighter text-slate-100 w-full md:w-auto truncate">{o.vehiculos?.patente}</p>
                                        <select 
                                            value={o.sub_estado || 'Diagnóstico'}
                                            disabled={soloLectura}
                                            onChange={(e) => cambiarSubEstado(o.id, e.target.value)}
                                            className={`text-[8px] font-black px-1.5 py-1 rounded-md border uppercase tracking-wider outline-none cursor-pointer text-center shrink-0 w-fit ${COLOR_ESTADO[o.sub_estado || 'Diagnóstico']}`}
                                        >
                                            <option className="bg-slate-900 text-slate-100 font-bold" value="Diagnóstico">DIAGNÓSTICO</option>
                                            <option className="bg-slate-900 text-slate-100 font-bold" value="Pendiente Aprobación">ESPERA APROBAR</option>
                                            <option className="bg-slate-900 text-slate-100 font-bold" value="Esperando Repuestos">ESPERA REPUESTOS</option>
                                            <option className="bg-slate-900 text-slate-100 font-bold" value="En Reparación">REPARANDO</option>
                                            <option className="bg-slate-900 text-slate-100 font-bold" value="Listo para Entrega">LISTO PARA ENTREGA</option>
                                        </select>
                                    </div>

                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                                        {o.vehiculos?.marca} {o.vehiculos?.modelo} 
                                        {o.kilometraje ? ` • ${o.kilometraje.toLocaleString()} KM` : ''}
                                    </p>
                                    
                                    <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-slate-400 bg-slate-950/50 w-fit px-2 py-1 rounded border border-slate-800">
                                        <Clock size={10} className="text-orange-400" />
                                        <span>{calcularTiempoEnTaller(o.created_at)} en taller</span>
                                    </div>

                                    <div onClick={() => handleAsignarMecanico(o.id, o.mecanico)} className={`flex items-center gap-1 w-fit mt-2 bg-slate-800/50 backdrop-blur-sm text-slate-300 font-bold text-[9px] px-2 py-1.5 rounded-lg border border-slate-700/50 shadow-sm uppercase truncate max-w-full ${soloLectura ? 'opacity-50' : 'cursor-pointer hover:bg-emerald-900/50 hover:text-emerald-400 hover:border-emerald-700 transition-all'}`} title="Clic para cambiar mecánico">
                                        <User size={10} className="shrink-0" /> <span className="truncate">{o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico : 'Mecánico'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2 shrink-0">
                                    <button onClick={() => abrirModalActa(o)} className="bg-slate-800/50 backdrop-blur-sm p-2.5 rounded-xl hover:bg-cyan-900/50 text-cyan-400 transition-all border border-slate-700/50 shadow-sm" title="Ver Acta de Recepción">
                                        <ClipboardList size={16} />
                                    </button>

                                    <button onClick={() => compartirLinkCliente(o)} className="bg-slate-800/50 backdrop-blur-sm p-2.5 rounded-xl hover:bg-blue-900/50 text-blue-400 transition-all border border-slate-700/50 shadow-sm" title="Compartir Link del Vehículo">                                        
                                        <Share2 size={16} />
                                    </button>
                                    
                                    <button onClick={() => abrirModalEvidencia(o.id)} disabled={soloLectura} className="bg-slate-800/50 disabled:opacity-50 backdrop-blur-sm p-2.5 rounded-xl hover:bg-emerald-900/50 text-emerald-400 transition-all border border-slate-700/50 shadow-sm" title="Subir Evidencia">
                                        <Camera size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-slate-800/30 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex justify-between items-center group">
                                <div className="italic text-[10px] text-slate-400 line-clamp-1 w-full" title={o.descripcion}>"{o.descripcion}"</div>
                                <button 
                                    onClick={() => abrirModalEditar(o)} 
                                    disabled={soloLectura}
                                    className="ml-2 text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50" 
                                    title="Editar Orden"
                                >
                                    <Edit2 size={12} />
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            disabled={soloLectura} 
                            onClick={() => abrirModalItem(o.id)} 
                            className="w-full shrink-0 mb-3 py-2.5 border border-emerald-700/50 rounded-xl text-[10px] font-black text-emerald-400 hover:bg-emerald-600 hover:text-slate-950 uppercase transition-all bg-emerald-900/20 shadow-[0_4px_15px_rgba(2,6,23,0.8)] backdrop-blur-md flex items-center justify-center gap-1"
                        >
                            <Plus size={14} /> Añadir Servicio o Repuesto
                        </button>

                        <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-1 space-y-2 mb-4">
                            {o.items_orden?.map((item: any) => (
                                <div key={item.id} className={`flex justify-between items-center text-[10px] font-bold backdrop-blur-sm p-2.5 rounded-xl border group/item transition-colors ${item.realizado ? 'bg-emerald-900/10 border-emerald-900/30 opacity-70' : 'bg-slate-950/50 border-slate-800/50'}`}>
                                    <div className="flex items-center gap-2 flex-1 pr-2 overflow-hidden">
                                        <button disabled={soloLectura} onClick={() => toggleItemRealizado(item.id, item.realizado)} className="shrink-0 hover:scale-110 transition-transform disabled:opacity-50">
                                            {item.realizado ? <CheckCircle2 className="text-emerald-500" size={14} /> : <Circle className="text-slate-600" size={14} />}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className={`uppercase truncate ${item.realizado ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.descripcion}</span>
                                            
                                            {item.tipo_item === 'repuesto' && !item.realizado && (
                                                <span className="text-[8px] text-orange-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">Bodega / Comprar</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`mr-1 ${item.realizado ? 'text-slate-500' : 'text-emerald-400'}`}>${item.precio.toLocaleString()}</span>
                                        <button disabled={soloLectura} onClick={() => abrirModalItem(o.id, item)} className="text-slate-600 disabled:opacity-50 hover:text-emerald-400 transition-colors p-1" title="Editar"><Edit2 size={12} /></button>
                                        <button disabled={soloLectura} onClick={() => eliminarItemBD(item.id)} className="text-slate-600 disabled:opacity-50 hover:text-red-400 transition-colors p-1" title="Eliminar"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {o.items_orden?.length === 0 && <p className="text-[10px] text-center text-slate-600 italic py-2">Sin ítems registrados.</p>}
                            
                            <div className="mt-4 border-t border-slate-800/50 pt-3">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <MessageSquare size={10} /> Notas de Turno
                                </h4>
                                <div className="bg-slate-950/40 rounded-xl border border-slate-800/50 p-2 flex flex-col gap-2">
                                    
                                    {o.comentarios_orden?.map((com: any) => (
                                        <div key={com.id} className="bg-slate-900 rounded-lg p-2 text-[9px]">
                                            <div className="flex justify-between items-center mb-1 border-b border-slate-800 pb-1">
                                                <span className="font-bold text-blue-400">{com.autor_nombre}</span>
                                                <span className="text-slate-600">{new Date(com.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-slate-300 font-sans">{com.texto}</p>
                                        </div>
                                    ))}
                                    
                                    <div className="flex gap-1 mt-1">
                                        <input 
                                            type="text" 
                                            value={comentarioInputs[o.id] || ''}
                                            disabled={soloLectura}
                                            onChange={e => setComentarioInputs({...comentarioInputs, [o.id]: e.target.value})}
                                            onKeyDown={e => { if (e.key === 'Enter') enviarComentario(o.id) }}
                                            placeholder="Añadir recado..." 
                                            className="w-full bg-slate-800/50 rounded-lg p-2 text-[9px] text-slate-200 outline-none border border-slate-700/50 focus:border-blue-500 transition-colors"
                                        />
                                        <button onClick={() => enviarComentario(o.id)} disabled={soloLectura} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50">
                                            <Send size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="shrink-0 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1">
                                <span>Subtotal Tareas/Repuestos:</span>
                                <span>${subtotalItems.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] font-bold px-1">
                                <span className="text-slate-300">Costo Revisión/Diagnóstico:</span>
                                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 focus-within:border-emerald-500 transition-colors">
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

                            <div className="flex justify-between items-center text-[10px] font-bold px-1">
                                <span className="text-slate-300 flex items-center gap-1">
                                    Descuento Aplicado 
                                    {porcentajeDesc > 0 && <span className="bg-orange-500/20 text-orange-400 px-1 rounded font-black">-{porcentajeDesc}%</span>}
                                </span>
                                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 focus-within:border-orange-500 transition-colors">
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
                                <button onClick={() => anularOrden(o.id)} disabled={soloLectura} className="text-[9px] disabled:opacity-50 font-black text-red-500 uppercase tracking-widest hover:underline">
                                    Anular Orden
                                </button>
                                <div className="text-right">
                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Total a Cobrar</p>
                                    <p className="font-black text-emerald-400 text-2xl leading-none">${totalNeto.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <button disabled={soloLectura || totalNeto === 0} onClick={() => solicitarAprobacion(o)} className="bg-slate-800 disabled:opacity-50 text-slate-300 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-700 transition-colors flex items-center justify-center gap-1">
                                    <MessageSquare size={12}/> Aprobar Pres.
                                </button>
                                <button disabled={soloLectura} onClick={() => entregarOrdenYFinalizar(o)} className="bg-emerald-600 disabled:opacity-50 text-slate-950 py-2 rounded-xl text-[10px] font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-500 transition-all uppercase tracking-wider flex items-center justify-center gap-1">
                                    Entregar <CheckCircle size={12} />
                               </button>
                            </div>
                        </div>

                    </div>
                )})}
            </div>
        )}
    </section>
  )
}