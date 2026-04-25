'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShieldAlert, ShieldCheck, Lock, Unlock, Search, Wrench, AlertTriangle, CalendarDays } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminCalibre() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [talleres, setTalleres] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')

  // 🔥 AQUÍ PONES TU CORREO DE SUPERADMINISTRADOR
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'leonardocontreras@calibreapp.com' 

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // 🔥 MODO DETECTIVE ACTIVADO
      console.log("=== DEBUG GOD MODE ===")
      console.log("1. ¿Hay sesión activa?:", !!session)
      console.log("2. Correo que ve Supabase:", session?.user?.email)
      console.log("3. Correo que pide el código:", ADMIN_EMAIL)
      console.log("======================")

      // Si no hay sesión o el correo no coincide, lo pateamos al login
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
    // Asumimos que tienes una tabla 'talleres' donde guardas el id del usuario, email, nombre y estado de pago
    const { data, error } = await supabase
      .from('talleres')
      .select('*')
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
      // Si lo activamos, le damos 30 días desde hoy. Si lo bloqueamos, la fecha queda igual pero sin pago confirmado.
      let payload: any = { pago_confirmado: nuevoEstado };
      
      if (nuevoEstado) {
          const fechaVencimiento = new Date();
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // +30 días
          payload.fecha_vencimiento = fechaVencimiento.toISOString();
      }

      const { error } = await supabase
        .from('talleres')
        .update(payload)
        .eq('id', id)

      if (error) throw error

      toast.success(`Taller ${nuevoEstado ? 'Activado' : 'Bloqueado'} exitosamente`, { id: toastId })
      await cargarTalleres() // Recargar la tabla
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId })
    }
  }

  const talleresFiltrados = talleres.filter(t => 
    (t.email || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (t.nombre_taller || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Wrench className="animate-spin text-emerald-500" size={64} /></div>
  }

  if (!isAdmin) return null; // No renderiza nada si lo está redirigiendo

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER GOD MODE */}
        <header className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-2xl">
              <ShieldCheck className="text-emerald-500" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">God Mode</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Panel de Superadministrador • CALIBRE</p>
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

        {/* TABLA DE TALLERES */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4">Taller / Email</th>
                  <th className="p-4">Registro</th>
                  <th className="p-4 text-center">Vencimiento</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acción</th>
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

                    return (
                      <tr key={taller.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-200">{taller.nombre_taller || 'Sin Configurar'}</div>
                          <div className="text-xs text-slate-500">{taller.email || taller.id}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-400 font-medium">
                          {new Date(taller.created_at).toLocaleDateString('es-CL')}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${vencido ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                              <CalendarDays size={12} />
                              {taller.fecha_vencimiento ? new Date(taller.fecha_vencimiento).toLocaleDateString('es-CL') : 'Sin fecha'}
                            </span>
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
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => toggleBloqueo(taller.id, taller.pago_confirmado)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                              taller.pago_confirmado 
                              ? 'bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/50' 
                              : 'bg-emerald-600 text-slate-950 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            }`}
                          >
                            {taller.pago_confirmado ? <><Lock size={14} /> Bloquear</> : <><Unlock size={14} /> Activar</>}
                          </button>
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