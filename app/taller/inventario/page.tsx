'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Package, Search, Plus, AlertTriangle, Edit, Trash2, Box, Tag, DollarSign, Loader2, X } from 'lucide-react'
// Definimos la estructura de un ítem del inventario
interface ItemInventario {
  id: string;
  taller_id: string;
  codigo_sku: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  stock_minimo: number;
  precio_costo: number;
  precio_venta: number;
  ubicacion: string;
}

export default function InventarioPage() {
  const router = useRouter()
  
  // Estados principales
  const [items, setItems] = useState<ItemInventario[]>([])
  const [cargando, setCargando] = useState(true)
  const [tallerId, setTallerId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  
  // Estados para el Modal de Agregar/Editar
  const [modalVisible, setModalVisible] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState<Partial<ItemInventario>>({
    nombre: '', codigo_sku: '', categoria: 'Repuesto', cantidad: 0, stock_minimo: 2, precio_costo: 0, precio_venta: 0, ubicacion: ''
  })

  // 1. Autenticación y Carga de Datos
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        let currentTallerId = null;
        const { data } = await supabase.auth.getSession();
        
        // Verificamos si es Dueño
        if (data?.session?.user?.id) {
          currentTallerId = data.session.user.id;
        } else {
          // Si no, verificamos si es Mecánico (Gafete)
          const credencial = localStorage.getItem('calibre_mecanico_session');
          if (credencial) {
            const mecanico = JSON.parse(credencial);
            currentTallerId = mecanico.taller_id;
          }
        }

        if (!currentTallerId) {
          router.push('/login');
          return;
        }

        setTallerId(currentTallerId);
        await cargarInventario(currentTallerId);
      } catch (error) {
        toast.error("Error de autenticación");
      }
    };

    verificarSesion();
  }, [router]);

  const cargarInventario = async (tId: string) => {
    setCargando(true);
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('taller_id', tId)
      .order('nombre', { ascending: true });

    if (error) {
      toast.error("Error al cargar el inventario");
    } else {
      setItems(data || []);
    }
    setCargando(false);
  }

  // 2. Funciones CRUD
  const guardarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tallerId) return;
    setGuardando(true);
    const toastId = toast.loading("Guardando ítem...");

    try {
      const payload = { ...formData, taller_id: tallerId };

      if (formData.id) {
        // Actualizar
        const { error } = await supabase.from('inventario').update(payload).eq('id', formData.id);
        if (error) throw error;
        toast.success("Ítem actualizado", { id: toastId });
      } else {
        // Crear nuevo
        const { error } = await supabase.from('inventario').insert([payload]);
        if (error) throw error;
        toast.success("Ítem agregado al inventario", { id: toastId });
      }

      setModalVisible(false);
      await cargarInventario(tallerId);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar", { id: toastId });
    } finally {
      setGuardando(false);
    }
  }

  const eliminarItem = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este ítem?")) return;
    
    const toastId = toast.loading("Eliminando...");
    try {
      const { error } = await supabase.from('inventario').delete().eq('id', id);
      if (error) throw error;
      toast.success("Ítem eliminado", { id: toastId });
      if (tallerId) await cargarInventario(tallerId);
    } catch (error) {
      toast.error("Error al eliminar", { id: toastId });
    }
  }

  const abrirModalNuevo = () => {
    setFormData({ nombre: '', codigo_sku: '', categoria: 'Repuesto', cantidad: 0, stock_minimo: 2, precio_costo: 0, precio_venta: 0, ubicacion: '' });
    setModalVisible(true);
  }

  const abrirModalEditar = (item: ItemInventario) => {
    setFormData(item);
    setModalVisible(true);
  }

  // 3. Cálculos y Filtros
  const itemsFiltrados = items.filter(item => 
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (item.codigo_sku && item.codigo_sku.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const valorTotalInventario = items.reduce((acc, item) => acc + (item.precio_costo * item.cantidad), 0);
  const itemsBajoStock = items.filter(item => item.cantidad <= item.stock_minimo).length;

  if (cargando && items.length === 0) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4"><Package className="animate-pulse text-emerald-500 mb-4" size={48} /><p className="text-emerald-400 font-black uppercase tracking-widest text-sm">Abriendo Bodega...</p></div>
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans w-full mx-auto relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/taller')} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-100 flex items-center gap-2">
                <Package className="text-emerald-500" /> Bodega y Stock
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gestión de Repuestos e Insumos</p>
            </div>
          </div>
          
          <button onClick={abrirModalNuevo} className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-6 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 flex items-center justify-center gap-2">
            <Plus size={16} /> Nuevo Artículo
          </button>
        </header>

        {/* MÉTRICAS (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="bg-blue-500/10 p-3 rounded-xl"><Box className="text-blue-500" size={24}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Artículos</p>
              <p className="text-2xl font-black text-slate-200">{items.length}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
            {itemsBajoStock > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/20 rounded-full blur-xl pointer-events-none"></div>}
            <div className={`p-3 rounded-xl ${itemsBajoStock > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <AlertTriangle size={24}/>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alertas de Stock</p>
              <p className={`text-2xl font-black ${itemsBajoStock > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{itemsBajoStock}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="bg-amber-500/10 p-3 rounded-xl"><DollarSign className="text-amber-500" size={24}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Capital Invertido</p>
              <p className="text-xl md:text-2xl font-black text-amber-400">${valorTotalInventario.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 mb-6 flex items-center shadow-inner">
          <div className="pl-4 pr-2 text-slate-500"><Search size={20} /></div>
          <input 
            type="text" 
            placeholder="Buscar por nombre o código SKU..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-200 font-bold placeholder-slate-600 py-3"
          />
        </div>

        {/* TABLA DE INVENTARIO */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar-dark">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="p-4 font-black">Código/SKU</th>
                  <th className="p-4 font-black">Nombre del Artículo</th>
                  <th className="p-4 font-black">Categoría</th>
                  <th className="p-4 font-black text-center">Stock</th>
                  <th className="p-4 font-black text-right">Costo / Venta</th>
                  <th className="p-4 font-black text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-300 divide-y divide-slate-800/50">
                {itemsFiltrados.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No se encontraron artículos.</td></tr>
                ) : (
                  itemsFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-4 font-mono text-[10px] text-slate-400">{item.codigo_sku || 'S/N'}</td>
                      <td className="p-4 text-slate-200">{item.nombre}</td>
                      <td className="p-4">
                        <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-[9px] uppercase tracking-wider border border-slate-700">
                          {item.categoria}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg text-sm font-black border ${item.cantidad <= item.stock_minimo ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                          {item.cantidad}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-500 line-through">${item.precio_costo.toLocaleString('es-CL')}</span>
                          <span className="text-emerald-400">${item.precio_venta.toLocaleString('es-CL')}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => abrirModalEditar(item)} className="p-2 bg-slate-800 hover:bg-blue-900/50 text-slate-400 hover:text-blue-400 rounded-lg transition-colors border border-slate-700 hover:border-blue-500/50" title="Editar">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => eliminarItem(item.id)} className="p-2 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-slate-700 hover:border-red-500/50" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL AGREGAR / EDITAR ÍTEM */}
      {modalVisible && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
          <div className="bg-slate-900 rounded-[30px] shadow-2xl max-w-lg w-full border border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Tag size={18} /> {formData.id ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h3>
              <button onClick={() => setModalVisible(false)} className="text-slate-500 hover:text-white transition-colors p-1 bg-slate-800 rounded-full"><X size={18}/></button>
            </div>
            
            <form onSubmit={guardarItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Nombre del Artículo *</label>
                  <input required value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 focus:border-emerald-500 outline-none" placeholder="Ej: Pastillas de Freno Cerámicas" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Código / SKU</label>
                  <input value={formData.codigo_sku || ''} onChange={e => setFormData({...formData, codigo_sku: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-slate-400 focus:border-emerald-500 outline-none uppercase" placeholder="Ej: BRK-001" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Categoría</label>
                  <select value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 focus:border-emerald-500 outline-none appearance-none">
                    <option value="Repuesto">Repuesto</option>
                    <option value="Insumo">Insumo / Líquido</option>
                    <option value="Herramienta">Herramienta</option>
                    <option value="Accesorio">Accesorio</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Cantidad Actual *</label>
                  <input type="number" required min="0" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xl text-center font-black text-blue-400 focus:border-emerald-500 outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1 block">Alerta Stock Mínimo</label>
                  <input type="number" required min="0" value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xl text-center font-black text-red-400 focus:border-emerald-500 outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Precio de Costo ($)</label>
                  <input type="number" min="0" value={formData.precio_costo} onChange={e => setFormData({...formData, precio_costo: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 focus:border-emerald-500 outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Precio de Venta ($)</label>
                  <input type="number" min="0" value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-emerald-400 focus:border-emerald-500 outline-none" />
                </div>
                
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Ubicación (Opcional)</label>
                  <input value={formData.ubicacion || ''} onChange={e => setFormData({...formData, ubicacion: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-300 focus:border-emerald-500 outline-none" placeholder="Ej: Estante A, Cajón 3" />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setModalVisible(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-105">
                  {guardando ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}