'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const useTaller = () => {
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [soloLectura, setSoloLectura] = useState(false)
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [ordenesAbiertas, setOrdenesAbiertas] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])
  const [nombreTaller, setNombreTaller] = useState('MI TALLER')
  const [configTaller, setConfigTaller] = useState<any>(null) // 🔥 AHORA SÍ EXISTE
  const [esOnboarding, setEsOnboarding] = useState(false)

  const extraerDatosConfiguracion = (metadata: any) => {
      setConfigTaller(metadata); // 🔥 Y AQUÍ LA GUARDAMOS
      if (!metadata || !metadata.nombre_taller) {
          setNombreTaller('MI TALLER');
          setEsOnboarding(true);
          return;
      }
      setNombreTaller(metadata.nombre_taller);
      setEsOnboarding(false); 
  };

  const cargarTodo = async (tId?: string) => {
    const currentTallerId = tId || session?.user?.id;
    if (!currentTallerId) return;

    // 1. Verificamos Lock-In Comercial
    const { data: tData } = await supabase.from('talleres').select('pago_confirmado, fecha_vencimiento').eq('id', currentTallerId).single();
    if (tData) {
        const vencido = tData.fecha_vencimiento ? new Date(tData.fecha_vencimiento) < new Date() : false;
        setSoloLectura(!tData.pago_confirmado || vencido);
    }

    // 2. Traemos Vehículos
    const { data: vData } = await supabase.from('vehiculos')
      .select('*, clientes(*), alertas_desgaste(*)') 
      .eq('taller_id', currentTallerId)
      .order('created_at', { ascending: false })
    setVehiculos(vData || [])

    // 3. Traemos Órdenes Activas
    const { data: oAbiertas } = await supabase.from('ordenes_trabajo')
      .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*), comentarios_orden(*)') 
      .eq('estado', 'Abierta')
      .eq('vehiculos.taller_id', currentTallerId)
      .order('created_at', { ascending: false })
    setOrdenesAbiertas(oAbiertas || [])

    // 4. Traemos Historial
    const { data: oFinalizadas } = await supabase.from('ordenes_trabajo')
      .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*), comentarios_orden(*)') 
      .eq('estado', 'Finalizada')
      .eq('vehiculos.taller_id', currentTallerId)
      .order('created_at', { ascending: false }).limit(200) 
    setHistorial(oFinalizadas || [])
  }

  useEffect(() => {
    let isMounted = true; 

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const currentSession = data?.session;
        if (isMounted) {
            setSession(currentSession);
            if (currentSession?.user?.id) {
                await cargarTodo(currentSession.user.id);
                extraerDatosConfiguracion(currentSession.user.user_metadata);
            }
        }
      } catch (err) {
        console.error("Error crítico de Auth:", err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
          setSession(currentSession);
          if (currentSession?.user?.id) {
              cargarTodo(currentSession.user.id);
              extraerDatosConfiguracion(currentSession.user.user_metadata);
          }
      }
    });

    return () => {
        isMounted = false;
        authListener.subscription?.unsubscribe();
    }
  }, [])

  // 🔥 CÁLCULOS DERIVADOS (Telemetría, Finanzas y Oportunidades)
  const cajaTotal = historial.reduce((acc, o) => acc + (o.items_orden?.reduce((s: number, i: any) => s + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0), 0)

  let ingresosServicio = 0;
  let ingresosRepuesto = 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const ordenesEsteMes = historial.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const gananciasEsteMes = ordenesEsteMes.reduce((acc, o) => 
      acc + (o.items_orden?.reduce((s: number, i: any) => s + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0)
  , 0);

  const autosEsteMes = ordenesEsteMes.length;

  historial.forEach(o => {
    o.items_orden?.forEach((i: any) => {
      if (i.tipo_item === 'servicio') ingresosServicio += i.precio;
      if (i.tipo_item === 'repuesto') ingresosRepuesto += i.precio;
    });
    ingresosServicio += (o.costo_revision || 0); 
  });

  const totalSplit = ingresosServicio + ingresosRepuesto;
  const pctServicio = totalSplit > 0 ? Math.round((ingresosServicio / totalSplit) * 100) : 0;
  const pctRepuesto = totalSplit > 0 ? Math.round((ingresosRepuesto / totalSplit) * 100) : 0;
  const ticketPromedio = historial.length > 0 ? Math.round(cajaTotal / historial.length) : 0;

  const ingresosPorMarca = historial.reduce((acc: any, o) => {
    const m = o.vehiculos?.marca ? o.vehiculos.marca.toUpperCase() : 'OTRO';
    const totalOrden = (o.items_orden?.reduce((s: number, i: any) => s + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0);
    acc[m] = (acc[m] || 0) + totalOrden;
    return acc;
  }, {});
  
  const topMarcas = Object.entries(ingresosPorMarca).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3) as [string, number][];

  const conteoMecanicos = historial.reduce((acc: any, o) => {
    const m = o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER';
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const topMecanicos = Object.entries(conteoMecanicos).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3) as [string, number][];

  const hoy = new Date();
  const hace5Meses = new Date();
  hace5Meses.setMonth(hoy.getMonth() - 5); 

  const oportunidadesVenta = vehiculos.filter(v => {
      const alertasPendientes = v.alertas_desgaste?.filter((a: any) => a.estado === 'Pendiente') || [];
      const alertaMadura = alertasPendientes.some((alerta: any) => {
          const fechaAlerta = new Date(alerta.created_at);
          const diasTranscurridos = (hoy.getTime() - fechaAlerta.getTime()) / (1000 * 3600 * 24);
          if (alerta.nivel_riesgo === 'Amarillo') return diasTranscurridos >= 30; 
          else if (alerta.nivel_riesgo === 'Rojo') return diasTranscurridos >= 5;  
          return false;
      });
      const ultimaOrden = historial.find(o => o.vehiculo_id === v.id);
      const muchoTiempo = ultimaOrden && new Date(ultimaOrden.created_at) < hace5Meses;
      return alertaMadura || muchoTiempo;
  });

  return { 
    session, 
    authLoading, 
    soloLectura, 
    vehiculos, 
    ordenesAbiertas, 
    historial, 
    nombreTaller, 
    configTaller, // 🔥 AHORA SE ENVÍA CORRECTAMENTE
    esOnboarding,
    cajaTotal,
    gananciasEsteMes,
    autosEsteMes,
    ticketPromedio,
    pctServicio,
    pctRepuesto,
    ingresosServicio,
    ingresosRepuesto,
    topMarcas,
    topMecanicos,
    oportunidadesVenta,
    cargarTodo 
  }
}