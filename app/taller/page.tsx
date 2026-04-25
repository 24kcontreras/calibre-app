'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShieldAlert, ShieldCheck, Lock, Unlock, Search, Wrench, CalendarDays, Key, LogOut } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminCalibre() {
  const router = useRouter()
  // Estados de la vista: 'loading' | 'login' | 'denied' | 'dashboard'
  const [vista, setVista] = useState<'loading' | 'login' | 'denied' | 'dashboard'>('loading')
  const [talleres, setTalleres] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')

  // Estados del Formulario de Login Admin
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loadingLogin, setLoadingLogin] = useState(false)

  // 🔥 AQUÍ VA TU CORREO DE DIOS
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'leonardocontreras14@gmail.com' 

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setVista('login')
        return
      }

      if (session.user.email !== ADMIN_EMAIL) {
        setVista('denied')
        return
      }

      setVista('dashboard')
      await cargarTalleres()
    } catch (error) {
      console.error("Error validando admin", error)
      setVista('login')
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingLogin(true)
    const toastId = toast.loading('Validando credenciales maestras...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (data.session?.user.email !== ADMIN_EMAIL) {
        toast.error('Esta cuenta no tiene privilegios de Superadministrador', { id: toastId })
        await supabase.auth.signOut()
        setVista('denied')
        return
      }

      toast.success('¡Bienvenido, Creador!', { id: toastId })
      setVista('dashboard')
      await cargarTalleres()
    } catch (error: any) {
      toast.error("Credenciales incorrectas", { id: toastId })
    } finally {
      setLoadingLogin(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setVista('login')
    setEmail('')
    setPassword('')
  }

  const cargarTalleres = async () => {
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
      let payload: any = { pago_confirmado: nuevoEstado };
      
      if (nuevoEstado) {
          const fechaVencimiento = new Date();
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // +30 días
          payload.fecha_vencimiento = fechaVencimiento.toISOString();
      }

      const { error } = await supabase.from('talleres').update(payload).eq('id', id)
      if (error) throw error

      toast.success(`Taller ${nuevoEstado ? 'Activado' : 'Bloqueado'} exitosamente`, { id: toastId })
      await cargarTalleres() 
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId })
    }
  }

  const talleresFiltrados = talleres.filter(t => 
    (t.email || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (t.nombre_taller || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  // --- RENDERIZADO CONDICIONAL ---

  if (vista === 'loading') {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Wrench className="animate-spin text-emerald-500" size={64} /></div>
  }

  if (vista === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
        
        <form onSubmit={handleAdminLogin} className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-500/20 p-4 rounded-full">
              <Key className="text-emerald-500" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center text-slate-100 uppercase tracking-tighter mb-2">Acceso Restringido</h2>
          <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">God Mode • Calibre OS</p>
          
          <div className="space-y-4">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo de Administrador" 
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña Maestra" 
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
            <button 
              disabled={loadingLogin}
              className="w-full bg-emerald-600 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {loadingLogin ? 'Desbloqueando...' : 'Entrar al Panel'}
            </button>
            <button type="button" onClick={() => router.push('/')} className="w-full text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest mt-4">
               Volver a la app pública
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (vista === 'denied') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <ShieldAlert className="text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-2">Acceso Denegado</h2>
        <p className="text-slate-400 text-sm mb-8 text-center max-w-md">La cuenta actual no tiene privilegios de superadministrador para ingresar al God Mode.</p>
        <button onClick={handleLogout} className="bg-red-500/10 text-red-500 border border-red-500/30 px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
          <LogOut size={16} /> Cerrar Sesión Actual
        </button>
      </div>
    )
  }

  // --- VISTA DASHBOARD (El código que ya teníamos) ---
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
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Panel de Superadministrador • CALIBRE</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar taller..." 
                className="w-full bg-slate-950 border border-slate-700 text-sm text-slate-200 p-3 pl-10 rounded-xl outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <button onClick={handleLogout} className="bg-slate-800 p-3 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors text-slate-400" title="Cerrar Sesión Segura">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* TABLA DE TALLERES */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4 pl-6">Taller / Email</th>
                  <th className="p-4">Registro</th>
                  <th className="p-4 text-center">Vencimiento</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right pr-6">Acción</th>
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
                        <td className="p-4 pl-6">
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
                        <td className="p-4 text-right pr-6">
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