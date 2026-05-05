'use server'

import { createClient } from '../../utils/supabase/server'
import { TallerConfig, Vehiculo, OrdenTrabajo } from '../../hooks/types'

export async function fetchInitialTallerData(tallerId: string) {
  try {
    const supabase = await createClient()

    // 🔥 Disparamos las 3 consultas al mismo tiempo para ganar velocidad
    const [tallerRes, vehiculosRes, ordenesRes] = await Promise.all([
      supabase.from('talleres').select('*').eq('id', tallerId).single(),
      supabase.from('vehiculos')
        .select('*, clientes(*), alertas_desgaste(*)')
        .eq('taller_id', tallerId)
        .order('created_at', { ascending: false }),
      supabase.from('ordenes_trabajo')
        .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*), comentarios_orden(*)')
        .eq('vehiculos.taller_id', tallerId)
        .order('created_at', { ascending: false })
    ])

    // 🔥 CORRECCIÓN: Ahora leemos el código del error correctamente (tallerRes.error.code)
    if (tallerRes.error && tallerRes.error.code !== 'PGRST116') {
      console.error("Error cargando taller:", tallerRes.error)
      throw new Error(tallerRes.error.message)
    }

    const tallerData = tallerRes.data as TallerConfig | null
    const vehiculosData = vehiculosRes.data as Vehiculo[] || []
    const ordenesData = ordenesRes.data as OrdenTrabajo[] || []

    // Calculamos si la suscripción está vencida en el servidor
    let soloLectura = false
    if (tallerData) {
      const vencido = tallerData.fecha_vencimiento ? new Date(tallerData.fecha_vencimiento) < new Date() : false
      soloLectura = !tallerData.pago_confirmado || vencido
    }

    // Separamos las órdenes abiertas de las finalizadas
    const ordenesAbiertas = ordenesData.filter(o => o.estado !== 'Finalizada')
    // Las finalizadas las ordenamos por fecha de actualización para el historial
    const historial = ordenesData
      .filter(o => o.estado === 'Finalizada')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    return {
      success: true,
      data: {
        configTaller: tallerData,
        vehiculos: vehiculosData,
        ordenesAbiertas,
        historial,
        soloLectura
      }
    }
  } catch (error: any) {
    console.error("Error en fetchInitialTallerData:", error)
    return { success: false, error: error.message }
  }
}