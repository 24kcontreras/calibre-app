'use client'
import React, { useState, useEffect } from 'react'
import { X, Search, Package, Loader2, Wrench, DollarSign, Plus, User, Box, Trash2, ArrowDownRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { vibrar } from '@/utils/haptics'

interface RepuestoHijo {
    nombre: string;
    cantidad: number;
    precio: number;
    procedencia: 'Bodega Interna' | 'Cliente';
    inventario_id?: string | null;
}

export default function ModalItem({ itemForm, onClose }: any) {
    const [cargando, setCargando] = useState(false)
    const [cargandoEdicion, setCargandoEdicion] = useState(!!itemForm.id)
    
    // ESTADO PADRE
    const [nombreServicio, setNombreServicio] = useState(itemForm?.nombre || '')
    const [precioServicio, setPrecioServicio] = useState(itemForm?.precio || '')

    // ESTADO HIJOS
    const [repuestos, setRepuestos] = useState<RepuestoHijo[]>([])
    
    // UI TABS Y ENTRADA MANUAL
    const [modoIngreso, setModoIngreso] = useState<'cliente' | 'bodega'>('cliente')
    const [repuestoManual, setRepuestoManual] = useState('')

    // BÚSQUEDA BODEGA
    const [busqueda, setBusqueda] = useState('')
    const [inventario, setInventario] = useState<any[]>([])
    const [mostrandoResultados, setMostrandoResultados] = useState(false)

    useEffect(() => {
        const inicializarModal = async () => {
            await cargarBodega();
            
            if (itemForm.id) {
                const { data: hijosExistentes } = await supabase.from('items_orden').select('*').eq('parent_id', itemForm.id);
                if (hijosExistentes && hijosExistentes.length > 0) {
                    setRepuestos(hijosExistentes.map(h => ({
                        nombre: h.descripcion, // 🔥 Ahora leemos 'descripcion' de la BD
                        cantidad: h.cantidad,
                        precio: h.precio,
                        procedencia: h.procedencia as any,
                        inventario_id: h.inventario_id
                    })));
                }
            }
            setCargandoEdicion(false);
        };
        inicializarModal();
    }, [])

    const cargarBodega = async () => {
        let currentTallerId = null;
        const { data } = await supabase.auth.getSession();
        
        if (data?.session?.user?.id) currentTallerId = data.session.user.id;
        else {
            const credencial = localStorage.getItem('calibre_mecanico_session');
            if (credencial) currentTallerId = JSON.parse(credencial).taller_id;
        }

        if (currentTallerId) {
            const { data: inv } = await supabase.from('inventario')
                .select('*')
                .eq('taller_id', currentTallerId)
                .gt('cantidad', 0) 
                .order('nombre', { ascending: true })
            setInventario(inv || [])
        }
    }

    const agregarRepuestoCliente = () => {
        if (!repuestoManual.trim()) return toast.error("Escribe el nombre del repuesto");
        vibrar('ligero')
        setRepuestos([...repuestos, { nombre: repuestoManual.toUpperCase(), cantidad: 1, precio: 0, procedencia: 'Cliente' }])
        setRepuestoManual('') 
    }

    const seleccionarItemBodega = (item: any) => {
        vibrar('ligero')
        setRepuestos([...repuestos, { 
            nombre: item.nombre, 
            cantidad: 1, 
            precio: item.precio_venta, 
            procedencia: 'Bodega Interna',
            inventario_id: item.id
        }])
        setBusqueda('')
        setMostrandoResultados(false)
    }

    const eliminarRepuesto = (index: number) => {
        vibrar('fuerte')
        setRepuestos(prev => prev.filter((_, i) => i !== index))
    }

    const actualizarRepuesto = (index: number, campo: keyof RepuestoHijo, valor: any) => {
        const nuevos = [...repuestos]
        nuevos[index] = { ...nuevos[index], [campo]: valor }
        setRepuestos(nuevos)
    }

    const itemsFiltrados = inventario.filter(i => 
        i.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        (i.codigo_sku && i.codigo_sku.toLowerCase().includes(busqueda.toLowerCase()))
    ).slice(0, 5)

    const guardarTrabajoCompleto = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nombreServicio.trim() || !precioServicio) return toast.error("Falta la descripción o precio del trabajo")

        setCargando(true)
        const toastId = toast.loading(itemForm.id ? "Actualizando Pizarra..." : "Guardando trabajo...")

        try {
            let parentId = itemForm.id;

            if (itemForm.id) {
                // 🔥 MODO EDICIÓN
                await supabase.from('items_orden').update({
                    descripcion: nombreServicio.toUpperCase(), // 🔥 CORREGIDO a descripcion
                    precio: parseInt(precioServicio)
                }).eq('id', itemForm.id);

                const { data: viejos } = await supabase.from('items_orden').select('*').eq('parent_id', itemForm.id);
                if (viejos && viejos.length > 0) {
                    for (const v of viejos) {
                        if (v.procedencia === 'Bodega Interna' && v.inventario_id) {
                            const { data: inv } = await supabase.from('inventario').select('cantidad').eq('id', v.inventario_id).single();
                            if (inv) await supabase.from('inventario').update({ cantidad: inv.cantidad + v.cantidad }).eq('id', v.inventario_id);
                        }
                    }
                    await supabase.from('items_orden').delete().eq('parent_id', itemForm.id);
                }
            } else {
                // 🔥 MODO CREACIÓN
                const payloadPadre = {
                    orden_id: itemForm.orden_id,
                    descripcion: nombreServicio.toUpperCase(), // 🔥 CORREGIDO a descripcion
                    cantidad: 1,
                    precio: parseInt(precioServicio),
                    tipo_item: 'servicio',
                    procedencia: 'Taller'
                };
                const { data: servicioData, error: errPadre } = await supabase.from('items_orden').insert([payloadPadre]).select();
                if (errPadre) throw errPadre;
                parentId = servicioData[0].id;
            }

            if (repuestos.length > 0) {
                const payloadHijos = repuestos.map(r => ({
                    orden_id: itemForm.orden_id,
                    parent_id: parentId, 
                    descripcion: r.nombre.toUpperCase(), // 🔥 CORREGIDO a descripcion
                    cantidad: r.cantidad,
                    precio: r.procedencia === 'Cliente' ? 0 : r.precio,
                    tipo_item: 'repuesto',
                    procedencia: r.procedencia,
                    inventario_id: r.inventario_id || null
                }));

                const { error: errHijos } = await supabase.from('items_orden').insert(payloadHijos);
                if (errHijos) throw errHijos;

                for (const rep of repuestos) {
                    if (rep.procedencia === 'Bodega Interna' && rep.inventario_id) {
                        const { data: invNuevo } = await supabase.from('inventario').select('cantidad').eq('id', rep.inventario_id).single();
                        if (invNuevo) {
                            await supabase.from('inventario').update({ cantidad: invNuevo.cantidad - rep.cantidad }).eq('id', rep.inventario_id);
                        }
                    }
                }
            }

            vibrar('exito')
            toast.success(itemForm.id ? "¡Combo Actualizado!" : "¡Trabajo Añadido!", { id: toastId })
            window.location.reload(); 
        } catch (error) {
            console.error("🔥 ERROR SUPABASE:", error);
            vibrar('error')
            toast.error("Error al guardar en base de datos", { id: toastId })
            setCargando(false)
        }
    }

    if (cargandoEdicion) {
        return (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Loader2 size={48} className="animate-spin text-emerald-500" />
                    <span className="text-emerald-400 font-black tracking-widest text-xs uppercase">Cargando Combo...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
            <div className="bg-slate-900 rounded-[40px] shadow-2xl max-w-2xl w-full border border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
                
                {/* Cabecera */}
                <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-emerald-400 flex items-center gap-3">
                            <Wrench size={24} /> {itemForm.id ? 'Editar Trabajo' : 'Constructor de Trabajo'}
                        </h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Arma el servicio y sus piezas</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 bg-slate-800 rounded-full"><X size={18}/></button>
                </div>

                <form onSubmit={guardarTrabajoCompleto} className="p-4 md:p-8 overflow-y-auto custom-scrollbar-dark flex-1 flex flex-col gap-6">
                    
                    {/* PASO 1: EL SERVICIO (Caja Principal) */}
                    <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-5 md:p-6 relative shadow-[0_0_15px_rgba(16,185,129,0.05)] mt-4">
                        <div className="absolute -top-3.5 left-6 bg-emerald-950 border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm">
                            1. Labor Principal
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descripción del Servicio</label>
                                <input 
                                    required 
                                    value={nombreServicio} 
                                    onChange={e => setNombreServicio(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-200 focus:border-emerald-500 outline-none transition-colors" 
                                    placeholder="Ej: Cambio de Pastillas Delanteras" 
                                />
                            </div>
                            <div className="md:col-span-1 space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cobro ($)</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                    <input 
                                        type="number" 
                                        required 
                                        min="0" 
                                        value={precioServicio} 
                                        onChange={e => setPrecioServicio(e.target.value)} 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-3.5 text-lg font-black text-emerald-400 focus:border-emerald-500 outline-none transition-colors" 
                                        placeholder="0" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONECTOR VISUAL */}
                    <div className="flex justify-center -my-3 relative z-10">
                        <div className="bg-slate-800 rounded-full p-1 border border-slate-700 text-slate-500">
                            <ArrowDownRight size={16} />
                        </div>
                    </div>

                    {/* PASO 2: LOS REPUESTOS (Caja Secundaria) */}
                    <div className="bg-slate-950/40 border-2 border-dashed border-slate-700/60 rounded-3xl p-5 md:p-6 relative">
                        <div className="absolute -top-3.5 left-6 bg-slate-800 border border-slate-600 text-slate-300 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm">
                            2. Repuestos Utilizados (Opcional)
                        </div>

                        {/* Lista de repuestos agregados */}
                        {repuestos.length > 0 && (
                            <div className="space-y-2 mb-5 mt-2">
                                {repuestos.map((rep, index) => (
                                    <div key={index} className="bg-slate-900 border border-slate-700 p-3 rounded-2xl flex flex-col md:flex-row gap-3 relative animate-in slide-in-from-bottom-2">
                                        
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] uppercase tracking-widest px-2 py-1 rounded-lg font-black shrink-0 flex items-center gap-1 ${rep.procedencia === 'Cliente' ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                                                {rep.procedencia === 'Cliente' ? <><User size={10}/> Cliente</> : <><Box size={10}/> Bodega</>}
                                            </span>
                                        </div>

                                        <div className="flex-1 grid grid-cols-12 gap-2">
                                            <input 
                                                required
                                                disabled={rep.procedencia === 'Bodega Interna'}
                                                className="col-span-12 md:col-span-6 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500 disabled:opacity-50" 
                                                placeholder="Detalle..." 
                                                value={rep.nombre}
                                                onChange={(e) => actualizarRepuesto(index, 'nombre', e.target.value)}
                                            />
                                            <div className="col-span-6 md:col-span-3 relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-black">X</span>
                                                <input 
                                                    type="number" min="1" required
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-2 py-2 text-xs font-bold text-slate-200 outline-none focus:border-emerald-500" 
                                                    value={rep.cantidad}
                                                    onChange={(e) => actualizarRepuesto(index, 'cantidad', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-3 relative">
                                                <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input 
                                                    type="number" required disabled={rep.procedencia === 'Cliente'}
                                                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-2 py-2 text-xs font-bold outline-none focus:border-emerald-500 ${rep.procedencia === 'Cliente' ? 'opacity-30' : 'text-emerald-400'}`} 
                                                    placeholder="Precio" 
                                                    value={rep.precio}
                                                    onChange={(e) => actualizarRepuesto(index, 'precio', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => eliminarRepuesto(index)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors self-end md:self-center">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ZONA DE AGREGAR: TABS */}
                        <div className={`flex flex-col ${repuestos.length === 0 ? 'mt-4' : ''}`}>
                            
                            {/* Interruptor de Pestañas */}
                            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-4">
                                <button 
                                    type="button" 
                                    onClick={() => setModoIngreso('cliente')} 
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${modoIngreso === 'cliente' ? 'bg-blue-600/20 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <User size={14}/> Trae el Cliente
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setModoIngreso('bodega')} 
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${modoIngreso === 'bodega' ? 'bg-emerald-600/20 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Package size={14}/> Buscar Bodega
                                </button>
                            </div>

                            {/* VISTA: CLIENTE (Default) */}
                            {modoIngreso === 'cliente' && (
                                <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Kit de Distribución Gates..." 
                                        value={repuestoManual} 
                                        onChange={e => setRepuestoManual(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarRepuestoCliente(); } }}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 outline-none focus:border-blue-500" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={agregarRepuestoCliente} 
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={16}/> Añadir
                                    </button>
                                </div>
                            )}

                            {/* VISTA: BODEGA */}
                            {modoIngreso === 'bodega' && (
                                <div className="relative animate-in fade-in zoom-in-95 duration-200">
                                    <div className="bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-colors rounded-xl flex items-center px-4 shadow-inner focus-within:ring-2 ring-emerald-500/20">
                                        <Search size={18} className="text-emerald-500 mr-3" />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar repuesto en tu inventario..." 
                                            value={busqueda} 
                                            onChange={e => {setBusqueda(e.target.value); setMostrandoResultados(true)}}
                                            onFocus={() => setMostrandoResultados(true)}
                                            className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-200 placeholder-slate-500 py-3" 
                                        />
                                    </div>
                                    
                                    {/* Resultados de Bodega */}
                                    {mostrandoResultados && busqueda.length > 0 && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            {itemsFiltrados.length === 0 ? (
                                                <div className="p-4 text-xs font-bold text-slate-400 text-center flex flex-col items-center gap-2">
                                                    <Package size={20} className="text-slate-600" />
                                                    No hay stock de "{busqueda}"
                                                </div>
                                            ) : (
                                                itemsFiltrados.map(item => (
                                                    <button key={item.id} type="button" onClick={() => seleccionarItemBodega(item)} className="w-full text-left p-3 hover:bg-slate-700 border-b border-slate-700/50 flex justify-between items-center transition-colors">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-200">{item.nombre}</p>
                                                            <p className="text-[10px] text-emerald-400 font-black mt-0.5 tracking-widest">STOCK: {item.cantidad}</p>
                                                        </div>
                                                        <p className="text-sm font-black text-emerald-400">${item.precio_venta.toLocaleString()}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                    
                    {/* FOOTER */}
                    <div className="pt-4 mt-2 flex gap-4 shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">Cancelar</button>
                        <button type="submit" disabled={cargando} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {cargando ? <Loader2 size={16} className="animate-spin" /> : (itemForm.id ? 'Actualizar Pizarra' : 'Guardar en la Pizarra')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}