'use client'
import React, { useState } from 'react'
import { X, Plus, Trash2, FileText, Send, Loader2, User, Car, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { generarDocumentoPDF } from '@/utils/pdfGenerator'

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
        const toastId = toast.loading("Generando presupuesto PDF...")

        try {
            // 1. Guardar en BD si NO es express
            if (!esExpress && vehiculo) {
                const { error } = await supabase.from('cotizaciones').insert([{
                    taller_id: tallerId,
                    vehiculo_id: vehiculo.id,
                    items: items,
                    total: totalCotizacion,
                    observaciones: observaciones
                }])
                if (error) throw error
            }

            // 2. Obtener datos del Taller para el Membrete del PDF
            const { data: authData } = await supabase.auth.getSession();
            const configPDF = {
                nombreTaller: nombreTaller,
                direccion: authData.session?.user?.user_metadata?.direccion_taller || '',
                telefono: authData.session?.user?.user_metadata?.telefono_taller || '',
                garantia: authData.session?.user?.user_metadata?.garantia_taller || '',
                logoUrl: authData.session?.user?.user_metadata?.logo_url || null,
                incluirIva: authData.session?.user?.user_metadata?.incluir_iva || false
            };

            // 3. Crear un "Molde" de orden para que el PDF Generator lo entienda
            const ordenSimuladaParaPDF = {
                id: `COT-${Math.floor(Math.random() * 90000) + 10000}`, // ID falso para la cotización
                vehiculos: {
                    patente: esExpress ? 'POR ASIGNAR' : vehiculo?.patente,
                    marca: esExpress ? vehiculoExpress : vehiculo?.marca,
                    modelo: esExpress ? '' : vehiculo?.modelo,
                    anho: vehiculo?.anho || '',
                    clientes: {
                        nombre: esExpress ? clienteExpress : (vehiculo?.clientes?.nombre || 'Cliente'),
                        telefono: esExpress ? telefonoExpress : (vehiculo?.clientes?.telefono || '')
                    }
                },
                kilometraje: vehiculo?.kilometraje || 0,
                mecanico: 'Taller',
                costo_revision: 0,
                descuento: 0,
                // Mapeamos los ítems planos a la estructura que el PDF espera (Todo como "padre" principal)
                items_orden: items.map(item => ({
                    descripcion: item.cantidad > 1 ? `${item.descripcion} (x${item.cantidad})` : item.descripcion,
                    precio: item.precio * item.cantidad,
                    tipo_item: 'servicio',
                    procedencia: 'Taller',
                    parent_id: null
                })),
                nivel_combustible: null,
                testigos: '[]',
                danos_previos: '',
                objetos_valor: ''
            };

            // 4. GENERAR EL PDF CON LA NUEVA FUNCIÓN MAESTRA (esCotizacion = true)
            await generarDocumentoPDF(ordenSimuladaParaPDF, observaciones, configPDF, true);

            toast.success("¡Cotización generada y descargada!", { id: toastId })
            if (!esExpress && cargarTodo) await cargarTodo();

            // 5. Preparar WhatsApp
            setTimeout(() => {
                const telefono = esExpress ? telefonoExpress : (vehiculo?.clientes?.telefono || '');
                const nombreCli = esExpress ? clienteExpress : (vehiculo?.clientes?.nombre || 'Cliente');
                const autoStr = esExpress ? vehiculoExpress : `${vehiculo?.marca} ${vehiculo?.modelo}`;

                const numeroLimpio = telefono.replace(/\D/g, '');
                const textoWssp = `¡Hola ${nombreCli}! 🚗\n\nTe escribimos de *${nombreTaller}*.\nAcabamos de generar la cotización formal para tu *${autoStr}*.\n\nTotal estimado: *$${totalCotizacion.toLocaleString('es-CL')}*\n\n(Te enviaremos el documento PDF adjunto en un momento).\nQuedamos atentos a tu confirmación. ¡Saludos! 🔧`;
                
                if (numeroLimpio && numeroLimpio.length >= 8) {
                    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(textoWssp)}`;
                    window.open(url, '_blank');
                } else {
                    toast.success("PDF descargado. (Sin número válido para WhatsApp)", { duration: 4000 });
                }
                onClose();
            }, 1000);

        } catch (err: any) {
            console.error(err);
            toast.error("Error al generar cotización", { id: toastId })
            setGuardando(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="bg-slate-900 border border-slate-700/50 rounded-[35px] p-6 w-full max-w-2xl shadow-2xl relative my-auto max-h-[95vh] flex flex-col">
                
                {/* BOTÓN CERRAR */}
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-amber-400 transition-colors bg-slate-900 p-1.5 rounded-full border border-slate-800 z-20 shadow-sm">
                    <X size={20} />
                </button>

                {/* TÍTULO ESTILO CALIBRE */}
                <div className="mb-6 flex items-center gap-4 shrink-0">
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
                <div className="overflow-y-auto custom-scrollbar-dark pr-2 flex-1 space-y-5">
                    
                    {/* CAJA DE DATOS DEL CLIENTE / VEHÍCULO */}
                    <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* CLIENTE */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <User size={12} /> Cliente
                                </label>
                                {esExpress ? (
                                    <div className="space-y-2">
                                        <input value={clienteExpress} onChange={e => setClienteExpress(e.target.value)} placeholder="Nombre del cliente..." className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-slate-200 outline-none focus:border-amber-500 transition-colors" />
                                        <input value={telefonoExpress} onChange={e => setTelefonoExpress(e.target.value)} placeholder="+569..." className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-colors" />
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">{vehiculo?.clientes?.nombre || 'Sin nombre'}</p>
                                        <p className="text-xs text-slate-400">{vehiculo?.clientes?.telefono || 'Sin teléfono'}</p>
                                    </div>
                                )}
                            </div>

                            {/* VEHÍCULO */}
                            <div className="space-y-2 md:text-right">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center md:justify-end gap-1.5">
                                    <Car size={12} /> Vehículo
                                </label>
                                {esExpress ? (
                                    <div>
                                        <input value={vehiculoExpress} onChange={e => setVehiculoExpress(e.target.value)} placeholder="Ej: Toyota Yaris" className="w-full md:text-right bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-colors" />
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">{vehiculo?.marca} {vehiculo?.modelo}</p>
                                        <div className="inline-block mt-1">
                                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                                                {vehiculo?.patente}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CAJA DE ÍTEMS Y COSTOS */}
                    <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-inner">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <DollarSign size={12} /> Detalle de Costos
                        </label>

                        <div className="space-y-2 mb-4">
                            {items.length === 0 ? (
                                <div className="text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Presupuesto vacío</p>
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-2 bg-slate-900 p-2 md:p-3 rounded-xl border border-slate-700/50 group transition-all hover:border-amber-500/30">
                                        <div className="flex-1">
                                            <input type="text" placeholder="Descripción (Ej: Cambio de aceite)..." value={item.descripcion} onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold text-slate-200 placeholder-slate-600" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-slate-950 px-3 rounded-lg border border-slate-800 py-1">
                                                <span className="text-[10px] font-black text-slate-500">CANT</span>
                                                <input type="number" min="1" value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)} className="w-8 bg-transparent text-center text-sm font-bold text-slate-200 outline-none" />
                                            </div>
                                            <div className="flex items-center gap-1 bg-slate-950 px-3 rounded-lg border border-slate-800 py-1">
                                                <span className="text-[10px] font-black text-slate-500">$</span>
                                                <input type="number" min="0" value={item.precio} onChange={(e) => actualizarItem(index, 'precio', parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-right text-sm font-black text-amber-400 outline-none" placeholder="0" />
                                            </div>
                                            <button onClick={() => eliminarItem(index)} className="p-2 text-slate-600 hover:text-red-400 bg-slate-950 hover:bg-red-500/10 rounded-lg transition-colors border border-slate-800 hover:border-red-500/30"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Botón Añadir Estilo Calibre */}
                        <button onClick={agregarItem} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-900/30 hover:bg-amber-500/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 transition-all flex items-center justify-center gap-2">
                            <Plus size={16} /> Añadir Servicio / Repuesto
                        </button>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <textarea placeholder="Observaciones adicionales o validez del presupuesto..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-slate-400 outline-none resize-none min-h-[80px] focus:border-amber-500/50 transition-colors shadow-inner"></textarea>
                    </div>

                    {/* Total (Estilo Resaltado) */}
                    <div className="flex justify-end pt-2">
                        <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-right min-w-[250px] shadow-[0_0_30px_rgba(245,158,11,0.03)]">
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Total Estimado</p>
                            <p className="text-4xl font-black tracking-tighter text-amber-500">${totalCotizacion.toLocaleString('es-CL')}</p>
                        </div>
                    </div>
                </div>

                {/* FOOTER DE BOTONES */}
                <div className="flex gap-3 pt-6 border-t border-slate-800/50 mt-2 shrink-0">
                    <button onClick={onClose} className="flex-1 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-300 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={guardarYEnviar} disabled={guardando || items.length === 0} className="flex-[2] bg-amber-600 text-slate-950 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(217,119,6,0.2)] disabled:opacity-50 hover:bg-amber-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        {guardando ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16}/> Generar PDF y Notificar</>}
                    </button>
                </div>

            </div>
        </div>
    )
}