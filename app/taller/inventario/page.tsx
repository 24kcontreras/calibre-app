'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { 
  Package, 
  Search, 
  Plus, 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Box,
  DollarSign,
  Barcode
} from 'lucide-react'
import { useTaller } from '@/hooks/useTaller'

interface ArticuloInventario {
    id: string;
    nombre: string;
    cantidad: number;
    precio_costo: number;
    precio_venta: number;
    codigo_sku: string | null;
    taller_id: string;
    created_at: string;
}

export default function InventarioPage() {
  const router = useRouter()
  const { session, mecanicoActivo, soloLectura, nombreTaller } = useTaller()
  
  const [items, setItems] = useState<ArticuloInventario[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditando, setItemEditando] = useState<ArticuloInventario | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Formulario
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [sku, setSku] = useState('')

  const cargarInventario = async () => {
    setCargando(true)
    let tId = session?.user?.id;
    if (!tId && mecanicoActivo) tId = mecanicoActivo.taller_id;

    if (tId) {
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .eq('taller_id', tId)
            .order('nombre', { ascending: true });
        
        if (error) toast.error("Error al cargar bodega");
        else setItems(data || []);
    }
    setCargando(false)
  }

  useEffect(() => {
    if (session || mecanicoActivo) cargarInventario()
  }, [session, mecanicoActivo])

  const handleOpenModal = (item: ArticuloInventario | null = null) => {
    if (item) {
        setItemEditando(item)
        setNombre(item.nombre)
        setCantidad(item.cantidad.toString())
        setPrecioCosto(item.precio_costo.toString())
        setPrecioVenta(item.precio_venta.toString())
        setSku(item.codigo_sku || '')
    } else {
        setItemEditando(null)
        setNombre('')
        setCantidad('')
        setPrecioCosto('')
        setPrecioVenta('')
        setSku('')
    }
    setModalAbierto(true)
  }

  const guardarItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (soloLectura) return toast.error("Modo lectura activado");
    
    setGuardando(true)
    let tId = session?.user?.id;
    if (!tId && mecanicoActivo) tId = mecanicoActivo.taller_id;

    const payload = {
        nombre,
        cantidad: parseInt(cantidad) || 0,
        precio_costo: parseInt(precioCosto) || 0,
        precio_venta: parseInt(precioVenta) || 0,
        codigo_sku: sku.trim() || null,
        taller_id: tId
    }

    try {
        if (itemEditando) {
            const { error } = await supabase.from('inventario').update(payload).eq('id', itemEditando.id);
            if (error) throw error;
            toast.success("Artículo actualizado");
        } else {
            const { error } = await supabase.from('inventario').insert([payload]);
            if (error) throw error;
            toast.success("Artículo agregado a bodega");
        }
        setModalAbierto(false);
        cargarInventario();
    } catch (err) {
        toast.error("Error al guardar cambios");
    } finally {
        setGuardando(false)
    }
  }

  const eliminarItem = async (id: string) => {
    if (soloLectura) return;
    if (!window.confirm("¿Estás seguro de eliminar este artículo de la bodega?")) return;

    try {
        const { error } = await supabase.from('inventario').delete().eq('id', id);
        if (error) throw error;
        toast.success("Artículo eliminado");
        cargarInventario();
    } catch (err) {
        toast.error("Error al eliminar");
    }
  }

  const itemsFiltrados = items.filter(i => 
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (i.codigo_sku && i.codigo_sku.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const inversionTotal = items.reduce((acc, i) => acc + (i.precio_costo * i.cantidad), 0)
  const valorVentaTotal = items.reduce((acc, i) => acc + (i.precio_venta * i.cantidad), 0)

  if (!session && !mecanicoActivo && !cargando) {
    router.push('/login')
    return null
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans max-w-7xl mx-auto pb-24">
      <Toaster position="bottom-right" />
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => router.push('/taller')}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-slate-600 transition-all shadow-lg"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-100 flex items-center gap-3">
                    <Package className="text-emerald-500" size={28} /> Bodega e Inventario
                </h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{nombreTaller}</p>
            </div>
        </div>

        <button 
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black uppercase tracking-widest text-xs px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.02]"
        >
            <Plus size={18} /> Nuevo Artículo
        </button>
      </div>

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] backdrop-blur-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Box size={14} className="text-blue-500"/> Artículos Totales</p>
            <p className="text-3xl font-black text-slate-100">{items.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] backdrop-blur-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingDown size={14} className="text-orange-500"/> Inversión en Stock</p>
            <p className="text-3xl font-black text-slate-100">${inversionTotal.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] backdrop-blur-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500"/> Valorización Venta</p>
            <p className="text-3xl font-black text-emerald-400">${valorVentaTotal.toLocaleString('es-CL')}</p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-2xl flex items-center mb-6 shadow-inner focus-within:border-emerald-500/50 transition-all">
        <Search size={20} className="text-slate-500 ml-4 mr-3" />
        <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 py-3 font-bold"
        />
      </div>

      {/* TABLA / LISTA */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[35px] overflow-hidden backdrop-blur-md">
        {cargando ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Sincronizando Bodega...</p>
            </div>
        ) : itemsFiltrados.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center">
                <Package size={64} className="text-slate-800 mb-4" />
                <h3 className="text-lg font-black text-slate-400 uppercase">Sin resultados</h3>
                <p className="text-xs text-slate-500 font-bold max-w-xs">No encontramos artículos que coincidan con tu búsqueda o la bodega está vacía.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/50">
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Artículo / SKU</th>
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock</th>
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Costo</th>
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Venta</th>
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Margen</th>
                            <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsFiltrados.map((item) => {
                            const margen = item.precio_venta - item.precio_costo;
                            const pctMargen = item.precio_costo > 0 ? Math.round((margen / item.precio_costo) * 100) : 0;
                            
                            return (
                                <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-6">
                                        <p className="font-black text-slate-200 uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{item.nombre}</p>
                                        <p className="text-[10px] font-mono text-slate-500 mt-1">{item.codigo_sku || 'SIN SKU'}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.cantidad <= 2 ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                            {item.cantidad} UNID
                                        </span>
                                    </td>
                                    <td className="p-6 font-bold text-slate-400 text-sm">${item.precio_costo.toLocaleString('es-CL')}</td>
                                    <td className="p-6 font-black text-emerald-400 text-base">${item.precio_venta.toLocaleString('es-CL')}</td>
                                    <td className="p-6">
                                        <p className="text-[10px] font-black text-emerald-500/70">+${margen.toLocaleString('es-CL')}</p>
                                        <p className="text-[9px] font-bold text-slate-600">{pctMargen}% Rentabilidad</p>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2 bg-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-slate-700"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => eliminarItem(item.id)}
                                                className="p-2 bg-slate-800 text-slate-500 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-slate-700"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* MODAL AGREGAR/EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter text-slate-100">{itemEditando ? 'Editar Artículo' : 'Nuevo en Bodega'}</h3>
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Gestión de Stock Centralizado</p>
                    </div>
                    <button onClick={() => setModalAbierto(false)} className="text-slate-500 hover:text-white p-2">✕</button>
                </div>

                <form onSubmit={guardarItem} className="p-8 space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Producto / Repuesto</label>
                        <div className="relative">
                            <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-200 focus:border-emerald-500 outline-none transition-all" placeholder="Ej: Filtro de Aceite Mann" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stock Inicial</label>
                            <input type="number" required value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm font-bold text-slate-200 focus:border-emerald-500 outline-none" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código SKU / Parte</label>
                            <div className="relative">
                                <Barcode size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input value={sku} onChange={e => setSku(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-xs font-mono text-slate-400 focus:border-emerald-500 outline-none" placeholder="Opcional" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio Costo ($)</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input type="number" required value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-400 focus:border-emerald-500 outline-none" placeholder="0" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio Venta ($)</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                <input type="number" required value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-lg font-black text-emerald-400 focus:border-emerald-500 outline-none" placeholder="0" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800 flex gap-4">
                        <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-300">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={guardando}
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {guardando ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> {itemEditando ? 'Guardar Cambios' : 'Añadir a Bodega'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* AVISO MODO LECTURA */}
      {soloLectura && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/50 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 z-50">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Modo Solo Lectura - Suscripción Vencida</p>
          </div>
      )}
    </main>
  )
}
