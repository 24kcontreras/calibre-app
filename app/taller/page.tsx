'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import toast, { Toaster } from 'react-hot-toast'
import { Wrench, AlertTriangle, Bot, Search, ClipboardList, Plus } from 'lucide-react'
import { useTaller } from '@/hooks/useTaller'
import Header from '@/components/Header'
import Recepcion from '@/components/taller/Recepcion'
import Pizarra from '@/components/taller/Pizarra'
import { Vehiculo, OrdenTrabajo, ItemOrden } from '@/hooks/types'

// 🔥 IMPORTAMOS EL NUEVO BOTTOM NAV Y TODOS TUS MODALES
import BottomNav from '@/components/taller/BottomNav'
import ModalTelemetria from '@/components/modals/ModalTelemetria'
import ModalHistorial from '@/components/modals/ModalHistorial'
import ModalConfiguracion from '@/components/modals/ModalConfiguracion'
import ModalVehiculoInfo from '@/components/modals/ModalVehiculoInfo'
import ModalEvidencia from '@/components/modals/ModalEvidencia'
import ModalItem from '@/components/modals/ModalItem'
import ModalScanner from '@/components/modals/ModalScanner'
import ModalAlerta from '@/components/modals/ModalAlerta'
import ModalMarketing from '@/components/modals/ModalMarketing'
import ModalAnalisisIA from '@/components/modals/ModalAnalisisIA'
import ModalActaRecepcion from '@/components/modals/ModalActaRecepcion'
import ModalNuevaOrden from '@/components/modals/ModalNuevaOrden'
import ModalEditarOrden from '@/components/modals/ModalEditarOrden'
import ModalManual from '@/components/modals/ModalManual'
import ModalCRM from '@/components/modals/ModalCRM' 
import ModalCotizacion from '@/components/modals/ModalCotizacion' // 🔥 Agregamos el nuevo modal
import Paywall from '@/components/Paywall'

export default function CalibreApp() {
  const router = useRouter()
  
  // 🧠 EL CEREBRO: Traemos mecanicoActivo
  const { 
    session, authLoading, soloLectura, vehiculos, ordenesAbiertas, historial, 
    nombreTaller, configTaller, esOnboarding, cajaTotal, gananciasEsteMes, 
    autosEsteMes, ticketPromedio, pctServicio, pctRepuesto, ingresosServicio, 
    ingresosRepuesto, topMarcas, topMecanicos, oportunidadesVenta, cargarTodo,
    mecanicoActivo
  } = useTaller()

  // 🔥 NUEVO ESTADO: Controla las pestañas en versión Móvil (Taller vs Recepción)
  const [vistaMecanico, setVistaMecanico] = useState<'pizarra' | 'recepcion'>('pizarra');

  // 🎛️ ESTADOS PARA MOSTRAR/OCULTAR MODALES
  const [modalNuevaOrden, setModalNuevaOrden] = useState<Vehiculo | null>(null)
  const [modalEditarOrden, setModalEditarOrden] = useState<OrdenTrabajo | null>(null)
  const [modalActa, setModalActa] = useState<OrdenTrabajo | null>(null)
  const [modalVehiculoInfo, setVehiculoInfo] = useState<Vehiculo | null>(null)
  const [modalAnalisis, setModalAnalisis] = useState<OrdenTrabajo | null>(null)
  const [modalAlerta, setModalAlerta] = useState<Vehiculo | null>(null)
  const [modalCotizacion, setModalCotizacion] = useState<Vehiculo | 'express' | null>(null) // 🔥 Estado para cotizar
  
  const [modalTelemetria, setModalTelemetria] = useState(false)
  const [modalHistorial, setModalHistorial] = useState(false)
  const [modalMarketing, setModalMarketing] = useState(false)
  const [modalScanner, setModalScanner] = useState(false)
  const [modalConfiguracion, setModalConfiguracion] = useState(false)
  const [modalManual, setModalManual] = useState(false)
  const [modalCrm, setModalCrm] = useState(false) 
  
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [modalItemVisible, setModalItemVisible] = useState(false)

  // 📝 ESTADOS DE FORMULARIOS PARA MODALES MENORES
  interface ItemForm {
    id: string | null;
    orden_id: string;
    nombre: string;
    detalle: string;
    precio: string;
    tipo_item: 'servicio' | 'repuesto';
    procedencia: string;
    inventario_id?: string | null; // 🔥 VÍNCULO CON LA BODEGA
  }

  // 🔥 CORRECCIÓN: Variables separadas correctamente
  const [itemForm, setItemForm] = useState<ItemForm>({ 
    id: null, orden_id: '', nombre: '', detalle: '', precio: '', tipo_item: 'servicio', procedencia: 'Taller', inventario_id: null 
  })  
  const [guardandoItem, setGuardandoItem] = useState(false)

  const [fotoForm, setFotoForm] = useState<{ordenId: string, file: File | null, preview: string, descripcion: string} | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  const [alertaForm, setAlertaForm] = useState({ pieza: '', nivel_riesgo: 'Amarillo', observacion: '' })
  const [guardandoAlerta, setGuardandoAlerta] = useState(false)

  const [codigoScanner, setCodigoScanner] = useState('')
  const [vehiculoScanner, setVehiculoScanner] = useState('')
  const [resultadoScanner, setResultadoScanner] = useState<Record<string, unknown> | null>(null)
  const [cargandoScanner, setCargandoScanner] = useState(false)
  const [busquedaHistorial, setBusquedaHistorial] = useState('')

  // ⚙️ ESTADOS DE CONFIGURACIÓN
  const [inputTaller, setInputTaller] = useState('')
  const [inputDireccion, setInputDireccion] = useState('')
  const [inputTelefonoConfig, setInputTelefonoConfig] = useState('')
  const [inputGarantia, setInputGarantia] = useState('')
  const [incluirIva, setIncluirIva] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false)

  // 🔥 NUEVO: SISTEMA DE ALARMA (El Reloj de Arena)
  useEffect(() => {
    if (soloLectura || ordenesAbiertas.length === 0) return;

    const revisarPromesasPendientes = () => {
        const ahora = new Date();
        
        ordenesAbiertas.forEach((orden: OrdenTrabajo) => {
            if (!orden.fecha_promesa) {
                const creacion = new Date(orden.created_at);
                const diferenciaHoras = (ahora.getTime() - creacion.getTime()) / (1000 * 60 * 60);

                if (diferenciaHoras >= 12) {
                    toast((t) => (
                        <span className="flex flex-col gap-2">
                            <b className="text-xs text-orange-400">⚠️ FECHA PENDIENTE</b>
                            <p className="text-[10px] text-slate-200">
                                El <strong className="text-white">{orden.vehiculos?.marca} {orden.vehiculos?.modelo} ({orden.vehiculos?.patente})</strong> lleva más de 12h sin fecha de entrega.
                            </p>
                            <button 
                                onClick={() => { 
                                    toast.dismiss(t.id); 
                                    setModalEditarOrden(orden); 
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg mt-1 transition-colors"
                            >
                                Definir Ahora
                            </button>
                        </span>
                    ), { duration: 8000, icon: '⏰', id: `alarma_${orden.id}` }); 
                }
            }
        });
    };

    revisarPromesasPendientes();
    const intervalo = setInterval(revisarPromesasPendientes, 1000 * 60 * 60);
    
    return () => clearInterval(intervalo);
  }, [ordenesAbiertas, soloLectura]);

  useEffect(() => {
    if (configTaller) {
        setInputTaller(configTaller.nombre_taller || 'MI TALLER')
        setInputDireccion(configTaller.direccion_taller || '')
        setInputTelefonoConfig(configTaller.telefono_taller || '')
        setInputGarantia(configTaller.garantia_taller || '')
        setIncluirIva(configTaller.incluir_iva || false)
        setLogoPreview(configTaller.logo_url || null)
        if (esOnboarding && !mecanicoActivo) setModalConfiguracion(true)
    }
  }, [configTaller, esOnboarding, mecanicoActivo])

  const guardarItemBD = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!itemForm.orden_id || guardandoItem || soloLectura) return;
      setGuardandoItem(true);
      const payload = {
        orden_id: itemForm.orden_id,
        descripcion: itemForm.tipo_item === 'repuesto' && itemForm.detalle.trim() !== '' ? `${itemForm.nombre.trim()} (${itemForm.detalle.trim()})` : itemForm.nombre.trim(),
        precio: parseInt(itemForm.precio) || 0,
        tipo_item: itemForm.tipo_item, 
        procedencia: itemForm.tipo_item === 'repuesto' ? itemForm.procedencia : 'Taller',
        inventario_id: itemForm.inventario_id || null // 🔥 ENVÍO AL TRIGGER DE INVENTARIO
      };
      try {
          if (itemForm.id) await supabase.from('items_orden').update(payload).eq('id', itemForm.id);
          else await supabase.from('items_orden').insert([payload]);
          setModalItemVisible(false); toast.success("Ítem guardado"); await cargarTodo();
      } catch (err) { toast.error("Error guardando el ítem"); } finally { setGuardandoItem(false); }
  }

  const subirFotoDefinitiva = async () => {
      if (!fotoForm || !fotoForm.file || soloLectura) return;
      setSubiendoFoto(true);
      try {
          const compressedFile = await imageCompression(fotoForm.file, { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true })
          const fileName = `${fotoForm.ordenId}/${Date.now()}_evidencia.jpg`
          const { error: sErr } = await supabase.storage.from('evidencia').upload(fileName, compressedFile)
          if (sErr) throw sErr;
          
          const { data: { publicUrl } } = supabase.storage.from('evidencia').getPublicUrl(fileName)
          await supabase.from('fotos_orden').insert([{ orden_id: fotoForm.ordenId, url: publicUrl, descripcion: fotoForm.descripcion || "Evidencia adjunta" }])
          
          setFotoForm(null); toast.success("Foto guardada"); await cargarTodo();
      } catch (err: unknown) { 
          const msg = err instanceof Error ? err.message : "Error desconocido";
          toast.error("Error subiendo foto: " + msg); 
      } finally { setSubiendoFoto(false); }
  }

  const guardarAlertaBD = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!modalAlerta || guardandoAlerta || soloLectura) return;
      setGuardandoAlerta(true);
      try {
            const tallerIdBD = mecanicoActivo ? mecanicoActivo.taller_id : session?.user?.id;
            const payload = { vehiculo_id: modalAlerta?.vehiculo_id || modalAlerta?.id, pieza: alertaForm.pieza, nivel_riesgo: alertaForm.nivel_riesgo, observacion: alertaForm.observacion, taller_id: tallerIdBD };

          const { error } = await supabase.from('alertas_desgaste').insert([payload]);
          if (error) throw error;
          toast.success("¡Alerta registrada!"); setModalAlerta(null); await cargarTodo(); 
      } catch (err: unknown) { 
          const msg = err instanceof Error ? err.message : "Error desconocido";
          toast.error("Error guardando alerta: " + msg); 
      } finally { setGuardandoAlerta(false); }
  }

  const consultarScanner = async (e: React.FormEvent, tipo: 'scanner' | 'manual') => {
    e.preventDefault(); if (!codigoScanner) return;
    setCargandoScanner(true); setResultadoScanner(null);
    try {
      const res = await fetch('/api/scanner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: codigoScanner, vehiculo: vehiculoScanner, tipo }) });
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setResultadoScanner(data);
    } catch (err: unknown) { 
        const msg = err instanceof Error ? err.message : "Error desconocido";
        toast.error("Error IA: " + msg); 
    } finally { setCargandoScanner(false); }
  }

  const guardarConfiguracion = async () => {
      if (inputTaller.trim() === '') return toast.error("El nombre del taller no puede estar vacío");
      setGuardandoConfiguracion(true); const toastId = toast.loading("Guardando ajustes...");
      
      const nombreLimpio = inputTaller.toUpperCase().trim();
  
      try {
          let logoUrl = configTaller?.logo_url || null;
          if (logoFile) {
              setSubiendoLogo(true);
            const fileName = `${session?.user?.id}/logo_${Date.now()}.png`;

              await supabase.storage.from('logos').upload(fileName, await imageCompression(logoFile, { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true }), { upsert: true });
              logoUrl = supabase.storage.from('logos').getPublicUrl(fileName).data.publicUrl;
              setSubiendoLogo(false);
          }
          
          await supabase.auth.updateUser({ 
            data: { 
                nombre_taller: nombreLimpio, 
                direccion_taller: inputDireccion, 
                telefono_taller: inputTelefonoConfig, 
                garantia_taller: inputGarantia, 
                incluir_iva: incluirIva, 
                logo_url: logoUrl 
            }
          });
  
            await supabase
              .from('talleres')
              .update({ nombre_taller: nombreLimpio })
              .eq('id', session?.user?.id);

          setLogoFile(null); 
          toast.success("¡Ajustes guardados!", { id: toastId }); 
          setModalConfiguracion(false);
          
          await cargarTodo(); 
  
      } catch (err: unknown) { 
        const msg = err instanceof Error ? err.message : "Error desconocido";
        toast.error("Error: " + msg, { id: toastId }); 
        setSubiendoLogo(false); 
      } finally { 
        setGuardandoConfiguracion(false); 
      }
  }

  const historialFiltrado = historial.filter(o => o.vehiculos?.patente.toLowerCase().includes(busquedaHistorial.toLowerCase()) || (o.vehiculos?.clientes?.nombre || '').toLowerCase().includes(busquedaHistorial.toLowerCase()))

  // --- PANTALLAS DE CARGA Y LOGIN ---
  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Wrench className="animate-spin text-emerald-500" size={64} /></div>
  
  if (!session && !mecanicoActivo) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      return null;
  }

  // 🔥 VALIDACIÓN DE SUSCRIPCIÓN
  const fechaVencimiento = configTaller?.fecha_vencimiento;
  const hoy = new Date();
  const estaVencido = fechaVencimiento && new Date(fechaVencimiento) < hoy;

  if (estaVencido) {
      return (
           <Paywall 
               tallerId={session?.user?.id || mecanicoActivo?.taller_id || ''} 
               email={session?.user?.email || ''} 
               fechaVencimiento={fechaVencimiento} 
           />
      );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans w-full mx-auto relative overflow-hidden pb-32 md:pb-6">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />

      {generandoPDF && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex flex-col items-center justify-center">
              <Bot className="animate-bounce text-emerald-400 mb-4" size={64} />
              <p className="text-emerald-400 font-black uppercase tracking-widest animate-pulse text-sm">Procesando Informe con IA...</p>
          </div>
      )}

      {/* HEADER ULTRACOMPACTO */}
      <Header 
        nombreTaller={nombreTaller} 
        logoUrl={configTaller?.logo_url}
        cajaTotal={cajaTotal} 
        onOpenTelemetria={() => setModalTelemetria(true)} 
        onOpenCRM={() => setModalCrm(true)} 
        onOpenScanner={() => setModalScanner(true)} 
        onOpenConfiguracion={() => setModalConfiguracion(true)} 
        onOpenMarketing={() => setModalMarketing(true)} 
        mecanicoActivo={mecanicoActivo}
      />

      {/* 📱 PESTAÑAS MÓVILES */}
      <div className="flex md:hidden bg-slate-900/60 p-1.5 rounded-2xl mb-6 border border-slate-800 shadow-inner">
        <button 
          onClick={() => setVistaMecanico('pizarra')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${vistaMecanico === 'pizarra' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <ClipboardList size={16} /> Taller Activo
        </button>
        <button 
          onClick={() => setVistaMecanico('recepcion')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${vistaMecanico === 'recepcion' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Search size={16} /> Base Clientes
        </button>
      </div>

      {soloLectura && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6 mx-auto w-full max-w-7xl flex items-center gap-3 z-20 relative">
              <AlertTriangle className="text-red-500 animate-pulse" size={24} />
              <div>
                  <h3 className="text-red-500 font-black uppercase tracking-widest text-sm">Modo Solo Lectura Activado</h3>
                  <p className="text-slate-400 text-xs font-bold">Tu suscripción ha finalizado. Consulta historial pero no modifiques órdenes.</p>
              </div>
          </div>
      )}

      {/* 🚀 ARQUITECTURA RESPONSIVA INTELIGENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 w-full relative z-10">
        
        {/* COLUMNA IZQUIERDA */}
        <div className={`lg:col-span-1 ${vistaMecanico === 'recepcion' ? 'block' : 'hidden md:block'}`}>
            <Recepcion 
              soloLectura={soloLectura} 
              vehiculos={vehiculos} 
              session={session} 
              cargarTodo={cargarTodo} 
              abrirOrdenModal={(v) => setModalNuevaOrden(v)} 
              nombreTaller={nombreTaller} 
              abrirInfoModal={(v) => setVehiculoInfo(v)} 
              abrirModalCotizacion={(v) => setModalCotizacion(v)}
            />
        </div>
        
        {/* COLUMNA DERECHA (PIZARRA KANBAN) */}
        <div className={`lg:col-span-3 flex flex-col gap-6 ${vistaMecanico === 'pizarra' ? 'block' : 'hidden md:block'}`}>
            <Pizarra 
              ordenesAbiertas={ordenesAbiertas} 
              soloLectura={soloLectura} 
              nombreTaller={nombreTaller} 
              session={session} 
              cargarTodo={cargarTodo} 
              setGenerandoPDF={setGenerandoPDF} 
              abrirModalActa={setModalActa} 
              abrirModalEvidencia={(id: string) => setFotoForm({ordenId: id, file: null, preview: '', descripcion: ''})} 
              abrirModalEditar={(orden: OrdenTrabajo) => setModalEditarOrden(orden)} 
              abrirModalItem={(id: string, item?: ItemOrden) => { 
                  setItemForm(item ? { id: item.id, orden_id: id, nombre: item.descripcion, detalle: '', precio: item.precio.toString(), tipo_item: item.tipo_item, procedencia: item.procedencia || 'Taller', inventario_id: item.inventario_id || null } : { id: null, orden_id: id, nombre: '', detalle: '', precio: '', tipo_item: 'servicio', procedencia: 'Taller', inventario_id: null }); 
                  setModalItemVisible(true); 
              }}
              mecanicoActivo={mecanicoActivo} 
            />
        </div>
      </div>

      {vistaMecanico === 'pizarra' && (
        <button 
          onClick={() => setVistaMecanico('recepcion')}
          className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center z-40 hover:bg-blue-500 transition-all active:scale-95"
          title="Buscar o Añadir Vehículo"
        >
          <Plus size={28} />
        </button>
      )}

      {/* 🔥 NUEVO BOTTOM NAVIGATION BAR */}
      <BottomNav 
          mecanicoActivo={mecanicoActivo}
          onOpenScanner={() => setModalScanner(true)}
          onOpenTelemetria={() => setModalTelemetria(true)}
          onOpenCRM={() => setModalCrm(true)}
          onOpenMarketing={() => setModalMarketing(true)}
          onOpenConfiguracion={() => setModalConfiguracion(true)}
      />

      {/* --- RENDERIZADO DE MODALES --- */}
      {modalCotizacion && (
          <ModalCotizacion 
              vehiculo={modalCotizacion !== 'express' ? modalCotizacion : null} 
              esExpress={modalCotizacion === 'express'}
              tallerId={session?.user?.id || mecanicoActivo?.taller_id || ''} 
              nombreTaller={nombreTaller} 
              onClose={() => setModalCotizacion(null)} 
              cargarTodo={cargarTodo} 
          />
      )}
      
      {/* 🔥 ACÁ VUELVE A ESTAR EL MODAL DE ORDEN QUE SE HABÍA BORRADO */}
      {modalNuevaOrden && <ModalNuevaOrden vehiculo={modalNuevaOrden} soloLectura={soloLectura} session={session} cargarTodo={cargarTodo} onClose={() => setModalNuevaOrden(null)} />}
      
      {modalEditarOrden && <ModalEditarOrden orden={modalEditarOrden} soloLectura={soloLectura} cargarTodo={cargarTodo} onClose={() => setModalEditarOrden(null)} />}
      {modalActa && <ModalActaRecepcion orden={modalActa} onClose={() => setModalActa(null)} />}
      {modalAlerta && <ModalAlerta alertaForm={alertaForm} setAlertaForm={setAlertaForm} guardarAlertaBD={guardarAlertaBD} guardandoAlerta={guardandoAlerta} onClose={() => setModalAlerta(null)} ordenActiva={modalAlerta} resolverAlertaBD={async (id: string) => { await supabase.from('alertas_desgaste').update({ estado: 'Resuelta' }).eq('id', id); toast.success("Alerta resuelta!"); await cargarTodo(); setModalAlerta(null); }} />}
      
      {modalTelemetria && <ModalTelemetria onClose={() => setModalTelemetria(false)} gananciasEsteMes={gananciasEsteMes} autosEsteMes={autosEsteMes} ticketPromedio={ticketPromedio} pctServicio={pctServicio} pctRepuesto={pctRepuesto} ingresosServicio={ingresosServicio} ingresosRepuesto={ingresosRepuesto} topMarcas={topMarcas} topMecanicos={topMecanicos} historial={historial} oportunidades={oportunidadesVenta} nombreTaller={nombreTaller} />}      
      {modalHistorial && <ModalHistorial onClose={() => setModalHistorial(false)} busquedaHistorial={busquedaHistorial} setBusquedaHistorial={setBusquedaHistorial} historialFiltrado={historialFiltrado} configPDF={{ nombreTaller, direccion: configTaller?.direccion_taller || '', telefono: configTaller?.telefono_taller || '', garantia: configTaller?.garantia_taller || '', logoUrl: configTaller?.logo_url || null, incluirIva: configTaller?.incluir_iva || false }} />}
      {modalCrm && <ModalCRM onClose={() => setModalCrm(false)} oportunidades={oportunidadesVenta} nombreTaller={nombreTaller} />}
      {modalManual && <ModalManual onClose={() => setModalManual(false)} />}
       
      {modalConfiguracion && <ModalConfiguracion 
         onClose={() => setModalConfiguracion(false)} 
         onOpenManual={() => setModalManual(true)}
         inputTaller={inputTaller} 
         setInputTaller={setInputTaller} 
         guardarConfiguracion={guardarConfiguracion} 
         guardandoConfiguracion={guardandoConfiguracion} 
         handleLogout={async () => { 
            localStorage.removeItem('calibre_mecanico_session');
            document.cookie = "calibre_mecanico_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            await supabase.auth.signOut(); 
            router.push('/login'); 
         }} 
         inputDireccion={inputDireccion} 
         setInputDireccion={setInputDireccion} 
         inputTelefono={inputTelefonoConfig} 
         setInputTelefono={setInputTelefonoConfig} 
         logoPreview={logoPreview} 
         handleLogoChange={(e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if(f) { setLogoPreview(URL.createObjectURL(f)); setLogoFile(f); } }} 
         subiendoLogo={subiendoLogo} 
         inputGarantia={inputGarantia} 
         setInputGarantia={setInputGarantia} 
         incluirIva={incluirIva} 
         setIncluirIva={setIncluirIva} 
         esOnboarding={esOnboarding} 
         vehiculos={vehiculos} 
         fechaVencimiento={configTaller?.fecha_vencimiento ?? undefined}
         tallerId={session?.user?.id || mecanicoActivo?.taller_id || ''}
         email={session?.user?.email || ''}
      />}

      {modalVehiculoInfo && <ModalVehiculoInfo vehiculoInfo={modalVehiculoInfo} onClose={() => setVehiculoInfo(null)} reCargarGlobal={cargarTodo} />}
      
      {fotoForm && <ModalEvidencia fotoForm={fotoForm} setFotoForm={setFotoForm} handleSeleccionarFoto={(e: React.ChangeEvent<HTMLInputElement>) => { 
           if (!e.target.files) return;
           const f = e.target.files[0]; 
           if(f) setFotoForm(prev => prev ? { ...prev, file: f, preview: URL.createObjectURL(f) } : null); 
       }} subirFotoDefinitiva={subirFotoDefinitiva} subiendoFoto={subiendoFoto} />}

      {modalItemVisible && <ModalItem itemForm={itemForm} setItemForm={setItemForm} guardarItemBD={guardarItemBD} guardandoItem={guardandoItem} onClose={() => setModalItemVisible(false)} />}
      {modalScanner && <ModalScanner onClose={() => setModalScanner(false)} codigoScanner={codigoScanner} setCodigoScanner={setCodigoScanner} vehiculoScanner={vehiculoScanner} setVehiculoScanner={setVehiculoScanner} consultarScanner={consultarScanner} cargandoScanner={cargandoScanner} resultadoScanner={resultadoScanner} setResultadoScanner={setResultadoScanner} />}
      {modalMarketing && <ModalMarketing onClose={() => setModalMarketing(false)} vehiculos={vehiculos} historial={historial} nombreTaller={nombreTaller} />}
      {modalAnalisis && <ModalAnalisisIA orden={modalAnalisis} onClose={() => setModalAnalisis(null)} />}
    </main>
  )
}