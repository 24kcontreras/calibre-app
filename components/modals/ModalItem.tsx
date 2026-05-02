import React, { useState, useEffect } from 'react'
import { X, Search, Package, Loader2, Wrench, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ModalItem({ itemForm, setItemForm, guardarItemBD, guardandoItem, onClose }: any) {
  const [modo, setModo] = useState<'manual' | 'bodega'>('manual')
  const [busqueda, setBusqueda] = useState('')
  const [inventario, setInventario] = useState<any[]>([])
  const [cargandoBodega, setCargandoBodega] = useState(false)

  // Cargar artículos de la bodega solo cuando cambiamos a la pestaña "bodega"
  useEffect(() => {
    if (modo === 'bodega' && inventario.length === 0) {
      cargarBodega()
    }
  }, [modo])

  const cargarBodega = async () => {
    setCargandoBodega(true)
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
        .gt('cantidad', 0) // Solo traemos los que tienen stock disponible
        .order('nombre', { ascending: true })
      setInventario(inv || [])
    }
    setCargandoBodega(false)
  }

  const seleccionarItemBodega = (item: any) => {
    setItemForm({
      ...itemForm,
      nombre: item.nombre,
      precio: item.precio_venta.toString(),
      tipo_item: 'repuesto',
      procedencia: 'Bodega Interna',
      inventario_id: item.id
    })
    setModo('manual') // Volvemos al formulario para que el mecánico vea los datos rellenados
  }

  const itemsFiltrados = inventario.filter(i => 
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (i.codigo_sku && i.codigo_sku.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="bg-slate-900 rounded-[30px] shadow-2xl max-w-md w-full border border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
          <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <Wrench size={18} /> {itemForm.id ? 'Editar Ítem' : 'Agregar a Orden'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 bg-slate-800 rounded-full"><X size={18}/></button>
        </div>

        {/* Pestañas (Solo visibles si estamos creando uno nuevo) */}
        {!itemForm.id && (
            <div className="flex bg-slate-950 p-1 m-6 rounded-2xl border border-slate-800 relative shrink-0">
                <button type="button" onClick={() => setModo('manual')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 z-10 ${modo === 'manual' ? 'text-white bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>
                    Ingreso Manual
                </button>
                <button type="button" onClick={() => setModo('bodega')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 z-10 ${modo === 'bodega' ? 'text-emerald-400 bg-emerald-900/30 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Package size={14}/> Buscar en Bodega
                </button>
            </div>
        )}

        {/* VISTA: BÚSQUEDA EN BODEGA */}
        {modo === 'bodega' ? (
            <div className="p-6 pt-0 space-y-4 overflow-y-auto custom-scrollbar-dark flex-1">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center shadow-inner">
                    <Search size={16} className="text-slate-500 ml-2 mr-2" />
                    <input type="text" placeholder="Buscar repuesto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-600 py-2" />
                </div>

                {cargandoBodega ? (
                    <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
                ) : itemsFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-bold border border-slate-800 border-dashed rounded-xl bg-slate-950/50">
                        No hay repuestos con stock disponible.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {itemsFiltrados.map(item => (
                            <button key={item.id} type="button" onClick={() => seleccionarItemBodega(item)} className="w-full text-left bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl transition-all flex justify-between items-center group">
                                <div>
                                    <p className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{item.nombre}</p>
                                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Stock: {item.cantidad} | SKU: {item.codigo_sku || 'S/N'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-400">${item.precio_venta.toLocaleString('es-CL')}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            /* VISTA: FORMULARIO MANUAL */
            <form onSubmit={guardarItemBD} className="p-6 pt-0 space-y-4 overflow-y-auto custom-scrollbar-dark flex-1">
              
              {/* Aviso si el ítem está anclado a la bodega */}
              {itemForm.inventario_id && (
                  <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                      <Package size={16} className="text-emerald-500" />
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Vinculado a Bodega</p>
                          <p className="text-[10px] text-slate-300 font-bold">El sistema descontará 1 unidad automáticamente.</p>
                      </div>
                      <button type="button" title="Desvincular" onClick={() => setItemForm({...itemForm, inventario_id: null, procedencia: 'Taller'})} className="ml-auto text-slate-500 hover:text-red-400 p-1"><X size={14}/></button>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Tipo de Ítem</label>
                  <select disabled={!!itemForm.inventario_id} value={itemForm.tipo_item} onChange={e => setItemForm({...itemForm, tipo_item: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 focus:border-blue-500 outline-none appearance-none disabled:opacity-50">
                    <option value="servicio">Mano de Obra / Servicio</option>
                    <option value="repuesto">Repuesto / Insumo</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Descripción *</label>
                  <input disabled={!!itemForm.inventario_id} required value={itemForm.nombre} onChange={e => setItemForm({...itemForm, nombre: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 focus:border-blue-500 outline-none disabled:opacity-50 disabled:text-emerald-400" placeholder={itemForm.tipo_item === 'servicio' ? "Ej: Cambio de Aceite" : "Ej: Filtro de Aceite"} />
                </div>

                {itemForm.tipo_item === 'repuesto' && (
                  <>
                    <div className="col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Detalle Técnico (Opcional)</label>
                      <input value={itemForm.detalle} onChange={e => setItemForm({...itemForm, detalle: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 focus:border-blue-500 outline-none" placeholder="Ej: Marca Bosch, 10W40..." />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Procedencia</label>
                      <select disabled={!!itemForm.inventario_id} value={itemForm.procedencia} onChange={e => setItemForm({...itemForm, procedencia: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 focus:border-blue-500 outline-none appearance-none disabled:opacity-50">
                        <option value="Bodega Interna">Bodega Interna</option>
                        <option value="Taller">Comprado fuera / Repuestero</option>
                        <option value="Cliente">Traído por el Cliente</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Precio Cobrado al Cliente ($)</label>
                  <input type="number" required min="0" value={itemForm.precio} onChange={e => setItemForm({...itemForm, precio: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xl font-black text-emerald-400 focus:border-blue-500 outline-none" placeholder="0" />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={guardandoItem} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:scale-105">
                  {guardandoItem ? <Loader2 size={16} className="animate-spin" /> : 'Añadir a la Orden'}
                </button>
              </div>
            </form>
        )}
      </div>
    </div>
  )
}