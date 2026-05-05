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

// --- AÑADIR AL FINAL DE app/taller/actions.ts ---

export async function guardarItemAction(payload: any, itemId: string | null) {
  try {
    const supabase = await createClient()
    if (itemId) {
      const { error } = await supabase.from('items_orden').update(payload).eq('id', itemId)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('items_orden').insert([payload])
      if (error) throw new Error(error.message)
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function guardarAlertaAction(payload: any) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('alertas_desgaste').insert([payload])
    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function resolverAlertaAction(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('alertas_desgaste').update({ estado: 'Resuelta' }).eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}