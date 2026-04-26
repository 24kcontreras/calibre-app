'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import toast, { Toaster } from 'react-hot-toast'
import { Wrench, AlertTriangle, Bot } from 'lucide-react'

// 🔥 1. IMPORTAMOS TUS NUEVOS MÓDULOS LIMPIOS
import { useTaller } from '@/hooks/useTaller'
import Login from '@/components/Login'
import Header from '@/components/Header'
import Recepcion from '@/components/taller/Recepcion'
import Pizarra from '@/components/taller/Pizarra'

// 🔥 2. IMPORTAMOS TODOS TUS MODALES
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

export default function CalibreApp() {
  const router = useRouter()
  
  // 🧠 EL CEREBRO: Trae todos los datos procesados desde tu nuevo Hook
  const { 
    session, authLoading, soloLectura, vehiculos, ordenesAbiertas, historial, 
    nombreTaller, configTaller, esOnboarding, cajaTotal, gananciasEsteMes, 
    autosEsteMes, ticketPromedio, pctServicio, pctRepuesto, ingresosServicio, 
    ingresosRepuesto, topMarcas, topMecanicos, oportunidadesVenta, cargarTodo 
  } = useTaller()

  // 🎛️ ESTADOS PARA MOSTRAR/OCULTAR MODALES
  const [modalNuevaOrden, setModalNuevaOrden] = useState<any | null>(null)
  const [modalEditarOrden, setModalEditarOrden] = useState<any | null>(null)
  const [modalActa, setModalActa] = useState<any | null>(null)
  const [modalVehiculoInfo, setVehiculoInfo] = useState<any | null>(null)
  const [modalAnalisis, setModalAnalisis] = useState<any | null>(null)
  const [modalAlerta, setModalAlerta] = useState<any | null>(null)
  
  const [modalTelemetria, setModalTelemetria] = useState(false)
  const [modalHistorial, setModalHistorial] = useState(false)
  const [modalMarketing, setModalMarketing] = useState(false)
  const [modalScanner, setModalScanner] = useState(false)
  const [modalConfiguracion, setModalConfiguracion] = useState(false)
  
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [modalItemVisible, setModalItemVisible] = useState(false)

  // 📝 ESTADOS DE FORMULARIOS PARA MODALES MENORES
  const [itemForm, setItemForm] = useState({ id: null, orden_id: '', nombre: '', detalle: '', precio: '', tipo_item: 'servicio', procedencia: 'Taller' })  
  const [guardandoItem, setGuardandoItem] = useState(false)

  const [fotoForm, setFotoForm] = useState<{ordenId: string, file: File | null, preview: string, descripcion: string} | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  const [alertaForm, setAlertaForm] = useState({ pieza: '', nivel_riesgo: 'Amarillo', observacion: '' })
  const [guardandoAlerta, setGuardandoAlerta] = useState(false)

  const [codigoScanner, setCodigoScanner] = useState('')
  const [vehiculoScanner, setVehiculoScanner] = useState('')
  const [resultadoScanner, setResultadoScanner] = useState<any>(null)
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

  // Sincronizar datos de configuración cuando carguen
  useEffect(() => {
    if (configTaller) {
        setInputTaller(configTaller.nombre_taller || 'MI TALLER')
        setInputDireccion(configTaller.direccion_taller || '')
        setInputTelefonoConfig(configTaller.telefono_taller || '')
        setInputGarantia(configTaller.garantia_taller || '')
        setIncluirIva(configTaller.incluir_iva || false)
        setLogoPreview(configTaller.logo_url || null)
        if (esOnboarding) setModalConfiguracion(true)
    }
  }, [configTaller, esOnboarding])

  // --- FUNCIONES RÁPIDAS PARA MODALES MENORES ---
  const guardarItemBD = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!itemForm.orden_id || guardandoItem || soloLectura) return;
      setGuardandoItem(true);
      const payload = {
        orden_id: itemForm.orden_id,
        descripcion: itemForm.tipo_item === 'repuesto' && itemForm.detalle.trim() !== '' ? `${itemForm.nombre.trim()} (${itemForm.detalle.trim()})` : itemForm.nombre.trim(),
        precio: parseInt(itemForm.precio) || 0,
        tipo_item: itemForm.tipo_item, procedencia: itemForm.tipo_item === 'repuesto' ? itemForm.procedencia : 'Taller'
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
      } catch (err: any) { toast.error("Error subiendo foto: " + err.message); } finally { setSubiendoFoto(false); }
  }

  const guardarAlertaBD = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!modalAlerta || guardandoAlerta || soloLectura) return;
      setGuardandoAlerta(true);
      try {
          const payload = { vehiculo_id: modalAlerta.vehiculo_id || modalAlerta.id, pieza: alertaForm.pieza, nivel_riesgo: alertaForm.nivel_riesgo, observacion: alertaForm.observacion, taller_id: session?.user?.id };
          const { error } = await supabase.from('alertas_desgaste').insert([payload]);
          if (error) throw error;
          toast.success("¡Alerta registrada!"); setModalAlerta(null); await cargarTodo(); 
      } catch (err: any) { toast.error("Error guardando alerta"); } finally { setGuardandoAlerta(false); }
  }

  const consultarScanner = async (e: React.FormEvent, tipo: 'scanner' | 'manual') => {
    e.preventDefault(); if (!codigoScanner) return;
    setCargandoScanner(true); setResultadoScanner(null);
    try {
      const res = await fetch('/api/scanner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: codigoScanner, vehiculo: vehiculoScanner, tipo }) });
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setResultadoScanner(data);
    } catch (err: any) { toast.error("Error IA: " + err.message); } finally { setCargandoScanner(false); }
  }

  const guardarConfiguracion = async () => {
      if (inputTaller.trim() === '') return toast.error("El nombre del taller no puede estar vacío");
      setGuardandoConfiguracion(true); const toastId = toast.loading("Guardando ajustes...");
      
      const nombreLimpio = inputTaller.toUpperCase().trim();

      try {
          let logoUrl = configTaller?.logo_url || null;
          if (logoFile) {
              setSubiendoLogo(true);
              const fileName = `${session.user.id}/logo_${Date.now()}.png`;
              await supabase.storage.from('logos').upload(fileName, await imageCompression(logoFile, { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true }), { upsert: true });
              logoUrl = supabase.storage.from('logos').getPublicUrl(fileName).data.publicUrl;
              setSubiendoLogo(false);
          }
          
          // 1. Guardar en la Sesión (Auth)
          await supabase.auth.updateUser({ 
            data: { nombre_taller: nombreLimpio, direccion_taller: inputDireccion, telefono_taller: inputTelefonoConfig, garantia_taller: inputGarantia, incluir_iva: incluirIva, logo_url: logoUrl }
          });

          // 2. 🔥 Sincronizar con la tabla pública 'talleres' para el God Mode
          await supabase
            .from('talleres')
            .update({ nombre_taller: nombreLimpio })
            .eq('id', session.user.id);

          setLogoFile(null); 
          toast.success("¡Ajustes guardados!", { id: toastId }); 
          setModalConfiguracion(false);
          
          await cargarTodo(); // Forzamos recarga visual

      } catch (err: any) { 
        toast.error("Error: " + err.message, { id: toastId }); 
        setSubiendoLogo(false); 
      } finally { 
        setGuardandoConfiguracion(false); 
      }
  }

  const historialFiltrado = historial.filter(o => o.vehiculos?.patente.toLowerCase().includes(busquedaHistorial.toLowerCase()) || (o.vehiculos?.clientes?.nombre || '').toLowerCase().includes(busquedaHistorial.toLowerCase()))

  // --- PANTALLAS DE CARGA Y LOGIN ---
  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Wrench className="animate-spin text-emerald-500" size={64} /></div>
  
  // 🔥 Si no hay sesión, mostramos el Login. Más adelante, aquí pondremos la Landing Page Comercial.
  if (!session) return <Login />

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans w-full mx-auto relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />

      {generandoPDF && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex flex-col items-center justify-center">
              <Bot className="animate-bounce text-emerald-400 mb-4" size={64} />
              <p className="text-emerald-400 font-black uppercase tracking-widest animate-pulse text-sm">Procesando Informe con IA...</p>
          </div>
      )}

      <Header nombreTaller={nombreTaller} cajaTotal={cajaTotal} onOpenTelemetria={() => setModalTelemetria(true)} onOpenScanner={() => setModalScanner(true)} onOpenConfiguracion={() => setModalConfiguracion(true)} onOpenMarketing={() => setModalMarketing(true)} />

      {soloLectura && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6 mx-auto w-full max-w-7xl flex items-center gap-3 z-20 relative">
              <AlertTriangle className="text-red-500 animate-pulse" size={24} />
              <div>
                  <h3 className="text-red-500 font-black uppercase tracking-widest text-sm">Modo Solo Lectura Activado</h3>
                  <p className="text-slate-400 text-xs font-bold">Tu suscripción ha finalizado. Consulta historial pero no modifiques órdenes.</p>
              </div>
          </div>
      )}

      {/* 🚀 LA NUEVA ARQUITECTURA LIMPIA: RECEPCIÓN + PIZARRA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 w-full relative z-10">
        
        {/* COLUMNA IZQUIERDA (RECEPCIÓN Y BUSCADOR) */}
        <div className="lg:col-span-1">
           <Recepcion 
             soloLectura={soloLectura} 
             vehiculos={vehiculos} 
             oportunidadesVenta={oportunidadesVenta} 
             session={session} 
             cargarTodo={cargarTodo} 
             abrirOrdenModal={(v: any) => setModalNuevaOrden(v)} 
             nombreTaller={nombreTaller} 
             abrirInfoModal={(v: any) => setVehiculoInfo(v)} // 🔥 AQUÍ CONECTAMOS EL BOTÓN INFO
           />
        </div>
        
        {/* COLUMNA DERECHA (PIZARRA KANBAN) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           <Pizarra 
             ordenesAbiertas={ordenesAbiertas} 
             soloLectura={soloLectura} 
             nombreTaller={nombreTaller} 
             session={session} 
             cargarTodo={cargarTodo} 
             setGenerandoPDF={setGenerandoPDF} 
             abrirModalActa={setModalActa} 
             abrirModalEvidencia={(id: any) => setFotoForm({ordenId: id, file: null, preview: '', descripcion: ''})} 
             abrirModalEditar={(orden: any) => setModalEditarOrden(orden)} 
             abrirModalItem={(id: any, item: any) => { 
                setItemForm(item ? { id: item.id, orden_id: id, nombre: item.descripcion, detalle: '', precio: item.precio.toString(), tipo_item: item.tipo_item, procedencia: item.procedencia } : { id: null, orden_id: id, nombre: '', detalle: '', precio: '', tipo_item: 'servicio', procedencia: 'Taller' }); 
                setModalItemVisible(true); 
             }} 
           />
        </div>
      </div>

      {/* --- RENDERIZADO DE MODALES (CAPA FLOTANTE) --- */}
      {modalNuevaOrden && <ModalNuevaOrden vehiculo={modalNuevaOrden} soloLectura={soloLectura} session={session} cargarTodo={cargarTodo} onClose={() => setModalNuevaOrden(null)} />}
      {modalEditarOrden && <ModalEditarOrden orden={modalEditarOrden} soloLectura={soloLectura} cargarTodo={cargarTodo} onClose={() => setModalEditarOrden(null)} />}
      {modalActa && <ModalActaRecepcion orden={modalActa} onClose={() => setModalActa(null)} />}
      {modalAlerta && <ModalAlerta alertaForm={alertaForm} setAlertaForm={setAlertaForm} guardarAlertaBD={guardarAlertaBD} guardandoAlerta={guardandoAlerta} onClose={() => setModalAlerta(null)} ordenActiva={modalAlerta} resolverAlertaBD={async (id: string) => { await supabase.from('alertas_desgaste').update({ estado: 'Resuelta' }).eq('id', id); toast.success("Alerta resuelta!"); await cargarTodo(); setModalAlerta(null); }} />}
      {modalTelemetria && <ModalTelemetria onClose={() => setModalTelemetria(false)} gananciasEsteMes={gananciasEsteMes} autosEsteMes={autosEsteMes} ticketPromedio={ticketPromedio} pctServicio={pctServicio} pctRepuesto={pctRepuesto} ingresosServicio={ingresosServicio} ingresosRepuesto={ingresosRepuesto} topMarcas={topMarcas} topMecanicos={topMecanicos} historial={historial} />}
      {modalHistorial && <ModalHistorial onClose={() => setModalHistorial(false)} busquedaHistorial={busquedaHistorial} setBusquedaHistorial={setBusquedaHistorial} historialFiltrado={historialFiltrado} configPDF={{ nombreTaller, direccion: configTaller?.direccion_taller || '', telefono: configTaller?.telefono_taller || '', garantia: configTaller?.garantia_taller || '', logoUrl: configTaller?.logo_url || null, incluirIva: configTaller?.incluir_iva || false }} />}
      {modalConfiguracion && <ModalConfiguracion onClose={() => setModalConfiguracion(false)} inputTaller={inputTaller} setInputTaller={setInputTaller} guardarConfiguracion={guardarConfiguracion} guardandoConfiguracion={guardandoConfiguracion} handleLogout={async () => { await supabase.auth.signOut(); router.push('/'); }} inputDireccion={inputDireccion} setInputDireccion={setInputDireccion} inputTelefono={inputTelefonoConfig} setInputTelefono={setInputTelefonoConfig} logoPreview={logoPreview} handleLogoChange={(e: any) => { const f = e.target.files?.[0]; if(f) { setLogoPreview(URL.createObjectURL(f)); setLogoFile(f); } }} subiendoLogo={subiendoLogo} inputGarantia={inputGarantia} setInputGarantia={setInputGarantia} incluirIva={incluirIva} setIncluirIva={setIncluirIva} esOnboarding={esOnboarding} vehiculos={vehiculos} />}
      
      {/* 🔥 MODAL DE INFO DEL VEHÍCULO */}
      {modalVehiculoInfo && <ModalVehiculoInfo vehiculoInfo={modalVehiculoInfo} onClose={() => setVehiculoInfo(null)} reCargarGlobal={cargarTodo} />}
      
      {fotoForm && <ModalEvidencia fotoForm={fotoForm} setFotoForm={setFotoForm} handleSeleccionarFoto={(e: any) => { const f = e.target.files[0]; if(f) setFotoForm(prev => prev ? { ...prev, file: f, preview: URL.createObjectURL(f) } : null); }} subirFotoDefinitiva={subirFotoDefinitiva} subiendoFoto={subiendoFoto} />}
      {modalItemVisible && <ModalItem itemForm={itemForm} setItemForm={setItemForm} guardarItemBD={guardarItemBD} guardandoItem={guardandoItem} onClose={() => setModalItemVisible(false)} />}
      {modalScanner && <ModalScanner onClose={() => setModalScanner(false)} codigoScanner={codigoScanner} setCodigoScanner={setCodigoScanner} vehiculoScanner={vehiculoScanner} setVehiculoScanner={setVehiculoScanner} consultarScanner={consultarScanner} cargandoScanner={cargandoScanner} resultadoScanner={resultadoScanner} setResultadoScanner={setResultadoScanner} />}
      {modalMarketing && <ModalMarketing onClose={() => setModalMarketing(false)} vehiculos={vehiculos} historial={historial} nombreTaller={nombreTaller} />}
      {modalAnalisis && <ModalAnalisisIA orden={modalAnalisis} onClose={() => setModalAnalisis(null)} />}
    </main>
  )
}