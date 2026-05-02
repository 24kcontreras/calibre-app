'use client'
import React, { useState } from 'react'
import { X, Plus, Trash2, FileText, Send, Loader2, User, Car, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ModalCotizacion({ vehiculo, esExpress, tallerId, nombreTaller, onClose, cargarTodo }: any) {
    const [items, setItems] = useState<{ descripcion: string, cantidad: number, precio: number }[]>([])
    const [observaciones, setObservaciones] = useState('')
    const [guardando, setGuardando] = useState(false)

    // Estados para Cotización Express
    const [clienteExpress, setClienteExpress] = useState('')
    const [telefonoExpress, setTelefonoExpress] = useState('+569')
    const [vehiculoExpress, setVehiculoExpress] = useState('')

    const agregarItem = () => setItems([...items, { descripcion: '', cantidad: 1, precio: 0 }])
    const actualizarItem = (index: number, campo: string, valor: any) => {
        const nuevosItems = [...items]
        nuevosItems[index] = { ...nuevosItems[index], [campo]: valor }
        setItems(nuevosItems)
    }
    const eliminarItem = (index: number) => setItems(items.filter((_, i) => i !== index))
    
    const totalCotizacion = items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0)

    const guardarYEnviar = async () => {
        if (items.length === 0) return toast.error("Agrega al menos un ítem a la cotización.")
        if (esExpress && (!clienteExpress || !vehiculoExpress)) return toast.error("Ingresa el nombre del cliente y vehículo para el PDF.")
        
        setGuardando(true)
        const toastId = toast.loading("Generando presupuesto...")

        try {
            // Guardar en BD si no es express
            if (!esExpress && vehiculo) {
                const { error } = await supabase.from('cotizaciones').insert([{
                    taller_id: tallerId,
                    vehiculo_id: vehiculo.id,
                    items: items,
                    total: totalCotizacion,
                    observaciones: observaciones
                }])
                if (error) throw error
                toast.success("Cotización guardada", { id: toastId })
                await cargarTodo()
            } else {
                toast.success("Presupuesto Rápido listo", { id: toastId })
            }

            // Generar PDF y WhatsApp
            setTimeout(() => {
                window.print()
                
                setTimeout(() => {
                    const telefono = esExpress ? telefonoExpress : (vehiculo?.clientes?.telefono || '');
                    const nombreCli = esExpress ? clienteExpress : (vehiculo?.clientes?.nombre || 'Cliente');
                    const autoStr = esExpress ? vehiculoExpress : `${vehiculo?.marca} ${vehiculo?.modelo} (Patente: ${vehiculo?.patente})`;

                    const numeroLimpio = telefono.replace(/\D/g, '');
                    const textoWssp = `¡Hola ${nombreCli}! 🚗\n\nTe escribimos de *${nombreTaller}*.\nAdjunto te enviamos la cotización solicitada para tu *${autoStr}*.\n\nTotal estimado: *$${totalCotizacion.toLocaleString('es-CL')}*\n\nQuedamos atentos a tu confirmación. ¡Saludos! 🔧`;
                    
                    if (numeroLimpio && numeroLimpio.length >= 8) {
                        const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(textoWssp)}`;
                        window.open(url, '_blank');
                    } else {
                        toast.error("El teléfono no es válido. Solo se generó el PDF.", { duration: 4000 });
                    }
                    onClose();
                }, 1500);

            }, 500)

        } catch (err: any) {
            toast.error("Error al generar cotización", { id: toastId })
            setGuardando(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] print:bg-white print:p-0 print:block">
            
            <div className="bg-slate-900 border border-slate-700/50 rounded-[35px] p-6 w-full max-w-2xl shadow-2xl relative my-auto max-h-[95vh] flex flex-col print:border-none print:shadow-none print:rounded-none print:w-full print:max-h-none print:p-0 print:block">
                
                {/* BOTÓN CERRAR */}
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-amber-400 transition-colors bg-slate-900 p-1.5 rounded-full border border-slate-800 z-20 shadow-sm print:hidden">
                    <X size={20} />
                </button>

                {/* TÍTULO ESTILO CALIBRE */}
                <div className="mb-6 flex items-center gap-4 print:hidden shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner text-amber-500">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter leading-none">
                            {esExpress ? 'Cotización Rápida' : 'Generar Presupuesto'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                            {esExpress ? 'Cliente No Registrado' : 'Cliente en Base de Datos'}
                        </p>
                    </div>
                </div>

                {/* ZONA SCROLLABLE DEL TICKET */}
                <div id="ticket-cotizacion" className="overflow-y-auto custom-scrollbar-dark pr-2 flex-1 space-y-5 print:overflow-visible print:pr-0 print:space-y-4">
                    
                    {/* Membrete Solo para PDF */}
                    <div className="hidden print:block text-center border-b border-gray-300 pb-6 mb-6">
                        <h1 className="text-2xl font-black uppercase text-black">{nombreTaller}</h1>
                        <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mt-1">Presupuesto de Servicio</p>
                    </div>

                    {/* CAJA DE DATOS DEL CLIENTE / VEHÍCULO */}
                    <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-inner print:bg-transparent print:border-gray-200 print:rounded-xl print:shadow-none print:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* CLIENTE */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 print:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <User size={12} className="print:hidden"/> Cliente
                                </label>
                                {esExpress ? (
                                    <div className="space-y-2 print:hidden">
                                        <input value={clienteExpress} onChange={e => setClienteExpress(e.target.value)} placeholder="Nombre del cliente..." className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-slate-200 outline-none focus:border-amber-500 transition-colors" />
                                        <input value={telefonoExpress} onChange={e => setTelefonoExpress(e.target.value)} placeholder="+569..." className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-colors" />
                                    </div>
                                ) : (
                                    <div className="print:mt-1">
                                        <p className="text-sm font-bold text-slate-200 print:text-black">{vehiculo?.clientes?.nombre || 'Sin nombre'}</p>
                                        <p className="text-xs text-slate-400 print:text-gray-600">{vehiculo?.clientes?.telefono || 'Sin teléfono'}</p>
                                    </div>
                                )}
                                {esExpress && (
                                    <div className="hidden print:block mt-1">
                                        <p className="text-sm font-bold text-black">{clienteExpress || 'Cliente'}</p>
                                        <p className="text-xs text-gray-600">{telefonoExpress}</p>
                                    </div>
                                )}
                            </div>

                            {/* VEHÍCULO */}
                            <div className="space-y-2 md:text-right">
                                <label className="text-[10px] font-black text-slate-500 print:text-gray-500 uppercase tracking-widest flex items-center md:justify-end gap-1.5">
                                    <Car size={12} className="print:hidden"/> Vehículo
                                </label>
                                {esExpress ? (
                                    <div className="print:hidden">
                                        <input value={vehiculoExpress} onChange={e => setVehiculoExpress(e.target.value)} placeholder="Ej: Toyota Yaris" className="w-full md:text-right bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-colors" />
                                    </div>
                                ) : (
                                    <div className="print:mt-1">
                                        <p className="text-sm font-bold text-slate-200 print:text-black">{vehiculo?.marca} {vehiculo?.modelo}</p>
                                        <div className="inline-block mt-1">
                                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md print:bg-transparent print:border-gray-400 print:text-black">
                                                {vehiculo?.patente}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {esExpress && (
                                    <div className="hidden print:block mt-1">
                                        <p className="text-sm font-bold text-black">{vehiculoExpress || 'Vehículo a cotizar'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CAJA DE ÍTEMS Y COSTOS */}
                    <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-inner print:bg-transparent print:border-none print:shadow-none print:p-0">
                        <label className="text-[10px] font-black text-slate-500 print:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <DollarSign size={12} className="print:hidden"/> Detalle de Costos
                        </label>

                        <div className="space-y-2 mb-4">
                            {items.length === 0 ? (
                                <div className="text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl print:hidden">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Presupuesto vacío</p>
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-2 bg-slate-900 print:bg-white p-2 md:p-3 rounded-xl border border-slate-700/50 print:border-b print:border-gray-200 print:rounded-none group transition-all hover:border-amber-500/30">
                                        <div className="flex-1">
                                            <input type="text" placeholder="Descripción (Ej: Cambio de aceite)..." value={item.descripcion} onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold text-slate-200 print:text-black placeholder-slate-600" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-slate-950 print:bg-transparent px-3 rounded-lg border border-slate-800 print:border-none py-1">
                                                <span className="text-[10px] font-black text-slate-500">CANT</span>
                                                <input type="number" min="1" value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)} className="w-8 bg-transparent text-center text-sm font-bold text-slate-200 print:text-black outline-none" />
                                            </div>
                                            <div className="flex items-center gap-1 bg-slate-950 print:bg-transparent px-3 rounded-lg border border-slate-800 print:border-none py-1">
                                                <span className="text-[10px] font-black text-slate-500">$</span>
                                                <input type="number" min="0" value={item.precio} onChange={(e) => actualizarItem(index, 'precio', parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-right text-sm font-black text-amber-400 print:text-black outline-none" placeholder="0" />
                                            </div>
                                            <button onClick={() => eliminarItem(index)} className="p-2 text-slate-600 hover:text-red-400 bg-slate-950 hover:bg-red-500/10 rounded-lg transition-colors border border-slate-800 hover:border-red-500/30 print:hidden"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Botón Añadir Estilo Calibre */}
                        <button onClick={agregarItem} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-900/30 hover:bg-amber-500/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 transition-all flex items-center justify-center gap-2 print:hidden">
                            <Plus size={16} /> Añadir Servicio / Repuesto
                        </button>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <textarea placeholder="Observaciones adicionales o validez del presupuesto..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full bg-slate-950 print:bg-transparent border border-slate-800 print:border-none rounded-2xl p-4 text-xs font-bold text-slate-400 print:text-gray-600 outline-none resize-none min-h-[80px] focus:border-amber-500/50 transition-colors shadow-inner"></textarea>
                    </div>

                    {/* Total (Estilo Resaltado) */}
                    <div className="flex justify-end pt-2 print:border-t print:border-gray-300">
                        <div className="bg-slate-950 print:bg-gray-100 p-5 rounded-3xl border border-slate-800 print:border-gray-300 text-right min-w-[250px] shadow-[0_0_30px_rgba(245,158,11,0.03)] print:shadow-none">
                            <p className="text-[10px] uppercase font-black text-slate-500 print:text-gray-500 tracking-widest mb-1">Total Estimado</p>
                            <p className="text-4xl font-black tracking-tighter text-amber-500 print:text-black">${totalCotizacion.toLocaleString('es-CL')}</p>
                        </div>
                    </div>
                </div>

                {/* FOOTER DE BOTONES (Estilo Calibre Nueva Orden) */}
                <div className="flex gap-3 pt-6 border-t border-slate-800/50 mt-2 shrink-0 print:hidden">
                    <button onClick={onClose} className="flex-1 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-300 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={guardarYEnviar} disabled={guardando || items.length === 0} className="flex-[2] bg-amber-600 text-slate-950 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(217,119,6,0.2)] disabled:opacity-50 hover:bg-amber-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        {guardando ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16}/> Generar PDF y Notificar</>}
                    </button>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        @page { margin: 10mm; size: auto; }
                        body { background: white !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                `}} />
            </div>
        </div>
    )
}