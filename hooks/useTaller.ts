'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Session } from '@supabase/supabase-js'
import { 
  Vehiculo, 
  OrdenTrabajo, 
  TallerConfig, 
  ItemOrden, 
  AlertaDesgaste 
} from './types'

export const useTaller = () => {
  const [session, setSession] = useState<Session | null>(null)
  
  // 🔥 NUEVO: Estado para saber si estamos en Modo Trinchera
  const [mecanicoActivo, setMecanicoActivo] = useState<any | null>(null)
  
  const [authLoading, setAuthLoading] = useState(true)
  const [soloLectura, setSoloLectura] = useState(false)
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [ordenesAbiertas, setOrdenesAbiertas] = useState<OrdenTrabajo[]>([])
  const [historial, setHistorial] = useState<OrdenTrabajo[]>([])
  const [nombreTaller, setNombreTaller] = useState('MI TALLER')
  const [configTaller, setConfigTaller] = useState<TallerConfig | null>(null)
  const [esOnboarding, setEsOnboarding] = useState(false)

  const extraerDatosConfiguracionAuth = (metadata: Record<string, any>) => {
       if (!metadata || !metadata.nombre_taller) {
           setNombreTaller('MI TALLER');
           setEsOnboarding(true);
           return;
       }
       setEsOnboarding(false); 
   };

   const cargarTodo = async (tId?: string) => {
     // Aquí usamos el ID del dueño, o el ID del taller al que pertenece el mecánico
     const currentTallerId = tId || session?.user?.id || mecanicoActivo?.taller_id;
     if (!currentTallerId) return;

     // 1. Datos del Taller
     const { data: tData } = await supabase.from('talleres').select('*').eq('id', currentTallerId).single();
     if (tData) {
         setConfigTaller((prev: TallerConfig | null) => ({ ...prev, ...tData }));
         if (tData.nombre_taller) setNombreTaller(tData.nombre_taller);

        const vencido = tData.fecha_vencimiento ? new Date(tData.fecha_vencimiento) < new Date() : false;
        setSoloLectura(!tData.pago_confirmado || vencido);
    }

    // 2. Vehículos
    const { data: vData } = await supabase.from('vehiculos')
      .select('*, clientes(*), alertas_desgaste(*)') 
      .eq('taller_id', currentTallerId)
      .order('created_at', { ascending: false })
    setVehiculos(vData || [])

    // 3. Órdenes Activas
    const { data: oAbiertas, error: errAbiertas } = await supabase.from('ordenes_trabajo')
      .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*), comentarios_orden(*)') 
      .eq('vehiculos.taller_id', currentTallerId)
      .neq('estado', 'Finalizada')
      .order('created_at', { ascending: false })
    
    if (errAbiertas) toast.error(`Error al cargar pizarra: ${errAbiertas.message}`);
    setOrdenesAbiertas(oAbiertas || [])

    // 4. Historial
    const { data: oFinalizadas, error: errFinalizadas } = await supabase.from('ordenes_trabajo')
      .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*), comentarios_orden(*)') 
      .eq('vehiculos.taller_id', currentTallerId)
      .eq('estado', 'Finalizada')
      .order('updated_at', { ascending: false })
      
    if (errFinalizadas) toast.error(`Error al cargar historial: ${errFinalizadas.message}`);
    setHistorial(oFinalizadas || [])
  }

  useEffect(() => {
    let isMounted = true; 

    const checkSession = async () => {
      try {
        // Primero intentamos buscar la sesión maestra (Del Dueño)
        const { data, error } = await supabase.auth.getSession();
        
        // Si hay un error real de red, lo lanzamos. 
        // Si simplemente no hay sesión, error suele ser null y data.session es null.
        if (error) throw error;
        
        const currentSession = data?.session;
        
        if (isMounted) {
            if (currentSession?.user?.id) {
                // 🟢 ES EL DUEÑO
                setSession(currentSession);
                extraerDatosConfiguracionAuth(currentSession.user.user_metadata);
                await cargarTodo(currentSession.user.id);
            } else {
                // 🔵 NO ES EL DUEÑO. Vamos a revisar si tiene un gafete de mecánico en el bolsillo.
                const credencial = localStorage.getItem('calibre_mecanico_session');
                if (credencial) {
                    const mecanico = JSON.parse(credencial);
                    // Comprobación de seguridad: vemos si no lo han desactivado en la BD
                    const { data: mecDB } = await supabase.from('mecanicos').select('activo').eq('id', mecanico.id).single();
                    
                    if (mecDB && mecDB.activo) {
                        // El mecánico es válido y activo
                        setMecanicoActivo(mecanico);
                        // Truco para que la app no pida login general (fingimos una pseudo-sesión)
                        setSession({ user: { id: 'mecanico' } } as any); 
                        await cargarTodo(mecanico.taller_id);
                    } else {
                        // Lo echaron o desactivaron, quemamos el gafete
                        localStorage.removeItem('calibre_mecanico_session');
                        toast.error('Tu acceso ha sido revocado.');
                    }
                }
            }
        }
      } catch (err: any) { 
        toast.error("Error crítico de autenticación. Por favor, reinicie la sesión.");
        console.error("Error crítico de Auth:", err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
       if (isMounted) {
           if (currentSession?.user?.id) {
               setSession(currentSession);
               extraerDatosConfiguracionAuth(currentSession.user.user_metadata);
               cargarTodo(currentSession.user.id);
           } else {
               // Si se cierra la sesión principal, pero hay un mecánico, no borramos su estado
               const credencial = localStorage.getItem('calibre_mecanico_session');
               if (!credencial) {
                   setSession(null);
               }
           }
       }
    }) as any;

    return () => {
        isMounted = false;
        authListener?.subscription?.unsubscribe();
    }
  }, [])

  // ... (El resto de tus useEffects de canales de Supabase y cálculos matemáticos quedan EXACTAMENTE igual) ...
  useEffect(() => {
    if (!session?.user?.id && !mecanicoActivo) return;

    // ... (Tu código del canal 'taller_notificaciones' intacto)
    const channel = supabase.channel('taller_notificaciones')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ordenes_trabajo'
        },
        (payload: any) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;

          if (oldRecord.sub_estado === 'Pendiente Aprobación' && newRecord.sub_estado === 'Esperando Repuestos') {
              toast.success(`¡Caja Asegurada! 💰 Presupuesto Aprobado.`, {
                  duration: 6000, icon: '🔥',
                  style: { background: '#022c22', color: '#34d399', border: '1px solid #059669', fontSize: '14px', fontWeight: 'bold' }
              });
              cargarTodo(); 
          }

          if ((oldRecord.feedback_final_estrellas === null && newRecord.feedback_final_estrellas > 0) || 
              (oldRecord.feedback_final_estrellas === 0 && (newRecord.feedback_final_estrellas ?? 0) > 0)) {
              toast(`¡Un cliente te calificó con ${newRecord.feedback_final_estrellas ?? 0} Estrellas! ⭐`, {
                  duration: 6000, icon: '⭐',
                  style: { background: '#422006', color: '#facc15', border: '1px solid #ca8a04', fontSize: '14px', fontWeight: 'bold' }
              });
              cargarTodo(); 
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, mecanicoActivo]);



  // 🔥 CÁLCULOS DERIVADOS (Telemetría, Finanzas y Oportunidades)
  const cajaTotal = historial.reduce((acc, o) => acc + (o.items_orden?.reduce((s: number, i: ItemOrden) => s + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0), 0)

  let ingresosServicio = 0;
  let ingresosRepuesto = 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const ordenesEsteMes = historial.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const gananciasEsteMes = ordenesEsteMes.reduce((acc, o) => 
      acc + (o.items_orden?.reduce((s: number, i: ItemOrden) => s + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0)
  , 0);

  const autosEsteMes = ordenesEsteMes.length;

  historial.forEach(o => {
    o.items_orden?.forEach((i: ItemOrden) => {
      if (i.tipo_item === 'servicio') ingresosServicio += i.precio;
      if (i.tipo_item === 'repuesto') ingresosRepuesto += i.precio;
    });
    ingresosServicio += (o.costo_revision || 0); 
  });

  const totalSplit = ingresosServicio + ingresosRepuesto;
  const pctServicio = totalSplit > 0 ? Math.round((ingresosServicio / totalSplit) * 100) : 0;
  const pctRepuesto = totalSplit > 0 ? Math.round((ingresosRepuesto / totalSplit) * 100) : 0;
  const ticketPromedio = historial.length > 0 ? Math.round(cajaTotal / historial.length) : 0;

  const ingresosPorMarca = historial.reduce((acc: Record<string, number>, o) => {
    const m = o.vehiculos?.marca ? o.vehiculos.marca.toUpperCase() : 'OTRO';
    const totalOrden = (o.items_orden?.reduce((s: number, i: ItemOrden) => s + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0);
    acc[m] = (acc[m] || 0) + totalOrden;
    return acc;
  }, {});
  
  const topMarcas = Object.entries(ingresosPorMarca).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).slice(0, 3) as [string, number][];

  const conteoMecanicos = historial.reduce((acc: Record<string, number>, o) => {
    const m = o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER';
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const topMecanicos = Object.entries(conteoMecanicos).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).slice(0, 3) as [string, number][];

  const hoy = new Date();
  const hace5Meses = new Date();
  hace5Meses.setMonth(hoy.getMonth() - 5); 

  const oportunidadesVenta = vehiculos.filter(v => {
      const alertasPendientes = v.alertas_desgaste?.filter((a: AlertaDesgaste) => a.estado === 'Pendiente') || [];
      const alertaMadura = alertasPendientes.some((alerta: AlertaDesgaste) => {
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
    configTaller, 
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
    cargarTodo,
    mecanicoActivo // 👈 EXPONEMOS ESTO PARA QUE LA PIZARRA LO USE
  }
}