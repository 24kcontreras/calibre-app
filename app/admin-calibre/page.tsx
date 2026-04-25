'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, CheckCircle2, XCircle, Calendar, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminCalibrePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [talleres, setTalleres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inicializamos Supabase leyendo desde el localStorage (cliente estándar)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    setLoading(true);
    // 1. Verificamos la sesión actual en el localStorage
    const { data: { session } } = await supabase.auth.getSession();

    console.log("Correo en la sesión:", session?.user?.email);
    console.log("Correo autorizado:", adminEmail);

    if (!session || session.user.email !== adminEmail) {
      // Si no hay sesión o el correo no coincide, lo pateamos de vuelta
      router.push('/');
      return;
    }

    setIsAdmin(true);

    // 2. Traemos todos los talleres
    const { data, error } = await supabase
      .from('talleres')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar los talleres');
      console.error("Error de base de datos:", error);
    } else {
      setTalleres(data || []);
    }
    
    setLoading(false);
  };

  const togglePago = async (tallerId: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    const { error } = await supabase
      .from('talleres')
      .update({ pago_confirmado: nuevoEstado })
      .eq('id', tallerId);

    if (error) {
      toast.error('Error al actualizar el pago');
    } else {
      toast.success(nuevoEstado ? 'Acceso habilitado' : 'Acceso bloqueado');
      // Actualizamos el estado local para que se refleje al instante
      setTalleres(talleres.map(t => t.id === tallerId ? { ...t, pago_confirmado: nuevoEstado } : t));
    }
  };

  const updateFechaVencimiento = async (tallerId: string, nuevaFecha: string) => {
    const { error } = await supabase
      .from('talleres')
      .update({ fecha_vencimiento: nuevaFecha })
      .eq('id', tallerId);

    if (error) {
      toast.error('Error al actualizar la fecha');
    } else {
      toast.success('Fecha de vencimiento actualizada');
      setTalleres(talleres.map(t => t.id === tallerId ? { ...t, fecha_vencimiento: nuevaFecha } : t));
    }
  };

  // Botón rápido para sumar 30 días
  const sumar30Dias = async (tallerId: string, fechaActual: string) => {
    const fecha = fechaActual ? new Date(fechaActual) : new Date();
    fecha.setDate(fecha.getDate() + 30);
    const nuevaFechaStr = fecha.toISOString(); // O el formato que acepte tu BD
    
    await updateFechaVencimiento(tallerId, nuevaFechaStr);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Verificando credenciales de Dios...</div>;
  }

  if (!isAdmin) return null; // Previene un destello antes del redirect

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" />
      
      {/* Header del Admin */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-zinc-900 p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold">CALIBRE God Mode</h1>
            <p className="text-sm text-zinc-400">Panel de Control de Superadministrador</p>
          </div>
        </div>
        <div className="flex gap-4 text-center">
          <div className="bg-zinc-800 px-4 py-2 rounded-lg">
            <p className="text-xs text-zinc-400">Total Talleres</p>
            <p className="text-xl font-bold">{talleres.length}</p>
          </div>
          <div className="bg-zinc-800 px-4 py-2 rounded-lg">
            <p className="text-xs text-zinc-400">Pagos Activos</p>
            <p className="text-xl font-bold text-emerald-400">
              {talleres.filter(t => t.pago_confirmado).length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Talleres */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Taller</th>
                <th className="p-4 font-semibold text-center">Acceso (Pago)</th>
                <th className="p-4 font-semibold">Vencimiento</th>
                <th className="p-4 font-semibold text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {talleres.map((taller) => (
                <tr key={taller.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    {/* 👇 AQUÍ ESTÁ EL CAMBIO MÁGICO: nombre_taller 👇 */}
                    <p className="font-bold text-gray-900">{taller.nombre_taller || 'Taller sin nombre'}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">ID: {taller.id.substring(0,8)}...</p>
                  </td>
                  
                  {/* Toggle de Pago */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => togglePago(taller.id, taller.pago_confirmado)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        taller.pago_confirmado ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          taller.pago_confirmado ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <p className="text-xs mt-1 text-gray-500">
                      {taller.pago_confirmado ? 'Activo' : 'Bloqueado'}
                    </p>
                  </td>

                  {/* Selector de Fecha */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={taller.fecha_vencimiento ? taller.fecha_vencimiento.split('T')[0] : ''}
                        onChange={(e) => updateFechaVencimiento(taller.id, new Date(e.target.value).toISOString())}
                      />
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="p-4 text-right">
                    <button
                      onClick={() => sumar30Dias(taller.id, taller.fecha_vencimiento)}
                      className="inline-flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      +30 Días
                    </button>
                  </td>
                </tr>
              ))}
              {talleres.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No hay talleres registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}