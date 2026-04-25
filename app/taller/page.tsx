'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import Login from '@/components/Login'
import CAR_DATA from './autos.json'
import { Edit2, Lightbulb ,Trash2, FileText, Clock, User, CheckCircle, Search, Bot, Plus, Wrench, ChevronRight, Info, MessageSquare, Mic, AlertTriangle, Megaphone, Settings, ChevronDown, Camera, Share2, Circle, CheckCircle2, X, ClipboardList, BatteryWarning, Droplets, AlertCircle, Send, PhoneForwarded, Car, Thermometer, CircleDot, LifeBuoy, Zap, Wind, Activity } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

// 🚀 COMPONENTES EXTERNOS
import Header from '@/components/Header'
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
import { generarDocumentoPDF } from '@/utils/pdfGenerator'
import Car3DViewer from '@/components/Car3DViewer'


const MARCAS = Object.keys(CAR_DATA).sort();

const COLOR_ESTADO: Record<string, string> = {
  'Diagnóstico': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'Pendiente Aprobación': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'Esperando Repuestos': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  'En Reparación': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'Listo para Entrega': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
};

const TESTIGOS_CONFIG = [
    { id: 'check_engine', icon: AlertCircle, label: 'Check Engine', type: 'rojo' },
    { id: 'aceite', icon: Droplets, label: 'Aceite', type: 'rojo' },
    { id: 'bateria', icon: BatteryWarning, label: 'Batería', type: 'rojo' },
    { id: 'temperatura', icon: Thermometer, label: 'Temp.', type: 'rojo' },
    { id: 'frenos', icon: CircleDot, label: 'Frenos', type: 'rojo' },
    { id: 'airbag', icon: LifeBuoy, label: 'Airbag', type: 'rojo' },
    { id: 'abs', icon: AlertCircle, label: 'ABS', type: 'amarillo' },
    { id: 'tpms', icon: Settings, label: 'Neum. TPMS', type: 'amarillo' },
    { id: 'precalentamiento', icon: Zap, label: 'Bujías Pre.', type: 'amarillo' },
    { id: 'dpf', icon: Wind, label: 'Filtro DPF', type: 'amarillo' },
    { id: 'eps', icon: Activity, label: 'Dir. EPS', type: 'amarillo' }
];

// 🔥 VALIDADOR DE RUT CON BYPASS PARA EXTRANJEROS
const validarRutChileno = (rutCompleto: string) => {
  if (!rutCompleto) return false;
  
  const rutLimpio = rutCompleto.replace(/[^0-9kK]/g, '').toUpperCase();
  if (rutLimpio === '111111111') return true;
  if (rutLimpio.length < 8) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dvIngresado = rutLimpio.slice(-1);
  
  let suma = 0;
  let multiplo = 2;
  
  for (let i = 1; i <= cuerpo.length; i++) {
    const digito = parseInt(cuerpo.charAt(cuerpo.length - i));
    suma += multiplo * digito;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  
  const dvEsperado = 11 - (suma % 11);
  let dvCalculado = dvEsperado.toString();
  
  if (dvEsperado === 11) dvCalculado = '0';
  if (dvEsperado === 10) dvCalculado = 'K';
  
  return dvCalculado === dvIngresado;
}

export default function CalibreApp() {
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  
  // 🔥 ESTADO DE LOCK-IN COMERCIAL (FASE 1)
  const [soloLectura, setSoloLectura] = useState(false)

  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [ordenesAbiertas, setOrdenesAbiertas] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])
  
  const [vehiculoInfo, setVehiculoInfo] = useState<any | null>(null)
  const [recepcionAbierta, setRecepcionAbierta] = useState(false)
  
  const [modalNuevaOrden, setModalNuevaOrden] = useState<any | null>(null)
  const [descripcionOrden, setDescripcionOrden] = useState('')
  const [valorDiagnostico, setValorDiagnostico] = useState('')
  const [mecanicoAsignado, setMecanicoAsignado] = useState('')
  const [kilometrajeOrden, setKilometrajeOrden] = useState('') 
  const [creandoOrden, setCreandoOrden] = useState(false)
  
  const [mostrarActa, setMostrarActa] = useState(false)
  // 🔥 ESTADOS DE RECEPCIÓN
  const [nivelCombustible, setNivelCombustible] = useState<number>(50)
  const [testigosSeleccionados, setTestigosSeleccionados] = useState<string[]>([])
  const [objetosValor, setObjetosValor] = useState('')
  const [danosPrevios, setDanosPrevios] = useState('')
  
  // 🔥 ESTADO MAPA DE DAÑOS 3D
  const [marcadoresDanos, setMarcadoresDanos] = useState<any[]>([])
  const [vistaAuto, setVistaAuto] = useState('superior') // Mantengo el estado por si acaso, aunque no se usa en 3D
  
  const [fotosRecepcion, setFotosRecepcion] = useState<File[]>([])
  const [previewsRecepcion, setPreviewsRecepcion] = useState<string[]>([])

  const [modalActa, setModalActa] = useState<any | null>(null)
  const [modalEditarOrden, setModalEditarOrden] = useState<any | null>(null)
  const [editFalla, setEditFalla] = useState('')
  const [editKm, setEditKm] = useState('')
  const [editMecanico, setEditMecanico] = useState('')
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  // 🔥 ESTADO PESTAÑAS ALERTAS/AGENDA
  const [tabIzquierda, setTabIzquierda] = useState<'alertas' | 'agenda'>('alertas')

  // 🔥 NUEVO ESTADO: BITÁCORA DE COMENTARIOS
  const [comentarioInputs, setComentarioInputs] = useState<Record<string, string>>({})

  const [escuchando, setEscuchando] = useState(false)

  const [modalConfiguracion, setModalConfiguracion] = useState(false)
  const [modalHistorial, setModalHistorial] = useState(false)
  const [modalTelemetria, setModalTelemetria] = useState(false)
  const [modalScanner, setModalScanner] = useState(false)
  const [modalMarketing, setModalMarketing] = useState(false)
  
  const [modalAlerta, setModalAlerta] = useState<any | null>(null)
  const [alertaForm, setAlertaForm] = useState({ pieza: '', nivel_riesgo: 'Amarillo', observacion: '' })
  const [guardandoAlerta, setGuardandoAlerta] = useState(false)

  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  
  const [nombreInput, setNombreInput] = useState('')
  const [rutInput, setRutInput] = useState('')
  const [telefonoInput, setTelefonoInput] = useState('+569')
  const [correoInput, setCorreoInput] = useState('') // 🔥 FASE 3.1
  const [patenteInput, setPatenteInput] = useState('')

  const [marcaInput, setMarcaInput] = useState('')
  const [modeloInput, setModeloInput] = useState('') 

  const [modalItemVisible, setModalItemVisible] = useState(false)
  const [guardandoItem, setGuardandoItem] = useState(false)
  const [itemForm, setItemForm] = useState({ id: null, orden_id: '', nombre: '', detalle: '', precio: '', tipo_item: 'servicio', procedencia: 'Taller' })  
  const [fotoForm, setFotoForm] = useState<{ordenId: string, file: File | null, preview: string, descripcion: string} | null>(null)

  const [codigoScanner, setCodigoScanner] = useState('')
  const [vehiculoScanner, setVehiculoScanner] = useState('')
  const [resultadoScanner, setResultadoScanner] = useState<any>(null)
  const [cargandoScanner, setCargandoScanner] = useState(false)

  const [esOnboarding, setEsOnboarding] = useState(false)
  const [nombreTaller, setNombreTaller] = useState('MI TALLER')
  const [inputTaller, setInputTaller] = useState('')
  const [inputDireccion, setInputDireccion] = useState('')
  const [inputTelefonoConfig, setInputTelefonoConfig] = useState('')
  const [inputGarantia, setInputGarantia] = useState('')
  const [incluirIva, setIncluirIva] = useState(false)
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false)
  const [modalAnalisis, setModalAnalisis] = useState<any | null>(null)

  const router = useRouter()
  
  const mecanicosUnicos = Array.from(new Set([
      ...ordenesAbiertas.map(o => o.mecanico),
      ...historial.map(o => o.mecanico)
  ])).filter(m => m && m !== 'Sin asignar');

  // 🔥 FUNCIÓN PARA LOS TESTIGOS
  const toggleTestigo = (testigoId: string) => {
    if (testigosSeleccionados.includes(testigoId)) {
        setTestigosSeleccionados(testigosSeleccionados.filter(t => t !== testigoId));
    } else {
        setTestigosSeleccionados([...testigosSeleccionados, testigoId]);
    }
  }

  const iniciarDictado = (setField: (val: string) => void, currentVal: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta dictado por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CL';
    recognition.continuous = false;
    recognition.interimResults = false; 

    recognition.onstart = () => {
      setEscuchando(true);
      toast('Escuchando... Habla ahora', { icon: '🎙️', duration: 3000 });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setField(currentVal ? `${currentVal} ${transcript}` : transcript);
      setEscuchando(false);
      toast.success("Voz capturada");
    };

    recognition.onerror = (event: any) => {
      setEscuchando(false);
      toast.error(`Error de voz: ${event.error}`);
    };

    recognition.onend = () => setEscuchando(false);
    try { recognition.start(); } 
    catch (e) {
      setEscuchando(false);
      toast.error("El micrófono ya está en uso.");
    }
  };

  const extraerDatosConfiguracion = (metadata: any) => {
      if (!metadata || !metadata.nombre_taller) {
          setNombreTaller('MI TALLER');
          setInputTaller(''); 
          setEsOnboarding(true);
          setModalConfiguracion(true); 
          return;
      }
      
      const n = metadata.nombre_taller;
      setNombreTaller(n);
      setInputTaller(n);
      setEsOnboarding(false); 
      
      if (metadata.direccion_taller) setInputDireccion(metadata.direccion_taller);
      if (metadata.telefono_taller) setInputTelefonoConfig(metadata.telefono_taller);
      if (metadata.garantia_taller) setInputGarantia(metadata.garantia_taller);
      if (metadata.incluir_iva !== undefined) setIncluirIva(metadata.incluir_iva);
      if (metadata.logo_url) setLogoPreview(metadata.logo_url);
  };

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      setLogoFile(file);
  }

  const guardarConfiguracion = async () => {
      if (inputTaller.trim() === '') {
          toast.error("El nombre del taller no puede estar vacío");
          return;
      }
      
      setGuardandoConfiguracion(true);
      const toastId = toast.loading("Guardando ajustes en la nube...");
      
      try {
          let logoUrl = session?.user?.user_metadata?.logo_url || null;

          if (logoFile) {
              setSubiendoLogo(true);
              const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
              const compressedFile = await imageCompression(logoFile, options);
              
              const fileName = `${session.user.id}/logo_${Date.now()}.png`;
              const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, compressedFile, { upsert: true });
              
              if (uploadError) throw uploadError;
              
              const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
              logoUrl = publicUrl;
              setSubiendoLogo(false);
          }

          const nombreLimpio = inputTaller.toUpperCase().trim();
          
          const payloadMetadata = {
              nombre_taller: nombreLimpio,
              direccion_taller: inputDireccion,
              telefono_taller: inputTelefonoConfig,
              garantia_taller: inputGarantia,
              incluir_iva: incluirIva,
              logo_url: logoUrl
          };

          const { error } = await supabase.auth.updateUser({
              data: payloadMetadata
          });

          if (error) throw error;

          setNombreTaller(nombreLimpio);
          setLogoFile(null); 
          setEsOnboarding(false); 
          
          toast.success(esOnboarding ? "¡Bienvenido a CALIBRE!" : "¡Ajustes guardados exitosamente!", { id: toastId });
          setModalConfiguracion(false);
      } catch (error: any) {
          toast.error("Error al guardar: " + error.message, { id: toastId });
          setSubiendoLogo(false);
      } finally {
          setGuardandoConfiguracion(false);
      }
  }

  const handleLogout = async () => { 
    await supabase.auth.signOut();
    router.push('/'); 
  }
  
  const cargarTodo = async (tId?: string) => {
    const currentTallerId = tId || session?.user?.id;
    if (!currentTallerId) return;

    // 🔥 VERIFICACIÓN MODO SOLO LECTURA (LOCK-IN)
    const { data: tData } = await supabase.from('talleres').select('pago_confirmado, fecha_vencimiento').eq('id', currentTallerId).single();
    if (tData) {
        const vencido = tData.fecha_vencimiento ? new Date(tData.fecha_vencimiento) < new Date() : false;
        setSoloLectura(!tData.pago_confirmado || vencido);
    }

    const { data: vData } = await supabase.from('vehiculos')
      .select('*, clientes(*), alertas_desgaste(*)') 
      .eq('taller_id', currentTallerId)
      .order('created_at', { ascending: false })
    setVehiculos(vData || [])

    const { data: oAbiertas } = await supabase.from('ordenes_trabajo')
      .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*), comentarios_orden(*)') 
      .eq('estado', 'Abierta')
      .eq('vehiculos.taller_id', currentTallerId)
      .order('created_at', { ascending: false })
    setOrdenesAbiertas(oAbiertas || [])

    const { data: oFinalizadas } = await supabase.from('ordenes_trabajo')
      .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*), comentarios_orden(*)') 
      .eq('estado', 'Finalizada')
      .eq('vehiculos.taller_id', currentTallerId)
      .order('created_at', { ascending: false }).limit(200) 
    setHistorial(oFinalizadas || [])
  }

  const actualizarCobrosBD = async (ordenId: string, campo: 'costo_revision' | 'descuento', valor: string) => {
      if (soloLectura) return;
      const num = parseInt(valor) || 0;
      try {
          await supabase.from('ordenes_trabajo').update({ [campo]: num }).eq('id', ordenId);
          await cargarTodo();
          toast.success("Monto actualizado", { position: 'bottom-left' });
      } catch (error) {
          toast.error("Error al actualizar monto");
      }
  }

  const enviarComentario = async (ordenId: string) => {
      const texto = comentarioInputs[ordenId];
      if (!texto || !texto.trim() || soloLectura) return;
      
      const autor = session?.user?.user_metadata?.nombre_taller || 'Mecánico';
      try {
          await supabase.from('comentarios_orden').insert([{ 
              orden_id: ordenId, 
              taller_id: session?.user?.id, 
              texto: texto.trim(), 
              autor_nombre: autor 
          }]);
          setComentarioInputs(prev => ({...prev, [ordenId]: ''}));
          await cargarTodo();
      } catch (error) {
          toast.error("Error al enviar nota");
      }
  }

  const llamarARevisionWhatsapp = (vehiculo: any) => {
      const telefono = vehiculo.clientes?.telefono;
      const cliente = vehiculo.clientes?.nombre || 'Estimado(a)';
      const modelo = `${vehiculo.marca} ${vehiculo.modelo}`;
      
      const msj = `Hola ${cliente} 👋, te escribimos de ${nombreTaller}. \nTe contactamos porque tenemos registrado que a tu ${modelo} (Patente: ${vehiculo.patente}) le corresponde una revisión pendiente. ¿Te gustaría agendar una cita esta semana? 🔧`;
      
      if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
          window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
      } else {
          toast.error("El cliente no tiene un teléfono válido registrado.");
      }
  }

  const resolverAlertaDirecta = async (alertaId: string) => {
      if (soloLectura) return;
      try {
          await supabase.from('alertas_desgaste').update({ estado: 'Resuelta' }).eq('id', alertaId);
          toast.success("¡Alerta marcada como resuelta!");
          await cargarTodo();
      } catch (error) { toast.error("Error al actualizar la alerta"); }
  }

  const compartirLinkCliente = async (o: any) => {
      const linkUrl = `${window.location.origin}/estado/${o.id}`;
      const patente = o.vehiculos?.patente || 'tu vehículo';
      const mensaje = `¡Hola! Puedes revisar el detalle y seguir el estado de ${patente} en tiempo real aquí:\n👉 ${linkUrl}`;

      if (navigator.share) {
          try {
              await navigator.share({
                  title: `Estado de Reparación - ${nombreTaller}`,
                  text: mensaje,
              });
              toast.success("¡Enlace compartido!", { icon: '🚀' });
          } catch (error) {
              console.log('Menú de compartir cerrado');
          }
      } else {
          navigator.clipboard.writeText(mensaje);
          toast.success("¡Link copiado al portapapeles!", { icon: '🔗' });
      }
  }

  const handleRutChange = (e: any) => {
      let v = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
      if (v.length > 1) v = v.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + v.slice(-1);
      setRutInput(v);

      const rutLimpio = v;
      const vehiculoConCliente = vehiculos.find(veh => veh.clientes?.rut === rutLimpio);
      
      if (vehiculoConCliente && vehiculoConCliente.clientes) {
          setNombreInput(vehiculoConCliente.clientes.nombre || '');
          if (vehiculoConCliente.clientes.telefono) {
              setTelefonoInput(vehiculoConCliente.clientes.telefono);
          }
          if (vehiculoConCliente.clientes.correo) { // 🔥 FASE 3.1
              setCorreoInput(vehiculoConCliente.clientes.correo);
          }
      }
  }

  const abrirOrden = (vehiculo: any) => {
      if (soloLectura) {
          toast.error("Modo Solo Lectura: No puedes abrir nuevas órdenes.");
          return;
      }
      setDescripcionOrden(''); 
      setValorDiagnostico('');
      setMecanicoAsignado('');
      setKilometrajeOrden('');
      setMostrarActa(false);
      setNivelCombustible(50);
      setTestigosSeleccionados([]);
      setObjetosValor('');
      setDanosPrevios('');
      setMarcadoresDanos([]); 
      setFotosRecepcion([]);
      setPreviewsRecepcion([]);
      setModalNuevaOrden(vehiculo);
  }

  const abrirModalAlerta = (orden: any) => {
      if (soloLectura) return;
      setAlertaForm({ pieza: '', nivel_riesgo: 'Amarillo', observacion: '' });
      setModalAlerta(orden);
  }

  const abrirModalEditarOrden = (orden: any) => {
      if (soloLectura) return;
      setEditFalla(orden.descripcion || '');
      setEditKm(orden.kilometraje?.toString() || '');
      setEditMecanico(orden.mecanico && orden.mecanico !== 'Sin asignar' ? orden.mecanico : '');
      setModalEditarOrden(orden);
  }

  const guardarEdicionOrden = async () => {
      if (soloLectura) return;
      setGuardandoEdicion(true);
      try {
          const { error } = await supabase.from('ordenes_trabajo').update({
              descripcion: editFalla,
              kilometraje: editKm ? parseInt(editKm) : null,
              mecanico: editMecanico.trim() || 'Sin asignar'
          }).eq('id', modalEditarOrden.id);

          if (error) throw error;
          
          toast.success("Orden actualizada correctamente");
          setModalEditarOrden(null);
          await cargarTodo();
      } catch (error: any) {
          toast.error("Error al editar la orden");
      } finally {
          setGuardandoEdicion(false);
      }
  }

  const anularOrden = async (idOrden: string) => {
      if (soloLectura) return;
      if (!window.confirm("¿Estás seguro de ANULAR y borrar esta orden? Esta acción no se puede deshacer y borrará los ítems asociados.")) return;
      
      try {
          await supabase.from('fotos_orden').delete().eq('orden_id', idOrden);
          await supabase.from('items_orden').delete().eq('orden_id', idOrden);
          const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', idOrden);
          
          if (error) throw error;
          
          toast.success("Orden anulada y eliminada");
          await cargarTodo();
      } catch (error: any) {
          toast.error("Error al anular la orden");
      }
  }

  const guardarAlertaBD = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!modalAlerta || guardandoAlerta || soloLectura) return;
      setGuardandoAlerta(true);

      try {
          const vehiculoId = modalAlerta.vehiculo_id || modalAlerta.id;

          const payload = {
              vehiculo_id: vehiculoId,
              pieza: alertaForm.pieza,
              nivel_riesgo: alertaForm.nivel_riesgo,
              observacion: alertaForm.observacion,
              taller_id: session?.user?.id
          };

          const { error } = await supabase.from('alertas_desgaste').insert([payload]);
          if (error) throw error;

          toast.success("¡Alerta registrada exitosamente en la ficha clínica!");
          
          if (alertaForm.nivel_riesgo === 'Rojo') {
              const cliente = modalAlerta.vehiculos?.clientes?.nombre || 'Estimado(a)';
              const patente = modalAlerta.vehiculos?.patente || 'su vehículo';
              const telefono = modalAlerta.vehiculos?.clientes?.telefono;

              const msj = `Hola *${cliente}*, te escribimos de *${nombreTaller}*. 🚨\n\nNuestros mecánicos detectaron un desgaste CRÍTICO en tu vehículo (Patente: ${patente}).\n\nPieza afectada: *${alertaForm.pieza}*\nObservación: _${alertaForm.observacion}_\n\nTe sugerimos resolver esto lo antes posible por seguridad. ¿Deseas que te enviemos un presupuesto para este trabajo?`;
              
              if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
                  setTimeout(() => {
                      window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
                  }, 1000);
              } else {
                  toast.error("El cliente no tiene un teléfono válido para enviar la alerta urgente.");
              }
          }
          
          setModalAlerta(null);
          await cargarTodo(); 
      } catch (error: any) {
          toast.error("Error al guardar la alerta: " + error.message);
      } finally {
          setGuardandoAlerta(false);
      }
  }

  const resolverAlertaBD = async (alertaId: string) => {
      if (soloLectura) return;
      try {
          const { error } = await supabase.from('alertas_desgaste').update({ estado: 'Resuelta' }).eq('id', alertaId);
          if (error) throw error;
          toast.success("¡Alerta marcada como corregida!");
          await cargarTodo();
          setModalAlerta(null); 
      } catch (error: any) {
          toast.error("Error al actualizar la alerta: " + error.message);
      }
  }

  const confirmarNuevaOrden = async () => {
      if (!modalNuevaOrden || soloLectura) return;
      setCreandoOrden(true);
      const toastId = toast.loading("Creando orden...", { id: 'orden' });

      const { data: ordenExistente } = await supabase
          .from('ordenes_trabajo')
          .select('id')
          .eq('vehiculo_id', modalNuevaOrden.id)
          .eq('estado', 'Abierta')
          .maybeSingle();

      if (ordenExistente) {
          toast.error("Este vehículo ya tiene una orden abierta en la pizarra.", { id: toastId });
          setCreandoOrden(false);
          setModalNuevaOrden(null);
          return;
      }

      try {
          const payloadOrden = {
              vehiculo_id: modalNuevaOrden.id,
              estado: 'Abierta',
              sub_estado: 'Diagnóstico',
              descripcion: descripcionOrden,
              mecanico: mecanicoAsignado.trim() || 'Sin asignar',
              kilometraje: kilometrajeOrden ? parseInt(kilometrajeOrden) : null,
              nivel_combustible: mostrarActa ? nivelCombustible : null,
              testigos: mostrarActa ? JSON.stringify(testigosSeleccionados) : null,
              objetos_valor: mostrarActa ? objetosValor : null,
              danos_previos: mostrarActa ? danosPrevios : null,
              danos_carroceria: mostrarActa ? JSON.stringify(marcadoresDanos) : null,
              costo_revision: valorDiagnostico ? parseInt(valorDiagnostico) : 0 
          };

          const { data: nuevaOrden, error: errorOrden } = await supabase.from('ordenes_trabajo').insert([payloadOrden]).select();
          
          if (errorOrden) throw errorOrden;
          
          const ordenId = nuevaOrden[0].id;

          if (mostrarActa && fotosRecepcion.length > 0) {
              toast.loading("Subiendo fotos de recepción...", { id: toastId });
              for (const foto of fotosRecepcion) {
                  const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true };
                  const compressedFile = await imageCompression(foto, options);
                  
                  const fileName = `${ordenId}/recepcion_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                  const { error: sErr } = await supabase.storage.from('evidencia').upload(fileName, compressedFile);
                  
                  if (!sErr) {
                      const { data: { publicUrl } } = supabase.storage.from('evidencia').getPublicUrl(fileName);
                      await supabase.from('fotos_orden').insert([{ 
                          orden_id: ordenId, 
                          url: publicUrl, 
                          descripcion: "Estado Inicial (Recepción)" 
                      }]);
                  }
              }
          }

          toast.success("¡Orden ingresada a la Pizarra!", { id: toastId });
          await cargarTodo(); 
          setModalNuevaOrden(null); 
      } catch (error: any) {
          toast.error("Error al crear la orden: " + error.message, { id: toastId });
      } finally {
          setCreandoOrden(false);
      }
  }

  const registrarTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading || soloLectura) {
        if (soloLectura) toast.error("Modo Solo Lectura: No puedes registrar vehículos.");
        return;
    }

    if (rutInput && !validarRutChileno(rutInput)) {
        toast.error("El RUT ingresado no es válido. Revísalo o déjalo en blanco.");
        return;
    }

    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const patenteLimpia = patenteInput.toUpperCase().replace(/[^A-Z0-9]/g, '') 
    const tId = session?.user?.id;

    const { data: vExistente } = await supabase.from('vehiculos').select('id').eq('patente', patenteLimpia).eq('taller_id', tId).single()
    if (vExistente) { toast.error("Esta patente ya está registrada en tu taller."); setLoading(false); return }

    if (rutInput) {
      const { data: cExistente } = await supabase.from('clientes').select('id, nombre').eq('rut', rutInput).eq('taller_id', tId).single()
      if (cExistente) {
        if (!window.confirm(`El usuario ${cExistente.nombre} ya existe. ¿Vincular auto?`)) { setLoading(false); return }
        await ejecutarRegistroCompleto(cExistente.id, fd)
      } else { await ejecutarRegistroCompleto(null, fd) }
    } else { await ejecutarRegistroCompleto(null, fd) }
  }

  const ejecutarRegistroCompleto = async (cId: string | null, fd: FormData) => {
    let finalId = cId;
    const tId = session?.user?.id;
    try {
        if (!finalId) {
            const payloadCliente = { nombre: nombreInput, telefono: telefonoInput, correo: correoInput || null, rut: rutInput, taller_id: tId }; // 🔥 FASE 3.1
            const { data: nC, error: errC } = await supabase.from('clientes').insert([payloadCliente]).select();
            if (errC) throw errC;
            finalId = nC ? nC[0].id : null;
        } else if (correoInput) {
            await supabase.from('clientes').update({ correo: correoInput }).eq('id', finalId);
        }
        if (finalId) {
            const { data: nV, error: errV } = await supabase.from('vehiculos').insert([{ 
                patente: patenteInput.toUpperCase().replace(/[^A-Z0-9]/g, ''), 
                marca: (fd.get('marca') as string).toUpperCase().trim(), 
                modelo: (fd.get('modelo') as string).toUpperCase().trim(), 
                anho: fd.get('anho') ? parseInt(fd.get('anho') as string) : null, 
                cliente_id: finalId, 
                taller_id: tId 
            }]).select();
            if (errV) throw errV;
            
            if (nV && nV.length > 0) {
                toast.success("Vehículo registrado correctamente.");
                await cargarTodo();
                (document.getElementById('form-recepcion') as HTMLFormElement)?.reset();
                setMarcaInput(''); 
                setModeloInput('');
                setNombreInput('');
                setRutInput('');
                setTelefonoInput('+569');
                setCorreoInput(''); 
                setPatenteInput('');
                
                abrirOrden(nV[0]); 
            }
        }
    } catch (error: any) { toast.error("Error en registro: " + error.message); } 
    finally { setLoading(false); }
  }

  const handleAsignarMecanico = async (ordenId: string, actual: string) => {
    if (soloLectura) return;
    const nuevoMecanico = window.prompt("Ingrese el nombre del mecánico a cargo:", actual === 'Sin asignar' ? '' : actual);
    if (nuevoMecanico !== null) { 
        await supabase.from('ordenes_trabajo').update({ mecanico: nuevoMecanico.trim() || 'Sin asignar' }).eq('id', ordenId);
        await cargarTodo();
        toast.success("Mecánico asignado");
    }
  }

  const cambiarSubEstado = async (ordenId: string, nuevoEstado: string) => {
      if (soloLectura) return;
      const { error } = await supabase.from('ordenes_trabajo').update({ sub_estado: nuevoEstado }).eq('id', ordenId);
      if (!error) {
          toast.success(`Estado actualizado`);
          await cargarTodo();
      } else {
          toast.error("Error al actualizar el estado");
      }
  }

  const calcularTiempoEnTaller = (fechaIngreso: string) => {
      const inicio = new Date(fechaIngreso).getTime();
      const ahora = new Date().getTime();
      const dif = ahora - inicio;
      const dias = Math.floor(dif / (1000 * 60 * 60 * 24));
      const horas = Math.floor((dif / (1000 * 60 * 60)) % 24);
      if (dias > 0) return `${dias}d ${horas}h`;
      return `${horas}h`;
  }

  const solicitarAprobacion = (o: any) => {
      const subtotalItems = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;
      const totalFinal = subtotalItems + (o.costo_revision || 0) - (o.descuento || 0); 
      
      const telefono = o.vehiculos?.clientes?.telefono;
      const cliente = o.vehiculos?.clientes?.nombre || 'Estimado(a)';
      const vehiculo = `${o.vehiculos?.marca} ${o.vehiculos?.modelo}`;
      const linkUrl = `${window.location.origin}/estado/${o.id}`;
      
      const msj = `Hola ${cliente}, te escribimos de ${nombreTaller}. 🔧\nEl presupuesto preliminar para tu ${vehiculo} (Patente: ${o.vehiculos?.patente}) es de *$${totalFinal.toLocaleString('es-CL')}*.\n\nPuedes revisar el detalle y seguir el estado de tu vehículo en tiempo real aquí:\n👉 ${linkUrl}\n\n¿Nos confirmas por aquí para proceder con el trabajo? Quedamos atentos.`;
      
      if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
          window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
          if (!soloLectura) cambiarSubEstado(o.id, 'Pendiente Aprobación'); 
      } else {
          toast.error("El cliente no tiene un teléfono válido registrado.");
      }
  }

  const abrirModalItem = (ordenId: string, itemObj: any = null) => {
    if (soloLectura) return;
    if (itemObj) {
        setItemForm({ 
            id: itemObj.id, 
            orden_id: ordenId, 
            nombre: itemObj.descripcion, 
            detalle: '', 
            precio: itemObj.precio.toString(), 
            tipo_item: itemObj.tipo_item, 
            procedencia: itemObj.procedencia
        });
    } else {
        setItemForm({ id: null, orden_id: ordenId, nombre: '', detalle: '', precio: '', tipo_item: 'servicio', procedencia: 'Taller' });
    }
    setModalItemVisible(true);
  }

  const eliminarItemBD = async (idItem: string) => {
      if (soloLectura) return;
      if (!window.confirm("¿Estás seguro de eliminar este ítem de la orden?")) return;
      try {
          await supabase.from('items_orden').delete().eq('id', idItem);
          toast.success("Ítem eliminado correctamente");
          await cargarTodo();
      } catch (error: any) {
          toast.error("Error al eliminar el ítem");
      }
  }

  const guardarItemBD = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!itemForm.orden_id || guardandoItem || soloLectura) return;
      setGuardandoItem(true);

      const descripcionFinal = itemForm.tipo_item === 'repuesto' && itemForm.detalle.trim() !== ''
          ? `${itemForm.nombre.trim()} (${itemForm.detalle.trim()})`
          : itemForm.nombre.trim();

      const payload = {
        orden_id: itemForm.orden_id,
        descripcion: descripcionFinal,
        precio: parseInt(itemForm.precio) || 0,
        tipo_item: itemForm.tipo_item,
        procedencia: itemForm.tipo_item === 'repuesto' ? itemForm.procedencia : 'Taller'
      };

      try {
          if (itemForm.id) {
              await supabase.from('items_orden').update(payload).eq('id', itemForm.id);
          } else {
              await supabase.from('items_orden').insert([payload]);
          }
          setModalItemVisible(false);
          toast.success("Ítem guardado");
          await cargarTodo();
      } catch (error) {
          toast.error("Error guardando el ítem");
      } finally {
          setGuardandoItem(false);
      }
  }

  const toggleItemRealizado = async (idItem: string, estadoActual: boolean) => {
      if (soloLectura) return;
      try {
          const { error } = await supabase.from('items_orden').update({ realizado: !estadoActual }).eq('id', idItem);
          if (error) throw error;
          await cargarTodo(); 
      } catch (error) { 
          toast.error("Error al actualizar la tarea"); 
      }
  }

  const handleSeleccionarFoto = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      setFotoForm(prev => prev ? { ...prev, file, preview: previewUrl } : null);
  }

  const subirFotoDefinitiva = async () => {
      if (!fotoForm || !fotoForm.file || soloLectura) return;
      setSubiendoFoto(true);

      try {
          const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true }
          const compressedFile = await imageCompression(fotoForm.file, options)
          
          const fileName = `${fotoForm.ordenId}/${Date.now()}_evidencia.jpg`
          const { error: sErr } = await supabase.storage.from('evidencia').upload(fileName, compressedFile)
          if (sErr) throw sErr;
          
          const { data: { publicUrl } } = supabase.storage.from('evidencia').getPublicUrl(fileName)
          
          const { error: dbError } = await supabase.from('fotos_orden').insert([{ 
              orden_id: fotoForm.ordenId, 
              url: publicUrl, 
              descripcion: fotoForm.descripcion || "Evidencia adjunta" 
          }])
          if (dbError) throw dbError;
          
          setFotoForm(null);
          toast.success("Foto guardada exitosamente");
          await cargarTodo();
      } catch (err: any) {
          toast.error("Error subiendo foto: " + err.message);
      } finally {
          setSubiendoFoto(false);
      }
  }

  const consultarScanner = async (e: React.FormEvent, tipo: 'scanner' | 'manual') => {
    e.preventDefault(); if (!codigoScanner) return
    setCargandoScanner(true); setResultadoScanner(null)
    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoScanner, vehiculo: vehiculoScanner, tipo }) 
      })
      const data = await res.json()
      if(data.error) throw new Error(data.error)
      setResultadoScanner(data)
    } catch (err: any) { toast.error("Error IA: " + err.message) } finally { setCargandoScanner(false) }
  }

  const entregarOrdenYFinalizar = async (o: any) => {
      if (soloLectura) return;
      setGenerandoPDF(true); 
      try {
          let resumenGenerado = "";
          
          if (o.items_orden && o.items_orden.length > 0) {
              try {
                  const res = await fetch('/api/resumen', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ vehiculo: o.vehiculos, items: o.items_orden, falla: o.descripcion })
                  });
                  
                  if (!res.ok) throw new Error("Error HTTP de IA");
                  const data = await res.json();
                  if (data && data.resumen) {
                      resumenGenerado = data.resumen;
                  }
              } catch (error: any) {
                  toast.error(`La IA no respondió, cerraremos la orden con informe básico.`);
              }
          }

          await supabase.from('ordenes_trabajo').update({ 
              estado: 'Finalizada',
              resumen_ia: resumenGenerado
          }).eq('id', o.id);

          const ordenParaPDF = {
              ...o,
              vehiculos: {
                  ...o.vehiculos,
                  alertas_desgaste: o.vehiculos?.alertas_desgaste?.filter((a: any) => a.estado !== 'Resuelta') || []
              }
          };

          const configPDF = {
              nombreTaller,
              direccion: session?.user?.user_metadata?.direccion_taller || '',
              telefono: session?.user?.user_metadata?.telefono_taller || '',
              garantia: session?.user?.user_metadata?.garantia_taller || '',
              logoUrl: session?.user?.user_metadata?.logo_url || null,
              incluirIva: session?.user?.user_metadata?.incluir_iva || false
          };

          await generarDocumentoPDF(ordenParaPDF, resumenGenerado, configPDF);
          
          const telefono = o.vehiculos?.clientes?.telefono;
          const cliente = o.vehiculos?.clientes?.nombre || 'Estimado(a)';
          const patente = o.vehiculos?.patente;

          if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
              const msj = `Hola *${cliente}*, te escribimos de *${nombreTaller}*. 🔧\n\nTe informamos que tu vehículo patente *${patente}* ya se encuentra listo para entrega.\n\nEn un momento te adjuntaremos por este medio el *Informe Técnico Oficial* con los detalles de los trabajos y repuestos aplicados.\n\n¡Gracias por tu confianza!`;
              
              window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
              toast.success("¡Orden lista! Abriendo WhatsApp...");
          } else {
              toast.success("Orden finalizada. (El cliente no tiene un celular válido para WhatsApp)");
          }

          await cargarTodo();
      } catch (error) {
          toast.error("Ocurrió un error general al procesar el cierre de la orden.");
      } finally {
          setGenerandoPDF(false);
      }
  }

  const tLimpio = busqueda.replace(/[^a-zA-Z0-9kK]/g, '').toLowerCase()
  const vehiculosFiltrados = vehiculos.filter(v => 
    v.patente.toLowerCase().includes(tLimpio) || 
    (v.clientes?.nombre || '').toLowerCase().includes(tLimpio) ||
    (v.clientes?.rut || '').replace(/[^0-9kK]/g, '').includes(tLimpio)
  )

  const bHistorial = busquedaHistorial.replace(/[^a-zA-Z0-9kK]/g, '').toLowerCase();
  const historialFiltrado = historial.filter(o => 
      o.vehiculos?.patente.toLowerCase().includes(bHistorial) ||
      (o.vehiculos?.clientes?.nombre || '').toLowerCase().includes(bHistorial) ||
      (o.vehiculos?.clientes?.rut || '').replace(/[^0-9kK]/g, '').includes(bHistorial)
  )

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
  
  const topMarcas = Object.entries(ingresosPorMarca)
    .sort((a: any, b: any) => b[1] - a[1]) 
    .slice(0, 3) as [string, number][];

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
          
          if (alerta.nivel_riesgo === 'Amarillo') {
              return diasTranscurridos >= 30; 
          } else if (alerta.nivel_riesgo === 'Rojo') {
              return diasTranscurridos >= 5;  
          }
          return false;
      });
      
      const ultimaOrden = historial.find(o => o.vehiculo_id === v.id);
      const muchoTiempo = ultimaOrden && new Date(ultimaOrden.created_at) < hace5Meses;

      return alertaMadura || muchoTiempo;
  });

  const enviarRecordatorioPredictivo = (vehiculo: any) => {
      const telefono = vehiculo.clientes?.telefono;
      const cliente = vehiculo.clientes?.nombre || 'Estimado(a)';
      const modelo = `${vehiculo.marca} ${vehiculo.modelo}`;
      
      const alerta = vehiculo.alertas_desgaste?.find((a: any) => a.estado === 'Pendiente');
      
      let msj = "";
      if (alerta) {
          msj = `Hola *${cliente}* 👋, te escribimos de *${nombreTaller}*. \n\nRevisando el historial de tu *${modelo}*, recordamos que hace un tiempo quedó pendiente revisar: *${alerta.pieza}*.\n\nTe escribimos para sugerirte un chequeo preventivo y evitar que se convierta en una falla costosa. ¿Te gustaría que coordinemos una visita esta semana? 🔧`;
      } else {
          msj = `Hola *${cliente}* 👋, te escribimos de *${nombreTaller}*. \n\nYa han pasado varios meses desde la última mantención de tu *${modelo}*. Para cuidar tu motor y mantener tu garantía, te sugerimos agendar tu cambio de aceite y filtros preventivo.\n\n¿Tienes disponibilidad esta semana para que lo ingresemos? 🚗✨`;
      }

      if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
          window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
      } else {
          toast.error("El cliente no tiene un teléfono válido registrado.");
      }
  };

  const rutSinFormato = rutInput.replace(/[^0-9kK]/g, '');
  const isRutValid = rutSinFormato.length >= 8 && validarRutChileno(rutInput);
  const isRutInvalid = rutSinFormato.length >= 8 && !isRutValid;

  const gradosAguja = (nivelCombustible / 100) * 180 - 90;
  
  const vehiculosConAlertas = vehiculos.filter(v => v.alertas_desgaste?.some((a: any) => a.estado === 'Pendiente'));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Wrench className="animate-spin text-emerald-500" size={64} />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans w-full mx-auto selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />

      {generandoPDF && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex flex-col items-center justify-center">
              <Bot className="animate-bounce text-emerald-400 mb-4" size={64} />
              <p className="text-emerald-400 font-black uppercase tracking-widest animate-pulse text-sm">Procesando Informe con IA...</p>
          </div>
      )}

      <Header 
        nombreTaller={nombreTaller}
        cajaTotal={cajaTotal}
        onOpenTelemetria={() => setModalTelemetria(true)}
        onOpenScanner={() => setModalScanner(true)}
        onOpenConfiguracion={() => setModalConfiguracion(true)}
        onOpenMarketing={() => setModalMarketing(true)} 
      />

      {soloLectura && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6 mx-auto w-full max-w-7xl flex items-center justify-between z-20 relative">
              <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-500 animate-pulse" size={24} />
                  <div>
                      <h3 className="text-red-500 font-black uppercase tracking-widest text-sm">Modo de Solo Lectura Activado</h3>
                      <p className="text-slate-400 text-xs font-bold mt-1">Tu suscripción ha finalizado. Puedes consultar el historial, pero no ingresar nuevas órdenes ni realizar modificaciones.</p>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 w-full relative z-10">
        
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <section className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
            <div className="flex items-center justify-between">
                <button 
                    type="button"
                    onClick={() => setRecepcionAbierta(!recepcionAbierta)}
                    className="flex items-center gap-2 text-xl font-black text-slate-100 uppercase tracking-tighter focus:outline-none md:cursor-default"
                >
                    Recepción <FileText className="text-emerald-500" size={20} />
                    <ChevronDown className={`md:hidden text-emerald-500 transition-transform duration-300 ${recepcionAbierta ? 'rotate-180' : ''}`} size={24} />
                </button>
                <button onClick={() => setModalMarketing(true)} className="bg-cyan-700 hover:bg-cyan-600 p-2 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] relative z-20" title="Lanzar Campaña de Marketing">
                    <Megaphone size={16} />
                </button>
            </div>
            
            <div className={`transition-all duration-300 ${recepcionAbierta ? 'block mt-5' : 'hidden'} md:block md:mt-5 ${soloLectura ? 'opacity-50 pointer-events-none' : ''}`}>
                <form id="form-recepcion" onSubmit={registrarTodo} className="space-y-3 relative z-10">
                  
                  <input 
                      name="rut_cliente" 
                      value={rutInput}
                      placeholder="RUT (Opcional)" 
                      onChange={handleRutChange} 
                      disabled={soloLectura}
                      className={`w-full p-3 rounded-2xl bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none transition-all border ${
                          isRutInvalid 
                          ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                          : isRutValid
                          ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50'
                          : 'border-slate-700/50 focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50'
                      }`}
                  />

                  <input 
                      name="nombre_cliente" 
                      value={nombreInput}
                      onChange={(e) => setNombreInput(e.target.value)}
                      required 
                      disabled={soloLectura}
                      placeholder="Nombre Dueño" 
                      className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                  />

                  <input 
                      name="correo_cliente" 
                      type="email" 
                      value={correoInput}
                      onChange={(e) => setCorreoInput(e.target.value)}
                      disabled={soloLectura}
                      placeholder="Correo Electrónico (Opcional)" 
                      className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                  />
                  
                  <input 
                      name="tel_cliente" 
                      type="tel" 
                      maxLength={12} 
                      value={telefonoInput}
                      disabled={soloLectura}
                      onChange={(e) => {
                          let v = e.target.value.replace(/[^\d+]/g, '');
                          if (!v.startsWith('+569')) v = '+569';
                          setTelefonoInput(v);
                      }} 
                      className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold" 
                  />
                  
                  <div className="h-px bg-slate-800/50 my-3" />
                  
                  <div className="relative">
                      <input 
                          name="patente" 
                          value={patenteInput}
                          disabled={soloLectura}
                          onChange={(e) => setPatenteInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                          required 
                          placeholder="PATENTE" 
                          className="w-full p-3 rounded-2xl border-2 border-emerald-500/80 bg-slate-900/80 backdrop-blur-sm uppercase font-black text-lg text-center text-emerald-400 outline-none focus:ring-4 ring-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] tracking-widest placeholder:text-emerald-900/50 transition-all" 
                      />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="col-span-1 relative">
                        <input 
                          name="marca" 
                          list="lista-marcas"
                          value={marcaInput}
                          disabled={soloLectura}
                          onChange={(e) => setMarcaInput(e.target.value.toUpperCase())}
                          placeholder="Marca" 
                          autoComplete="off"
                          className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-xs text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all uppercase" 
                        />
                        <datalist id="lista-marcas">
                            {MARCAS.map(m => <option key={m} value={m} />)}
                        </datalist>
                    </div>
                    
                    <div className="col-span-1 relative">
                        <input 
                          name="modelo" 
                          list="lista-modelos"
                          value={modeloInput} 
                          disabled={soloLectura}
                          onChange={(e) => setModeloInput(e.target.value.toUpperCase())} 
                          placeholder="Modelo" 
                          autoComplete="off"
                          className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-xs text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all uppercase" 
                        />
                        <datalist id="lista-modelos">
                            {marcaInput && (CAR_DATA as Record<string, string[]>)[marcaInput]?.map(m => <option key={m} value={m} />)}
                        </datalist>
                    </div>

                    <div className="col-span-1">
                        <input name="anho" type="number" disabled={soloLectura} placeholder="Año" className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-xs text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                    </div>
                  </div>
                  
                  <button disabled={loading || soloLectura} className="w-full bg-emerald-600 text-slate-950 py-4 rounded-full font-black shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all uppercase text-xs mt-3 disabled:opacity-50 hover:scale-[1.02] flex items-center justify-center gap-2">
                      {loading ? 'Procesando...' : <><Plus size={16}/> Registrar Orden</>}
                  </button>
                </form>
            </div>
          </section>

          <section className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-700/50">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar Patente o RUT..." className="w-full p-3 pl-9 rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm uppercase text-xs font-bold text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
            </div>
            <div className="space-y-2 mt-3 max-h-40 overflow-y-auto custom-scrollbar-dark pr-2">
                {vehiculosFiltrados.map(v => {
                    const alertaPendiente = v.alertas_desgaste?.find((a: any) => a.estado === 'Pendiente');
                    return (
                    <div key={v.id} className="p-3 bg-slate-800/50 backdrop-blur-sm rounded-xl flex justify-between items-center group border border-slate-700/50 hover:border-emerald-500/50 transition-all">
                        <div className="overflow-hidden pr-2 w-full">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-xs text-slate-100 tracking-wider truncate">{v.patente}</p>
                                    {alertaPendiente && (
                                        <span title="Vehículo con desgaste pendiente" className="shrink-0">
                                            <AlertTriangle size={12} className="text-orange-500 animate-pulse" />
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                    {alertaPendiente && (
                                        <>
                                            <button onClick={() => llamarARevisionWhatsapp(v)} className="bg-blue-600/20 text-blue-400 p-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors" title="Llamar a revisión (WhatsApp)"><PhoneForwarded size={12} /></button>
                                            <button onClick={() => resolverAlertaDirecta(alertaPendiente.id)} className="bg-emerald-600/20 text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors" title="Marcar desgaste como resuelto"><CheckCircle2 size={12} /></button>
                                        </>
                                    )}
                                    <button onClick={() => setVehiculoInfo(v)} className="bg-slate-700/50 text-emerald-400 p-1.5 rounded-lg hover:bg-slate-600 transition-colors" title="Ver Detalles">
                                        <Info size={12} />
                                    </button>
                                    <button disabled={soloLectura} onClick={() => abrirOrden(v)} className="bg-emerald-600 text-slate-950 px-2 py-1.5 rounded-lg text-[9px] font-black hover:bg-emerald-500 disabled:opacity-50 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all">ORDEN</button>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-500 uppercase truncate mt-1">{v.clientes?.nombre}</p>
                        </div>
                    </div>
                )})}
            </div>
          </section>

          {/* 🔥 FASE 6: PESTAÑAS (TABS) PARA ALERTAS Y AGENDA */}
          <section className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col h-[320px]">
            <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2 shrink-0">
                <button 
                    onClick={() => setTabIzquierda('alertas')} 
                    className={`flex-1 text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all flex items-center justify-center gap-1 ${tabIzquierda === 'alertas' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <AlertTriangle size={12}/> Alertas ({vehiculosConAlertas.length})
                </button>
                <button 
                    onClick={() => setTabIzquierda('agenda')} 
                    className={`flex-1 text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all flex items-center justify-center gap-1 ${tabIzquierda === 'agenda' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <Bot size={12}/> Agenda
                </button>
            </div>
            
            <div className="space-y-2 overflow-y-auto custom-scrollbar-dark pr-2 flex-1">
                {/* Contenido de Alertas */}
                {tabIzquierda === 'alertas' && (
                    <>
                        {vehiculosConAlertas.map(v => {
                            const alerta = v.alertas_desgaste?.find((a: any) => a.estado === 'Pendiente');
                            return (
                                <div key={`alerta-${v.id}`} className="p-3 bg-slate-950/50 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-red-500/50 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="overflow-hidden">
                                            <p className="font-black text-[10px] text-slate-200 uppercase truncate">{v.clientes?.nombre}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{v.marca} {v.modelo} • {v.patente}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 rounded-lg p-2 mb-2">
                                        <p className="text-[8px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                                            <AlertTriangle size={10} className="shrink-0" /> 
                                            <span className="truncate">Desgaste: {alerta?.pieza}</span>
                                        </p>
                                    </div>
                                    <button onClick={() => llamarARevisionWhatsapp(v)} className="w-full bg-blue-600/10 text-blue-400 border border-blue-600/30 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-slate-950 transition-all flex items-center justify-center gap-1">
                                        <PhoneForwarded size={10} /> Contactar
                                    </button>
                                </div>
                            );
                        })}
                        {vehiculosConAlertas.length === 0 && (
                            <div className="text-center p-4 border border-dashed border-slate-800 rounded-xl h-full flex flex-col items-center justify-center">
                                <CheckCircle2 size={24} className="text-slate-700 mb-2"/>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sin alertas críticas pendientes.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Contenido de Agenda Predictiva */}
                {tabIzquierda === 'agenda' && (
                    <>
                        {oportunidadesVenta.filter(v => !v.alertas_desgaste?.some((a: any) => a.estado === 'Pendiente')).map(v => (
                            <div key={`agenda-${v.id}`} className="p-3 bg-slate-950/50 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="overflow-hidden">
                                        <p className="font-black text-[10px] text-slate-200 uppercase truncate">{v.clientes?.nombre}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{v.marca} {v.modelo} • {v.patente}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-900 rounded-lg p-2 mb-2">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Bot size={10} className="text-blue-500 shrink-0" /> 
                                        <span className="truncate">Sugerir Mantención Preventiva</span>
                                    </p>
                                </div>
                                <button onClick={() => enviarRecordatorioPredictivo(v)} className="w-full bg-blue-600/10 text-blue-400 border border-blue-600/30 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-slate-950 transition-all flex items-center justify-center gap-1">
                                    <MessageSquare size={10} /> Enviar Aviso
                                </button>
                            </div>
                        ))}
                        {oportunidadesVenta.filter(v => !v.alertas_desgaste?.some((a: any) => a.estado === 'Pendiente')).length === 0 && (
                            <div className="text-center p-4 border border-dashed border-slate-800 rounded-xl h-full flex flex-col items-center justify-center">
                                <Bot size={24} className="text-slate-700 mb-2"/>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No hay mantenciones próximas.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
            
            <section className="relative h-full flex flex-col">
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
                
                <div className="flex items-center gap-3 mb-5 relative z-10 shrink-0">
                    <span className="h-3 w-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tighter uppercase">Pizarra Activa</h2>
                </div>

                {ordenesAbiertas.length === 0 ? (
                    <div className="flex-1 min-h-[500px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 relative z-10 bg-slate-900/20 backdrop-blur-sm">
                        <Settings size={48} className="text-slate-700 mb-4 animate-[spin_10s_linear_infinite]" />
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-1">Taller Despejado</h3>
                        <p className="text-xs text-slate-500 font-bold">Registra un vehículo a la izquierda para comenzar el trabajo.</p>
                    </div>
                ) : (
                    <div className="flex flex-row overflow-x-auto gap-5 relative z-10 pb-4 custom-scrollbar-dark snap-x h-full min-h-[650px]">
                        {ordenesAbiertas.map(o => {
                            
                            const subtotalItems = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;
                            const costoRev = o.costo_revision || 0;
                            const desc = o.descuento || 0;
                            const subtotalBruto = subtotalItems + costoRev;
                            const totalNeto = subtotalBruto - desc;
                            const porcentajeDesc = subtotalBruto > 0 ? Math.round((desc / subtotalBruto) * 100) : 0;

                            return (
                            <div key={o.id} className="min-w-[320px] max-w-[360px] w-full bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border-2 border-slate-800 hover:border-orange-500/50 transition-all relative overflow-hidden group flex flex-col snap-center flex-shrink-0 h-full">
                                
                                <div className="shrink-0 mb-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="overflow-hidden pr-2">
                                            
                                            <div className="flex flex-col gap-2 mb-1">
                                                <p className="font-black text-3xl tracking-tighter text-slate-100 w-full md:w-auto truncate">{o.vehiculos?.patente}</p>
                                                
                                                <select 
                                                    value={o.sub_estado || 'Diagnóstico'}
                                                    disabled={soloLectura}
                                                    onChange={(e) => cambiarSubEstado(o.id, e.target.value)}
                                                    className={`text-[8px] font-black px-1.5 py-1 rounded-md border uppercase tracking-wider outline-none cursor-pointer text-center shrink-0 w-fit ${COLOR_ESTADO[o.sub_estado || 'Diagnóstico']}`}
                                                >
                                                    <option className="bg-slate-900 text-slate-100 font-bold" value="Diagnóstico">DIAGNÓSTICO</option>
                                                    <option className="bg-slate-900 text-slate-100 font-bold" value="Pendiente Aprobación">ESPERA APROBAR</option>
                                                    <option className="bg-slate-900 text-slate-100 font-bold" value="Esperando Repuestos">ESPERA REPUESTOS</option>
                                                    <option className="bg-slate-900 text-slate-100 font-bold" value="En Reparación">REPARANDO</option>
                                                    <option className="bg-slate-900 text-slate-100 font-bold" value="Listo para Entrega">LISTO PARA ENTREGA</option>
                                                </select>
                                            </div>

                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                                                {o.vehiculos?.marca} {o.vehiculos?.modelo} 
                                                {o.kilometraje ? ` • ${o.kilometraje.toLocaleString()} KM` : ''}
                                            </p>
                                            
                                            <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-slate-400 bg-slate-950/50 w-fit px-2 py-1 rounded border border-slate-800">
                                                <Clock size={10} className="text-orange-400" />
                                                <span>{calcularTiempoEnTaller(o.created_at)} en taller</span>
                                            </div>

                                            <div onClick={() => handleAsignarMecanico(o.id, o.mecanico)} className={`flex items-center gap-1 w-fit mt-2 bg-slate-800/50 backdrop-blur-sm text-slate-300 font-bold text-[9px] px-2 py-1.5 rounded-lg border border-slate-700/50 shadow-sm uppercase truncate max-w-full ${soloLectura ? 'opacity-50' : 'cursor-pointer hover:bg-emerald-900/50 hover:text-emerald-400 hover:border-emerald-700 transition-all'}`} title="Clic para cambiar mecánico">
                                                <User size={10} className="shrink-0" /> <span className="truncate">{o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico : 'Mecánico'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <button onClick={() => setModalActa(o)} className="bg-slate-800/50 backdrop-blur-sm p-2.5 rounded-xl hover:bg-cyan-900/50 text-cyan-400 transition-all border border-slate-700/50 shadow-sm" title="Ver Acta de Recepción">
                                                <ClipboardList size={16} />
                                            </button>

                                            <button onClick={() => compartirLinkCliente(o)} className="bg-slate-800/50 backdrop-blur-sm p-2.5 rounded-xl hover:bg-blue-900/50 text-blue-400 transition-all border border-slate-700/50 shadow-sm" title="Compartir Link del Vehículo">                                                
                                                <Share2 size={16} />
                                            </button>
                                            
                                            <button onClick={() => setFotoForm({ordenId: o.id, file: null, preview: '', descripcion: ''})} disabled={soloLectura} className="bg-slate-800/50 disabled:opacity-50 backdrop-blur-sm p-2.5 rounded-xl hover:bg-emerald-900/50 text-emerald-400 transition-all border border-slate-700/50 shadow-sm" title="Subir Evidencia">
                                                <Camera size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-800/30 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50 flex justify-between items-center group">
                                        <div className="italic text-[10px] text-slate-400 line-clamp-1 w-full" title={o.descripcion}>"{o.descripcion}"</div>
                                        <button 
                                            onClick={() => abrirModalEditarOrden(o)} 
                                            disabled={soloLectura}
                                            className="ml-2 text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50" 
                                            title="Editar Orden"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* 🔥 BOTÓN FIJO ARRIBA DE LA LISTA */}
                                <button 
                                    disabled={soloLectura} 
                                    onClick={() => abrirModalItem(o.id)} 
                                    className="w-full shrink-0 mb-3 py-2.5 border border-emerald-700/50 rounded-xl text-[10px] font-black text-emerald-400 hover:bg-emerald-600 hover:text-slate-950 uppercase transition-all bg-emerald-900/20 shadow-[0_4px_15px_rgba(2,6,23,0.8)] backdrop-blur-md flex items-center justify-center gap-1"
                                >
                                    <Plus size={14} /> Añadir Servicio o Repuesto
                                </button>

                                <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-1 space-y-2 mb-4">
                                    {o.items_orden?.map((item: any) => (
                                        <div key={item.id} className={`flex justify-between items-center text-[10px] font-bold backdrop-blur-sm p-2.5 rounded-xl border group/item transition-colors ${item.realizado ? 'bg-emerald-900/10 border-emerald-900/30 opacity-70' : 'bg-slate-950/50 border-slate-800/50'}`}>
                                            <div className="flex items-center gap-2 flex-1 pr-2 overflow-hidden">
                                                <button disabled={soloLectura} onClick={() => toggleItemRealizado(item.id, item.realizado)} className="shrink-0 hover:scale-110 transition-transform disabled:opacity-50">
                                                    {item.realizado ? <CheckCircle2 className="text-emerald-500" size={14} /> : <Circle className="text-slate-600" size={14} />}
                                                </button>
                                                <div className="flex flex-col">
                                                    <span className={`uppercase truncate ${item.realizado ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.descripcion}</span>
                                                    
                                                    {/* 🔥 ALERTA VISUAL DE INVENTARIO */}
                                                    {item.tipo_item === 'repuesto' && !item.realizado && (
                                                        <span className="text-[8px] text-orange-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                            Bodega / Comprar
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`mr-1 ${item.realizado ? 'text-slate-500' : 'text-emerald-400'}`}>${item.precio.toLocaleString()}</span>
                                                <button disabled={soloLectura} onClick={() => abrirModalItem(o.id, item)} className="text-slate-600 disabled:opacity-50 hover:text-emerald-400 transition-colors p-1" title="Editar">
                                                    <Edit2 size={12} />
                                                </button>
                                                <button disabled={soloLectura} onClick={() => eliminarItemBD(item.id)} className="text-slate-600 disabled:opacity-50 hover:text-red-400 transition-colors p-1" title="Eliminar">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {o.items_orden?.length === 0 && <p className="text-[10px] text-center text-slate-600 italic py-2">Sin ítems registrados.</p>}
                                    
                                    {/* 🔥 BITÁCORA INTERNA */}
                                    <div className="mt-4 border-t border-slate-800/50 pt-3">
                                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <MessageSquare size={10} /> Notas de Turno
                                        </h4>
                                        <div className="bg-slate-950/40 rounded-xl border border-slate-800/50 p-2 flex flex-col gap-2">
                                            
                                            {/* Historial de Comentarios */}
                                            {o.comentarios_orden?.map((com: any) => (
                                                <div key={com.id} className="bg-slate-900 rounded-lg p-2 text-[9px]">
                                                    <div className="flex justify-between items-center mb-1 border-b border-slate-800 pb-1">
                                                        <span className="font-bold text-blue-400">{com.autor_nombre}</span>
                                                        <span className="text-slate-600">{new Date(com.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-slate-300 font-sans">{com.texto}</p>
                                                </div>
                                            ))}
                                            
                                            {/* Input para nuevo comentario */}
                                            <div className="flex gap-1 mt-1">
                                                <input 
                                                    type="text" 
                                                    value={comentarioInputs[o.id] || ''}
                                                    disabled={soloLectura}
                                                    onChange={e => setComentarioInputs({...comentarioInputs, [o.id]: e.target.value})}
                                                    onKeyDown={e => { if (e.key === 'Enter') enviarComentario(o.id) }}
                                                    placeholder="Añadir recado o novedad..." 
                                                    className="w-full bg-slate-800/50 rounded-lg p-2 text-[9px] text-slate-200 outline-none border border-slate-700/50 focus:border-blue-500 transition-colors"
                                                />
                                                <button 
                                                    onClick={() => enviarComentario(o.id)}
                                                    disabled={soloLectura}
                                                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                                                >
                                                    <Send size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 🔥 MÓDULO DE COBROS Y DESCUENTOS FIJOS AL FONDO */}
                                <div className="shrink-0 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
                                    
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1">
                                        <span>Subtotal Tareas/Repuestos:</span>
                                        <span>${subtotalItems.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-[10px] font-bold px-1">
                                        <span className="text-slate-300">Costo Revisión/Diagnóstico:</span>
                                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 focus-within:border-emerald-500 transition-colors">
                                            <span className="text-slate-500">$</span>
                                            <input 
                                                type="number" 
                                                defaultValue={o.costo_revision || ''} 
                                                disabled={soloLectura}
                                                onBlur={(e) => actualizarCobrosBD(o.id, 'costo_revision', e.target.value)}
                                                className="w-16 bg-transparent outline-none text-right text-slate-200" 
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] font-bold px-1">
                                        <span className="text-slate-300 flex items-center gap-1">
                                            Descuento Aplicado 
                                            {porcentajeDesc > 0 && <span className="bg-orange-500/20 text-orange-400 px-1 rounded font-black">-{porcentajeDesc}%</span>}
                                        </span>
                                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 focus-within:border-orange-500 transition-colors">
                                            <span className="text-orange-500 font-bold">-$</span>
                                            <input 
                                                type="number" 
                                                defaultValue={o.descuento || ''} 
                                                disabled={soloLectura}
                                                onBlur={(e) => actualizarCobrosBD(o.id, 'descuento', e.target.value)}
                                                className="w-16 bg-transparent outline-none text-right text-orange-400 font-black" 
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-800 w-full my-1"></div>

                                    <div className="flex justify-between items-end px-1">
                                        <button 
                                            onClick={() => anularOrden(o.id)} 
                                            disabled={soloLectura}
                                            className="text-[9px] disabled:opacity-50 font-black text-red-500 uppercase tracking-widest hover:underline"
                                        >
                                            Anular Orden
                                        </button>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Total a Cobrar</p>
                                            <p className="font-black text-emerald-400 text-2xl leading-none">${totalNeto.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <button 
                                            disabled={soloLectura || totalNeto === 0} 
                                            onClick={() => solicitarAprobacion(o)} 
                                            className="bg-slate-800 disabled:opacity-50 text-slate-300 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <MessageSquare size={12}/> Aprobar Pres.
                                        </button>
                                        <button 
                                            disabled={soloLectura} 
                                            onClick={() => entregarOrdenYFinalizar(o)} 
                                            className="bg-emerald-600 disabled:opacity-50 text-slate-950 py-2 rounded-xl text-[10px] font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-500 transition-all uppercase tracking-wider flex items-center justify-center gap-1"
                                        >
                                            Entregar <CheckCircle size={12} />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )})}
                    </div>
                )}
            </section>
        </div>
      </div>

      {/* MODALES */}

      {modalActa && (
        <ModalActaRecepcion 
          orden={modalActa} 
          onClose={() => setModalActa(null)} 
        />
      )}

      {modalEditarOrden && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900/90 backdrop-blur-md border border-blue-700/50 rounded-[35px] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none"></div>
                  
                  <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-2 relative z-10 flex items-center gap-2">
                      <Edit2 className="text-blue-500"/> Editar Orden
                  </h3>
                  <p className="text-sm text-slate-400 mb-6 relative z-10 font-bold">
                      Actualiza los datos de la orden activa.
                  </p>

                  <div className="space-y-4 relative z-10">
                      <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Problema Reportado</label>
                          <textarea 
                              value={editFalla}
                              onChange={(e) => setEditFalla(e.target.value)}
                              className="w-full p-4 rounded-2xl border border-slate-700/50 bg-slate-950/50 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all min-h-[80px] resize-none"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">KM Actual</label>
                              <input 
                                  type="number"
                                  value={editKm}
                                  onChange={(e) => setEditKm(e.target.value)}
                                  className="w-full p-4 rounded-2xl border border-slate-700/50 bg-slate-950/50 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all"
                              />
                          </div>
                          
                          <div className="col-span-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mecánico Asig.</label>
                              <input 
                                  list="lista-mecanicos"
                                  value={editMecanico}
                                  onChange={(e) => setEditMecanico(e.target.value)}
                                  className="w-full p-4 rounded-2xl border border-slate-700/50 bg-slate-950/50 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all"
                              />
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                          <button onClick={() => setModalEditarOrden(null)} disabled={guardandoEdicion} className="flex-1 bg-transparent border border-slate-700/50 text-slate-400 py-4 rounded-full text-xs font-black uppercase tracking-wider transition-colors">
                              Cancelar
                          </button>
                          <button onClick={guardarEdicionOrden} disabled={guardandoEdicion} className="flex-1 bg-blue-600 text-slate-100 py-4 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                              {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 🔥 MODAL NUEVA ORDEN (RELOJ ANALÓGICO, 11 TESTIGOS Y MAPA 3D) */}
      {modalNuevaOrden && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-[35px] p-6 md:p-8 w-full max-w-xl shadow-[0_0_40px_rgba(16,185,129,0.1)] relative my-auto max-h-[95vh] overflow-y-auto custom-scrollbar-dark">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none"></div>
                  
                  <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-1 relative z-10">Nueva Orden</h3>
                  <p className="text-sm text-slate-400 mb-5 relative z-10 font-bold">
                      {modalNuevaOrden.marca} {modalNuevaOrden.modelo} <span className="text-emerald-400 ml-1">{modalNuevaOrden.patente}</span>
                  </p>

                  <div className="space-y-4 relative z-10">
                      <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Problema Reportado</label>
                          <div className="relative">
                              <textarea 
                                  value={descripcionOrden}
                                  onChange={(e) => setDescripcionOrden(e.target.value)}
                                  className="w-full p-4 pr-14 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all min-h-[80px] resize-none"
                                  placeholder="Ej: Suena al frenar, no parte en las mañanas..."
                              />
                              <button 
                                  type="button"
                                  onClick={() => iniciarDictado(setDescripcionOrden, descripcionOrden)}
                                  className={`absolute right-3 top-3 p-2 rounded-xl transition-all shadow-sm ${escuchando ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' : 'bg-slate-800/80 text-emerald-400 border border-slate-700/50 hover:bg-emerald-900/50 hover:scale-105'}`}
                                  title="Dictar falla por voz"
                              >
                                  <Mic size={18} />
                              </button>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="col-span-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">KM Actual</label>
                              <input 
                                  type="number"
                                  value={kilometrajeOrden}
                                  onChange={(e) => setKilometrajeOrden(e.target.value)}
                                  className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                  placeholder="Ej: 120500"
                              />
                          </div>
                          <div className="col-span-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Diagnóstico ($)</label>
                              <input 
                                  type="number"
                                  value={valorDiagnostico}
                                  onChange={(e) => setValorDiagnostico(e.target.value)}
                                  className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-emerald-400 font-bold outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                  placeholder="Ej: 15000"
                              />
                          </div>
                          <div className="col-span-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mecánico Asig.</label>
                              <input 
                                  list="lista-mecanicos"
                                  value={mecanicoAsignado}
                                  onChange={(e) => setMecanicoAsignado(e.target.value)}
                                  className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                  placeholder="Opcional"
                              />
                          </div>
                      </div>

                      <div className="pt-2">
                          <button 
                              type="button"
                              onClick={() => setMostrarActa(!mostrarActa)}
                              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all w-full justify-center py-3 rounded-2xl border ${mostrarActa ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'}`}
                          >
                              {mostrarActa ? <CheckCircle size={14} /> : <Camera size={14} />}
                              {mostrarActa ? "Acta de Recepción Activa" : "Registrar Estado Inicial (Opcional)"}
                          </button>

                          {mostrarActa && (
                              <div className="mt-4 p-5 bg-slate-950/50 border border-slate-800 rounded-[25px] space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                  
                                  {/* ⛽ RELOJ DE COMBUSTIBLE ANALÓGICO */}
                                  <div>
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Nivel de Combustible
                                      </label>
                                      
                                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 relative flex flex-col items-center">
                                          <svg viewBox="0 0 200 120" className="w-full max-w-[240px] drop-shadow-[0_0_15px_rgba(51,65,85,0.5)]">
                                              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                                              
                                              {/* Marcas (Ticks) */}
                                              <line x1="20" y1="100" x2="35" y2="100" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/> 
                                              <line x1="43" y1="43" x2="54" y2="54" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/> 
                                              <line x1="100" y1="20" x2="100" y2="35" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/> 
                                              <line x1="157" y1="43" x2="146" y2="54" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/> 
                                              <line x1="180" y1="100" x2="165" y2="100" stroke="#10b981" strokeWidth="6" strokeLinecap="round"/> 

                                              {/* Aguja Dinámica */}
                                              <g style={{ transform: `rotate(${gradosAguja}deg)`, transformOrigin: '100px 100px', transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                                  <polygon points="97,100 103,100 100,25" fill="#ef4444" />
                                                  <circle cx="100" cy="100" r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
                                              </g>

                                              {/* Textos */}
                                              <text x="28" y="118" fill="#ef4444" fontSize="16" fontWeight="900" textAnchor="middle">E</text>
                                              <text x="100" y="55" fill="#64748b" fontSize="14" fontWeight="bold" textAnchor="middle">1/2</text>
                                              <text x="172" y="118" fill="#10b981" fontSize="16" fontWeight="900" textAnchor="middle">F</text>
                                          </svg>
                                          <input 
                                              type="range" min="0" max="100" step="5" 
                                              value={nivelCombustible} 
                                              onChange={(e) => setNivelCombustible(parseInt(e.target.value))} 
                                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-4"
                                          />
                                          <div className={`text-center mt-3 font-black text-xl tracking-tighter ${nivelCombustible <= 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                                              {nivelCombustible}%
                                          </div>
                                      </div>
                                  </div>

                                  {/* 🚨 11 TESTIGOS INTERACTIVOS */}
                                  <div>
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Testigos Encendidos
                                      </label>
                                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                          {TESTIGOS_CONFIG.map(t => (
                                              <button 
                                                  key={t.id} type="button" onClick={() => toggleTestigo(t.id)} 
                                                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${testigosSeleccionados.includes(t.id) ? (t.type==='rojo'?'bg-red-500/20 border-red-500 text-red-400 scale-105 shadow-[0_0_10px_rgba(239,68,68,0.2)]':'bg-yellow-500/20 border-yellow-500 text-yellow-400 scale-105 shadow-[0_0_10px_rgba(234,179,8,0.2)]') : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'}`}
                                              >
                                                  <t.icon size={16} /> <span className="text-[8px] font-black uppercase text-center leading-tight">{t.label}</span>
                                              </button>
                                          ))}
                                      </div>
                                  </div>

                                 {/* 🔥 MAPA DE DAÑOS 3D INTERACTIVO */}
                                  <div className="border-t border-slate-800 pt-4">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                         <div className="flex items-center gap-2"><Car size={14} className="text-orange-400"/> Mapa de Daños 3D</div>
                                         {marcadoresDanos.length > 0 && (
                                             <div className="flex gap-2">
                                                 <button 
                                                    type="button" 
                                                    onClick={() => setMarcadoresDanos(marcadoresDanos.slice(0, -1))} 
                                                    className="text-yellow-400 hover:text-yellow-300 text-[9px] font-bold uppercase bg-yellow-500/10 px-2 py-1 rounded transition-colors"
                                                 >
                                                     Deshacer Último
                                                 </button>
                                                 <button 
                                                    type="button" 
                                                    onClick={() => setMarcadoresDanos([])} 
                                                    className="text-red-400 hover:text-red-300 text-[9px] font-bold uppercase bg-red-500/10 px-2 py-1 rounded transition-colors"
                                                 >
                                                     Borrar Todo
                                                 </button>
                                             </div>
                                         )}
                                      </label>
                                      
                                      <div className="mb-4">
                                          <Car3DViewer 
                                              marcadores={marcadoresDanos} 
                                              setMarcadores={setMarcadoresDanos} 
                                              soloLectura={false} 
                                          />
                                      </div>
                                      
                                      <input 
                                          type="text" 
                                          value={danosPrevios} 
                                          onChange={(e) => setDanosPrevios(e.target.value)} 
                                          placeholder="Notas adicionales (Ej: Parachoques trasero trizado)..." 
                                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-emerald-500/50" 
                                      />
                                  </div>

                                  <div>
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Objetos de Valor</label>
                                      <input 
                                          type="text" 
                                          value={objetosValor} 
                                          onChange={(e) => setObjetosValor(e.target.value)} 
                                          placeholder="Ej: Radio Sony, Rueda repuesto..." 
                                          className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-200 outline-none focus:border-emerald-500/50" 
                                      />
                                  </div>

                                  <div>
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Evidencia Fotográfica
                                      </label>
                                      
                                      <div className="grid grid-cols-3 gap-2">
                                          {previewsRecepcion.map((src, i) => (
                                              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700">
                                                  <img src={src} className="w-full h-full object-cover" />
                                                  <button 
                                                      type="button"
                                                      onClick={() => {
                                                          setFotosRecepcion(fotosRecepcion.filter((_, idx) => idx !== i));
                                                          setPreviewsRecepcion(previewsRecepcion.filter((_, idx) => idx !== i));
                                                      }}
                                                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                                                  >
                                                      <X size={10} />
                                                  </button>
                                              </div>
                                          ))}
                                          
                                          {fotosRecepcion.length < 3 && (
                                              <label className="aspect-square rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500/50 hover:text-blue-400 cursor-pointer transition-all bg-slate-900/50 hover:bg-slate-900">
                                                  <Camera size={24} />
                                                  <span className="text-[9px] font-black uppercase mt-2 tracking-widest">Añadir Foto</span>
                                                  <input 
                                                      type="file" 
                                                      accept="image/*" 
                                                      capture="environment" 
                                                      multiple 
                                                      className="hidden" 
                                                      onChange={(e) => {
                                                          const files = Array.from(e.target.files || []);
                                                          setFotosRecepcion([...fotosRecepcion, ...files]);
                                                          setPreviewsRecepcion([...previewsRecepcion, ...files.map(f => URL.createObjectURL(f))]);
                                                      }}
                                                  />
                                              </label>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                      <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                          <button 
                              type="button"
                              onClick={() => { setModalNuevaOrden(null); setMostrarActa(false); }}
                              disabled={creandoOrden}
                              className="flex-1 bg-transparent border border-slate-700/50 hover:border-slate-500 text-slate-400 py-3 md:py-4 rounded-full text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="button"
                              onClick={confirmarNuevaOrden}
                              disabled={creandoOrden || !descripcionOrden.trim()}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-3 md:py-4 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              {creandoOrden ? 'Creando...' : 'Abrir Orden'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {modalAlerta && <ModalAlerta alertaForm={alertaForm} setAlertaForm={setAlertaForm} guardarAlertaBD={guardarAlertaBD} guardandoAlerta={guardandoAlerta} onClose={() => setModalAlerta(null)} ordenActiva={modalAlerta} resolverAlertaBD={resolverAlertaDirecta} />}
      {modalTelemetria && <ModalTelemetria onClose={() => setModalTelemetria(false)} gananciasEsteMes={gananciasEsteMes} autosEsteMes={autosEsteMes} ticketPromedio={ticketPromedio} pctServicio={pctServicio} pctRepuesto={pctRepuesto} ingresosServicio={ingresosServicio} ingresosRepuesto={ingresosRepuesto} topMarcas={topMarcas} topMecanicos={topMecanicos} historial={historial} />}
      {modalHistorial && <ModalHistorial onClose={() => setModalHistorial(false)} busquedaHistorial={busquedaHistorial} setBusquedaHistorial={setBusquedaHistorial} historialFiltrado={historialFiltrado} configPDF={{ nombreTaller, direccion: session?.user?.user_metadata?.direccion_taller || '', telefono: session?.user?.user_metadata?.telefono_taller || '', garantia: session?.user?.user_metadata?.garantia_taller || '', logoUrl: session?.user?.user_metadata?.logo_url || null, incluirIva: session?.user?.user_metadata?.incluir_iva || false }} />}
      {modalConfiguracion && <ModalConfiguracion onClose={() => setModalConfiguracion(false)} inputTaller={inputTaller} setInputTaller={setInputTaller} guardarConfiguracion={guardarConfiguracion} guardandoConfiguracion={guardandoConfiguracion} handleLogout={handleLogout} inputDireccion={inputDireccion} setInputDireccion={setInputDireccion} inputTelefono={inputTelefonoConfig} setInputTelefono={setInputTelefonoConfig} logoPreview={logoPreview} handleLogoChange={handleLogoChange} subiendoLogo={subiendoLogo} inputGarantia={inputGarantia} setInputGarantia={setInputGarantia} incluirIva={incluirIva} setIncluirIva={setIncluirIva} esOnboarding={esOnboarding} vehiculos={vehiculos} />}
      {vehiculoInfo && <ModalVehiculoInfo vehiculoInfo={vehiculoInfo} onClose={() => setVehiculoInfo(null)} reCargarGlobal={cargarTodo} />}
      {fotoForm && <ModalEvidencia fotoForm={fotoForm} setFotoForm={setFotoForm} handleSeleccionarFoto={handleSeleccionarFoto} subirFotoDefinitiva={subirFotoDefinitiva} subiendoFoto={subiendoFoto} />}
      {modalItemVisible && <ModalItem itemForm={itemForm} setItemForm={setItemForm} guardarItemBD={guardarItemBD} guardandoItem={guardandoItem} onClose={() => setModalItemVisible(false)} />}
      {modalScanner && <ModalScanner onClose={() => setModalScanner(false)} codigoScanner={codigoScanner} setCodigoScanner={setCodigoScanner} vehiculoScanner={vehiculoScanner} setVehiculoScanner={setVehiculoScanner} consultarScanner={consultarScanner} cargandoScanner={cargandoScanner} resultadoScanner={resultadoScanner} setResultadoScanner={setResultadoScanner} />}
      {modalMarketing && <ModalMarketing onClose={() => setModalMarketing(false)} vehiculos={vehiculos} historial={historial} nombreTaller={nombreTaller} />}
      {modalAnalisis && <ModalAnalisisIA orden={modalAnalisis} onClose={() => setModalAnalisis(null)} />}
    </main>
  )
}