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

// 🔥 Importamos la acción del servidor
import { fetchInitialTallerData } from '@/app/taller/actions'

export const useTaller = () => {
  const [session, setSession] = useState<Session | null>(null)
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

  // 🔥 AQUÍ ESTÁ LA MAGIA DEL SERVER ACTION
  const cargarTodo = async (tId?: string) => {
    const currentTallerId = tId || session?.user?.id || mecanicoActivo?.taller_id;
    if (!currentTallerId) return;

    try {
      const response = await fetchInitialTallerData(currentTallerId);

      if (response.success && response.data) {
        const { configTaller: tData, vehiculos: vData, ordenesAbiertas: oAbiertas, historial: oFinalizadas, soloLectura: sLectura } = response.data;
        
        if (tData) {
          setConfigTaller(prev => ({ ...prev, ...tData }));
          if (tData.nombre_taller) setNombreTaller(tData.nombre_taller);
        }
        
        setSoloLectura(sLectura);
        setVehiculos(vData);
        setOrdenesAbiertas(oAbiertas);
        setHistorial(oFinalizadas);
      } else {
         toast.error(`Error al sincronizar datos: ${response.error}`);
      }
    } catch (err) {
      console.error("Error al cargar datos del servidor:", err);
      toast.error("Hubo un problema de conexión al cargar tu taller.");
    }
  }

  useEffect(() => {
    let isMounted = true; 

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        const currentSession = data?.session;
        
        if (isMounted) {
            if (currentSession?.user?.id) {
                // 🟢 ES EL DUEÑO
                setSession(currentSession);
                extraerDatosConfiguracionAuth(currentSession.user.user_metadata);
                await cargarTodo(currentSession.user.id);
            } else {
                // 🔵 NO ES EL DUEÑO. Revisamos el pase de Mecánico
                const credencial = localStorage.getItem('calibre_mecanico_session');
                if (credencial) {
                    const mecanico = JSON.parse(credencial);
                    
                    const { data: mecDB } = await supabase.from('mecanicos').select('activo').eq('id', mecanico.id).maybeSingle();
                    
                    if (!mecDB || mecDB.activo !== false) {
                        setMecanicoActivo(mecanico);
                        setSession({ user: { id: 'mecanico' } } as any); 
                        await cargarTodo(mecanico.taller_id);
                    } else {
                        localStorage.removeItem('calibre_mecanico_session');
                        document.cookie = "calibre_mecanico_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                        toast.error('Tu acceso ha sido revocado.');
                    }
                }
            }
        }
      } catch (err: any) { 
        toast.error("Error crítico de autenticación. Por favor, reinicie la sesión.");
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

  useEffect(() => {
    if (!session?.user?.id && !mecanicoActivo) return;

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

  // 🔥 CÁLCULOS DERIVADOS (Permanecen en el cliente porque son transformaciones ligeras en tiempo real)
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
    mecanicoActivo 
  }
}