'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShieldAlert, ShieldCheck, Lock, Unlock, Search, Wrench, CalendarDays, Car, ClipboardList, Eye } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { TallerConfig } from '@/hooks/types'

interface TallerAdmin extends TallerConfig {
  email?: string;
  vehiculos?: { count: number }[];
  ordenes_trabajo?: { count: number }[];
}

export default function AdminCalibre() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [talleres, setTalleres] = useState<TallerAdmin[]>([])
  const [busqueda, setBusqueda] = useState('')

  const ADMIN_EMAIL = 'leonardocontreras@calibreapp.com' 

  useEffect(() => {
    checkAdmin()
  }, [router])

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session || session.user.email !== ADMIN_EMAIL) {
        toast.error("Acceso Denegado. Solo nivel Dios.")
        router.push('/')
        return
      }

      setIsAdmin(true)
      await cargarTalleres()
    } catch (error) {
      console.error("Error validando admin", error)
    } finally {
      setLoading(false)
    }
  }

  const cargarTalleres = async () => {
    // 🔥 NIVEL 2: Traemos los talleres Y contamos sus autos y órdenes
    const { data, error } = await supabase
      .from('talleres')
      .select('*, vehiculos(count), ordenes_trabajo(count)')
      .order('created_at', { ascending: false })
    
    if (error) {
      toast.error("Error al cargar los talleres")
    } else {
      setTalleres(data || [])
    }
  }

  const toggleBloqueo = async (id: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? 'ACTIVAR' : 'BLOQUEAR';
    
    if (!window.confirm(`¿Estás seguro de ${accion} este taller?`)) return;

    const toastId = toast.loading(`${accion === 'ACTIVAR' ? 'Activando' : 'Bloqueando'} taller...`);

    try {
      const payload: Partial<TallerConfig> = { pago_confirmado: nuevoEstado };
      
      if (nuevoEstado) {
          const fechaVencimiento = new Date();
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // Activar da 30 días base
          payload.fecha_vencimiento = fechaVencimiento.toISOString();
      }

      const { error } = await supabase.from('talleres').update(payload).eq('id', id)
      if (error) throw error

      toast.success(`Taller ${nuevoEstado ? 'Activado' : 'Bloqueado'} exitosamente`, { id: toastId })
      await cargarTalleres() 
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error: ${msg}`, { id: toastId })
    }
  }

  // 🔥 NIVEL 1: Edición Manual de Fecha
  const actualizarFechaManual = async (id: string, nuevaFecha: string) => {
    const toastId = toast.loading('Actualizando fecha...');
    try {
      const { error } = await supabase
        .from('talleres')
        .update({ fecha_vencimiento: nuevaFecha ? new Date(nuevaFecha).toISOString() : null })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Fecha actualizada', { id: toastId });
      await cargarTalleres();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error: ${msg}`, { id: toastId });
    }
  }

  const talleresFiltrados = talleres.filter(t => 
    (t.email || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (t.nombre_taller || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Wrench className="animate-spin text-emerald-500" size={64} /></div>
  }

  if (!isAdmin) return null; 

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-2xl">
              <ShieldCheck className="text-emerald-500" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">God Mode</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Centro de Mando Estratégico • CALIBRE</p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por correo o nombre..." 
              className="w-full bg-slate-950 border border-slate-700 text-sm text-slate-200 p-3 pl-10 rounded-xl outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </header>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4 pl-6">Taller / Contacto</th>
                  <th className="p-4 text-center">Termómetro de Uso</th>
                  <th className="p-4 text-center">Vencimiento (Manual)</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {talleresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-bold text-sm">
                      No se encontraron talleres registrados.
                    </td>
                  </tr>
                ) : (
                  talleresFiltrados.map((taller) => {
                    const vencido = taller.fecha_vencimiento ? new Date(taller.fecha_vencimiento) < new Date() : false;
                    const activo = taller.pago_confirmado && !vencido;
                    
                    // Extraer los conteos de Supabase
                    const autosCount = taller.vehiculos?.[0]?.count || 0;
                    const ordenesCount = taller.ordenes_trabajo?.[0]?.count || 0;

                    return (
                      <tr key={taller.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-200">{taller.nombre_taller || 'Sin Configurar'}</div>
                          {taller.email ? (
                            <a href={`mailto:${taller.email}`} className="text-xs text-emerald-500 hover:text-emerald-400 hover:underline transition-colors">
                              {taller.email}
                            </a>
                          ) : (
                            <div className="text-xs text-slate-500">{taller.id}</div>
                          )}
                          <div className="text-[10px] text-slate-600 mt-1">Reg: {new Date(taller.created_at).toLocaleDateString('es-CL')}</div>
                        </td>
                        
                        {/* 🔥 NIVEL 2: MÉTRICAS DE USO */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex flex-col items-center" title="Vehículos Registrados">
                                <Car size={14} className={autosCount === 0 ? 'text-slate-600' : 'text-blue-400'} />
                                <span className="text-xs font-bold text-slate-300">{autosCount}</span>
                            </div>
                            <div className="w-px h-6 bg-slate-800"></div>
                            <div className="flex flex-col items-center" title="Órdenes Totales">
                                <ClipboardList size={14} className={ordenesCount === 0 ? 'text-slate-600' : 'text-purple-400'} />
                                <span className="text-xs font-bold text-slate-300">{ordenesCount}</span>
                            </div>
                          </div>
                        </td>

                        {/* 🔥 NIVEL 1: CALENDARIO MANUAL */}
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <input 
                              type="date"
                              value={taller.fecha_vencimiento ? taller.fecha_vencimiento.split('T')[0] : ''}
                              onChange={(e) => actualizarFechaManual(taller.id, e.target.value)}
                              className={`text-xs font-bold px-2 py-1.5 rounded-md border outline-none transition-colors cursor-pointer text-center
                                ${vencido ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-500'}`}
                            />
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {activo ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                              <ShieldCheck size={12} /> Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                              <ShieldAlert size={12} /> Bloqueado
                            </span>
                          )}
                        </td>

                        {/* ACCIONES Y MODO ESPÍA */}
                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => toast('El Modo Espía requerirá un ajuste en tu useTaller. ¡Próximamente!', { icon: '🕵️‍♂️' })}
                              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                              title="Modo Espía (Entrar a su cuenta)"
                            >
                              <Eye size={16} />
                            </button>

                            <button 
                              onClick={() => toggleBloqueo(taller.id, taller.pago_confirmado)}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                taller.pago_confirmado 
                                ? 'bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/50' 
                                : 'bg-emerald-600 text-slate-950 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                              }`}
                            >
                              {taller.pago_confirmado ? <><Lock size={14} /> Bloquear</> : <><Unlock size={14} /> Activar</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}