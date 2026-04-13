'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import Login from '@/components/Login'
import CAR_DATA from './autos.json'
import { Edit2, Trash2, FileText, Clock, User, CheckCircle, Search, Bot, Camera, Plus, Wrench, ChevronRight, Info, MessageSquare, Mic, AlertTriangle, Megaphone, Settings } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

// 🚀 COMPONENTES EXTERNOS
import Header from '@/components/Header'
import ModalTelemetria from '@/components/modals/ModalTelemetria'
import ModalHistorial from '@/components/modals/ModalHistorial'
import ModalCaja from '@/components/modals/ModalCaja'
import ModalConfiguracion from '@/components/modals/ModalConfiguracion'
import ModalVehiculoInfo from '@/components/modals/ModalVehiculoInfo'
import ModalEvidencia from '@/components/modals/ModalEvidencia'
import ModalItem from '@/components/modals/ModalItem'
import ModalScanner from '@/components/modals/ModalScanner'
import ModalAlerta from '@/components/modals/ModalAlerta'
import ModalMarketing from '@/components/modals/ModalMarketing'

// 🚀 MOTOR DE PDF EXTERNO
import { generarDocumentoPDF } from '@/utils/pdfGenerator'

const MARCAS = Object.keys(CAR_DATA).sort();

const COLOR_ESTADO: Record<string, string> = {
    'Diagnóstico': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    'Pendiente Aprobación': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    'Esperando Repuestos': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    'En Reparación': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    'Listo para Entrega': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
};

export default function CalibreApp() {
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [ordenesAbiertas, setOrdenesAbiertas] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])

  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any | null>(null)
  const [vehiculoInfo, setVehiculoInfo] = useState<any | null>(null)
  const [recepcionAbierta, setRecepcionAbierta] = useState(false)
  
  const [modalNuevaOrden, setModalNuevaOrden] = useState<any | null>(null)
  const [descripcionOrden, setDescripcionOrden] = useState('')
  const [valorDiagnostico, setValorDiagnostico] = useState('')
  const [mecanicoAsignado, setMecanicoAsignado] = useState('')
  const [creandoOrden, setCreandoOrden] = useState(false)
  
  const [escuchando, setEscuchando] = useState(false)

  const [modalCaja, setModalCaja] = useState(false)
  const [modalConfiguracion, setModalConfiguracion] = useState(false)
  const [modalHistorial, setModalHistorial] = useState(false)
  const [modalTelemetria, setModalTelemetria] = useState(false)
  const [modalScanner, setModalScanner] = useState(false)
  const [modalMarketing, setModalMarketing] = useState(false)
  
  // 🔥 Estados del Semáforo Real
  const [modalAlerta, setModalAlerta] = useState<any | null>(null)
  const [alertaForm, setAlertaForm] = useState({ pieza: '', nivel_riesgo: 'Amarillo', observacion: '' })
  const [guardandoAlerta, setGuardandoAlerta] = useState(false)

  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  
  // 🔥 ESTADOS DEL FORMULARIO DE RECEPCIÓN
  const [nombreInput, setNombreInput] = useState('')
  const [rutInput, setRutInput] = useState('')
  const [telefonoInput, setTelefonoInput] = useState('+569')
  const [patenteInput, setPatenteInput] = useState('')
  const [escaneandoPatente, setEscaneandoPatente] = useState(false)

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

  const [nombreTaller, setNombreTaller] = useState('MI TALLER')
  const [inputTaller, setInputTaller] = useState('')
  const router = useRouter()

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
      if (event.error === 'no-speech') toast.error("No se escuchó nada. El micrófono podría estar silenciado.");
      else if (event.error === 'audio-capture') toast.error("No se detectó ningún micrófono.");
      else if (event.error === 'not-allowed') toast.error("El navegador bloqueó el permiso.");
      else toast.error(`Error de voz: ${event.error}`);
    };

    recognition.onend = () => setEscuchando(false);

    try { recognition.start(); } 
    catch (e) {
      setEscuchando(false);
      toast.error("El micrófono ya está en uso.");
    }
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
          }
      }
    });

    const tallerGuardado = localStorage.getItem('calibre_nombre_taller');
    if (tallerGuardado && isMounted) {
        setNombreTaller(tallerGuardado);
        setInputTaller(tallerGuardado);
    } else if (isMounted) {
        setInputTaller('MI TALLER');
    }

    return () => {
        isMounted = false;
        authListener.subscription?.unsubscribe();
    }
  }, [])

  const guardarNombreTaller = () => {
      if (inputTaller.trim() === '') {
          toast.error("El nombre no puede estar vacío");
          return;
      }
      const nombreLimpio = inputTaller.toUpperCase().trim();
      setNombreTaller(nombreLimpio);
      localStorage.setItem('calibre_nombre_taller', nombreLimpio);
      toast.success("¡Nombre guardado exitosamente!");
      setModalConfiguracion(false);
  }

  const handleLogout = async () => { 
    await supabase.auth.signOut();
    router.push('/'); 
  }
  
  const cargarTodo = async (tId?: string) => {
    const currentTallerId = tId || session?.user?.id;
    if (!currentTallerId) return;

    const { data: vData } = await supabase.from('vehiculos')
      .select('*, clientes(*), alertas_desgaste(*)') 
      .eq('taller_id', currentTallerId)
      .order('created_at', { ascending: false })
    setVehiculos(vData || [])

    const { data: oAbiertas } = await supabase.from('ordenes_trabajo')
      .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*)') 
      .eq('estado', 'Abierta')
      .eq('vehiculos.taller_id', currentTallerId)
      .order('created_at', { ascending: false })
    setOrdenesAbiertas(oAbiertas || [])

    const { data: oFinalizadas } = await supabase.from('ordenes_trabajo')
      .select('*, vehiculos!inner(*, clientes(*), alertas_desgaste(*)), items_orden(*), fotos_orden(*)') 
      .eq('estado', 'Finalizada')
      .eq('vehiculos.taller_id', currentTallerId)
      .order('created_at', { ascending: false }).limit(200) 
    setHistorial(oFinalizadas || [])
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
      }
  }

  const handleEscanearPatente = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      setEscaneandoPatente(true);
      const toastId = toast.loading("Ojo biónico analizando vehículo...");

      try {
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
          const compressedFile = await imageCompression(file, options);
          
          const base64data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(compressedFile);
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
          });
          
          const res = await fetch('/api/ocr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: base64data })
          });
          
          const data = await res.json();
          
          if (data.error || (!data.patente && !data.marca)) {
              toast.error("La IA no logró identificar los datos.", { id: toastId });
          } else {
              if (data.patente) setPatenteInput(data.patente);
              if (data.marca) setMarcaInput(data.marca);
              if (data.modelo) setModeloInput(data.modelo);
              
              toast.success(`¡Datos extraídos con éxito!`, { id: toastId });
          }
      } catch (error) {
          toast.error("Error al procesar la imagen de la cámara", { id: toastId });
      } finally {
          setEscaneandoPatente(false);
          e.target.value = null; 
      }
  };

  const abrirOrden = (vehiculo: any) => {
      setDescripcionOrden(''); 
      setValorDiagnostico('');
      setMecanicoAsignado('');
      setModalNuevaOrden(vehiculo);
  }

  const abrirModalAlerta = (orden: any) => {
      setAlertaForm({ pieza: '', nivel_riesgo: 'Amarillo', observacion: '' });
      setModalAlerta(orden);
  }

  const guardarAlertaBD = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!modalAlerta || guardandoAlerta) return;
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
      if (!modalNuevaOrden) return;
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
          const { data: nuevaOrden, error: errorOrden } = await supabase.from('ordenes_trabajo').insert([{
              vehiculo_id: modalNuevaOrden.id,
              estado: 'Abierta',
              sub_estado: 'Diagnóstico',
              descripcion: descripcionOrden,
              mecanico: mecanicoAsignado.trim() || 'Sin asignar'
          }]).select();
          
          if (errorOrden) throw errorOrden;
          
          const valorInt = valorDiagnostico ? parseInt(valorDiagnostico) : 0;
          if (nuevaOrden && nuevaOrden.length > 0 && valorInt > 0) {
              const { error: errorItem } = await supabase.from('items_orden').insert([{
                  orden_id: nuevaOrden[0].id,
                  descripcion: 'Diagnóstico',
                  precio: valorInt,
                  tipo_item: 'servicio',
                  procedencia: 'Taller'
              }]);
              if (errorItem) throw errorItem;
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
    if (loading) return; 

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
            const { data: nC, error: errC } = await supabase.from('clientes').insert([{ nombre: nombreInput, telefono: telefonoInput, rut: rutInput, taller_id: tId }]).select();
            if (errC) throw errC;
            finalId = nC ? nC[0].id : null;
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
                setPatenteInput('');
                
                abrirOrden(nV[0]); 
            }
        }
    } catch (error: any) { toast.error("Error en registro: " + error.message); } 
    finally { setLoading(false); }
  }

  const handleAsignarMecanico = async (ordenId: string, actual: string) => {
    const nuevoMecanico = window.prompt("Ingrese el nombre del mecánico a cargo:", actual === 'Sin asignar' ? '' : actual);
    if (nuevoMecanico !== null) { 
        await supabase.from('ordenes_trabajo').update({ mecanico: nuevoMecanico.trim() || 'Sin asignar' }).eq('id', ordenId);
        await cargarTodo();
        toast.success("Mecánico asignado");
    }
  }

  const cambiarSubEstado = async (ordenId: string, nuevoEstado: string) => {
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
      const total = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;
      const telefono = o.vehiculos?.clientes?.telefono;
      const cliente = o.vehiculos?.clientes?.nombre || 'Estimado(a)';
      const vehiculo = `${o.vehiculos?.marca} ${o.vehiculos?.modelo}`;
      
      const msj = `Hola ${cliente}, te escribimos de ${nombreTaller}. 🔧\nEl presupuesto preliminar para tu ${vehiculo} (Patente: ${o.vehiculos?.patente}) es de *$${total.toLocaleString('es-CL')}*.\n\n¿Nos confirmas por aquí para proceder con el trabajo? Quedamos atentos.`;
      
      if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
          window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
          cambiarSubEstado(o.id, 'Pendiente Aprobación'); 
      } else {
          toast.error("El cliente no tiene un teléfono válido registrado.");
      }
  }

  const abrirModalItem = (ordenId: string, itemObj: any = null) => {
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
      if (!itemForm.orden_id || guardandoItem) return;
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

  const handleSeleccionarFoto = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      setFotoForm(prev => prev ? { ...prev, file, preview: previewUrl } : null);
  }

  const subirFotoDefinitiva = async () => {
      if (!fotoForm || !fotoForm.file) return;
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

          await generarDocumentoPDF(ordenParaPDF, resumenGenerado, nombreTaller);
          
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

  // 🔥 VALIDADOR DE RUT BLINDADO OFICIAL
  const validarRutChileno = (rutCompleto: string) => {
      if (!rutCompleto) return false;
      
      const rutLimpio = rutCompleto.replace(/[^0-9kK]/g, '').toUpperCase();
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

  const cajaTotal = historial.reduce((acc, o) => acc + (o.items_orden?.reduce((s: number, i: any) => s + i.precio, 0) || 0), 0)

  let ingresosServicio = 0;
  let ingresosRepuesto = 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const ordenesEsteMes = historial.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const gananciasEsteMes = ordenesEsteMes.reduce((acc, o) => 
      acc + (o.items_orden?.reduce((s: number, i: any) => s + i.precio, 0) || 0)
  , 0);

  const autosEsteMes = ordenesEsteMes.length;

  historial.forEach(o => {
    o.items_orden?.forEach((i: any) => {
      if (i.tipo_item === 'servicio') ingresosServicio += i.precio;
      if (i.tipo_item === 'repuesto') ingresosRepuesto += i.precio;
    });
  });

  const totalSplit = ingresosServicio + ingresosRepuesto;
  const pctServicio = totalSplit > 0 ? Math.round((ingresosServicio / totalSplit) * 100) : 0;
  const pctRepuesto = totalSplit > 0 ? Math.round((ingresosRepuesto / totalSplit) * 100) : 0;
  
  const ticketPromedio = historial.length > 0 ? Math.round(cajaTotal / historial.length) : 0;

  const ingresosPorMarca = historial.reduce((acc: any, o) => {
    const m = o.vehiculos?.marca ? o.vehiculos.marca.toUpperCase() : 'OTRO';
    const totalOrden = o.items_orden?.reduce((s: number, i: any) => s + i.precio, 0) || 0;
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
  const hace6Meses = new Date();
  hace6Meses.setMonth(hoy.getMonth() - 6);

  const oportunidadesVenta = vehiculos.filter(v => {
      const alertasPendientes = v.alertas_desgaste?.filter((a: any) => a.estado === 'Pendiente') || [];
      const alertaMadura = alertasPendientes.some((alerta: any) => {
          const fechaAlerta = new Date(alerta.created_at);
          const diasTranscurridos = (hoy.getTime() - fechaAlerta.getTime()) / (1000 * 3600 * 24);
          
          if (alerta.nivel_riesgo === 'Amarillo') {
              return diasTranscurridos >= 90;
          } else if (alerta.nivel_riesgo === 'Rojo') {
              return diasTranscurridos >= 15;
          }
          return false;
      });
      
      const ultimaOrden = historial.find(o => o.vehiculo_id === v.id);
      const muchoTiempo = ultimaOrden && new Date(ultimaOrden.created_at) < hace6Meses;

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

  // 🔥 LÓGICA DE ESTADO VISUAL PARA EL RUT
  const isRutValid = rutInput.length > 0 && validarRutChileno(rutInput);
  const isRutInvalid = rutInput.length > 0 && !isRutValid;

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
        onOpenCaja={() => setModalCaja(true)}
        onOpenConfiguracion={() => setModalConfiguracion(true)}
        onOpenMarketing={() => setModalMarketing(true)} 
      />

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
            
            <div className={`transition-all duration-300 ${recepcionAbierta ? 'block mt-5' : 'hidden'} md:block md:mt-5`}>
                <form id="form-recepcion" onSubmit={registrarTodo} className="space-y-3 relative z-10">
                  
                  {/* 🔥 EL IMPUT DEL RUT CON LA NUEVA LÓGICA DE COLOR 🔥 */}
                  <input 
                      name="rut_cliente" 
                      value={rutInput}
                      placeholder="RUT" 
                      onChange={handleRutChange} 
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
                      placeholder="Nombre Dueño" 
                      className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                  />
                  
                  <input 
                      name="tel_cliente" 
                      type="tel" 
                      maxLength={12} 
                      value={telefonoInput}
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
                          onChange={(e) => setPatenteInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                          required 
                          placeholder="PATENTE" 
                          className="w-full p-3 pr-12 rounded-2xl border-2 border-emerald-500/80 bg-slate-900/80 backdrop-blur-sm uppercase font-black text-lg text-center text-emerald-400 outline-none focus:ring-4 ring-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] tracking-widest placeholder:text-emerald-900/50 transition-all" 
                      />
                      <button 
                          type="button"
                          onClick={() => document.getElementById('ocr-input')?.click()}
                          disabled={escaneandoPatente}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all shadow-sm ${escaneandoPatente ? 'bg-emerald-900/50 text-emerald-400/50 animate-pulse' : 'bg-slate-800/80 text-emerald-400 border border-slate-700/50 hover:bg-emerald-900/50 hover:scale-105'}`}
                          title="Escanear con cámara"
                      >
                          <Camera size={18} />
                      </button>
                      <input 
                          type="file" 
                          id="ocr-input" 
                          accept="image/*" 
                          capture="environment" 
                          className="hidden" 
                          onChange={handleEscanearPatente} 
                      />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="col-span-1 relative">
                        <input 
                          name="marca" 
                          list="lista-marcas"
                          value={marcaInput}
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
                        <input name="anho" type="number" placeholder="Año" className="w-full p-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-xs text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                    </div>
                  </div>
                  
                  <button disabled={loading} className="w-full bg-emerald-600 text-slate-950 py-4 rounded-full font-black shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all uppercase text-xs mt-3 disabled:opacity-50 hover:scale-[1.02] flex items-center justify-center gap-2">
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
                {/* 🔥 LISTA DE VEHÍCULOS */}
                {vehiculosFiltrados.map(v => {
                    const tieneAlerta = v.alertas_desgaste?.some((a: any) => a.estado === 'Pendiente');
                    return (
                    <div key={v.id} className="p-3 bg-slate-800/50 backdrop-blur-sm rounded-xl flex justify-between items-center group border border-slate-700/50 hover:border-emerald-500/50 transition-all">
                        <div className="overflow-hidden pr-2">
                            <div className="flex items-center gap-2">
                                <p className="font-black text-xs text-slate-100 tracking-wider truncate">{v.patente}</p>
                                {tieneAlerta && (
                                    <span title="Vehículo con desgaste pendiente" className="shrink-0">
                                        <AlertTriangle size={12} className="text-orange-500 animate-pulse" />
                                    </span>
                                )}
                            </div>
                            <p className="text-[9px] text-slate-500 uppercase truncate">{v.clientes?.nombre}</p>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => setVehiculoInfo(v)} className="bg-slate-700/50 text-emerald-400 p-1.5 rounded-lg hover:bg-slate-600 transition-colors" title="Ver Detalles">
                                <Info size={12} />
                            </button>
                            <button onClick={() => abrirOrden(v)} className="bg-emerald-600 text-slate-950 px-2 py-1.5 rounded-lg text-[9px] font-black hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all">ORDEN</button>
                        </div>
                    </div>
                )})}
            </div>
          </section>

          <section className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-700/50">
            <h2 className="text-xs font-black mb-3 text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Bot size={14} /> Agenda Predictiva
            </h2>
            <p className="text-[9px] text-slate-400 font-bold mb-3 leading-tight">
                Clientes que requieren mantención o tienen desgastes pendientes.
            </p>
            
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar-dark pr-2">
                {oportunidadesVenta.map(v => {
                    const alerta = v.alertas_desgaste?.find((a: any) => a.estado === 'Pendiente');
                    return (
                        <div key={v.id} className="p-3 bg-slate-950/50 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="overflow-hidden">
                                    <p className="font-black text-[10px] text-slate-200 uppercase truncate">{v.clientes?.nombre}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{v.marca} {v.modelo} • {v.patente}</p>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 rounded-lg p-2 mb-2">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <AlertTriangle size={10} className={alerta ? "text-yellow-500 shrink-0" : "text-slate-500 shrink-0"} /> 
                                    <span className="truncate">{alerta ? `Revisar ${alerta.pieza}` : 'Mantención Preventiva'}</span>
                                </p>
                            </div>

                            <button onClick={() => enviarRecordatorioPredictivo(v)} className="w-full bg-blue-600/10 text-blue-400 border border-blue-600/30 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-slate-950 transition-all flex items-center justify-center gap-1">
                                <MessageSquare size={10} /> Enviar Aviso
                            </button>
                        </div>
                    );
                })}

                {oportunidadesVenta.length === 0 && (
                    <div className="text-center p-4 border border-dashed border-slate-700/50 rounded-xl">
                        <p className="text-[10px] text-slate-500 font-bold">No hay clientes pendientes.</p>
                    </div>
                )}
            </div>
          </section>
        </div>

        {/* 🔥 COLUMNA PRINCIPAL DERECHA */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* PIZARRA ACTIVA (REINA ABSOLUTA) */}
            <section className="relative">
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
                
                <div className="flex items-center gap-3 mb-5 relative z-10">
                    <span className="h-3 w-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tighter uppercase">Pizarra Activa</h2>
                </div>

                {/* 🔥 EMPTY STATE ELEGANTE */}
                {ordenesAbiertas.length === 0 ? (
                    <div className="min-h-[250px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 relative z-10 bg-slate-900/20 backdrop-blur-sm">
                        <Settings size={48} className="text-slate-700 mb-4 animate-[spin_10s_linear_infinite]" />
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-1">Taller Despejado</h3>
                        <p className="text-xs text-slate-500 font-bold">Registra un vehículo a la izquierda para comenzar el trabajo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 relative z-10 items-start">
                        {ordenesAbiertas.map(o => (
                            <div key={o.id} className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-2 border-slate-800 hover:border-orange-500/50 transition-all relative overflow-hidden group flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="overflow-hidden pr-2">
                                            
                                            {/* 🔥 3. PATENTE Y ESTADO (COLUMNA EN MÓVIL, FILA EN PC) */}
                                            <div className="flex flex-col items-start md:flex-row md:items-center gap-2 mb-1">
                                                <p className="font-black text-3xl tracking-tighter text-slate-100 w-full md:w-auto truncate">{o.vehiculos?.patente}</p>
                                                
                                                <select 
                                                    value={o.sub_estado || 'Diagnóstico'}
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

                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{o.vehiculos?.marca} {o.vehiculos?.modelo}</p>
                                            
                                            <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-slate-400 bg-slate-950/50 w-fit px-2 py-1 rounded border border-slate-800">
                                                <Clock size={10} className="text-orange-400" />
                                                <span>{calcularTiempoEnTaller(o.created_at)} en taller</span>
                                            </div>

                                            <div onClick={() => handleAsignarMecanico(o.id, o.mecanico)} className="flex items-center gap-1 w-fit mt-2 bg-slate-800/50 backdrop-blur-sm text-slate-300 font-bold text-[9px] px-2 py-1.5 rounded-lg border border-slate-700/50 shadow-sm uppercase cursor-pointer hover:bg-emerald-900/50 hover:text-emerald-400 hover:border-emerald-700 transition-all truncate max-w-full" title="Clic para cambiar mecánico">
                                                <User size={10} className="shrink-0" /> <span className="truncate">{o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico : 'Mecánico'}</span>
                                            </div>
                                        </div>
                                        
                                        {/* 🔥 BOTONES DE ALERTA Y CÁMARA */}
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => abrirModalAlerta(o)} className="bg-slate-800/50 backdrop-blur-sm p-2.5 rounded-xl hover:bg-orange-900/50 text-orange-400 transition-all border border-slate-700/50 shadow-sm hover:scale-110" title="Registrar Desgaste">
                                                <AlertTriangle size={16} />
                                            </button>
                                            <button onClick={() => setFotoForm({ordenId: o.id, file: null, preview: '', descripcion: ''})} className="bg-slate-800/50 backdrop-blur-sm p-2.5 rounded-xl hover:bg-emerald-900/50 text-emerald-400 transition-all border border-slate-700/50 shadow-sm hover:scale-110">
                                                <Camera size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/30 backdrop-blur-sm p-3 rounded-xl mb-4 italic text-xs text-slate-400 border border-slate-700/50 line-clamp-2" title={o.descripcion}>"{o.descripcion}"</div>
                                    
                                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar-dark pr-1">
                                        {o.items_orden?.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center text-[9px] font-bold bg-slate-950/50 backdrop-blur-sm p-2.5 rounded-xl border border-slate-800/50 group/item transition-colors hover:border-slate-700">
                                                <div className="flex-1 pr-2 overflow-hidden">
                                                    <span className="text-slate-300 uppercase block truncate">{item.descripcion}</span>
                                                    <span className="text-slate-600 block">({item.procedencia})</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-emerald-400 mr-1">${item.precio.toLocaleString()}</span>
                                                    <button onClick={() => abrirModalItem(o.id, item)} className="text-slate-600 hover:text-emerald-400 transition-colors p-1" title="Editar">
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button onClick={() => eliminarItemBD(item.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1" title="Eliminar">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => abrirModalItem(o.id)} className="w-full py-3 border-2 border-dashed border-slate-700/50 rounded-xl text-[9px] font-black text-slate-500 hover:text-emerald-400 hover:border-emerald-600/50 uppercase transition-all bg-slate-900/30 hover:bg-slate-900/60 flex items-center justify-center gap-1">
                                            <Plus size={12} /> Agregar Item
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 mt-auto">
                                    <div>
                                        <p className="font-black text-emerald-400 text-2xl mb-1">${o.items_orden?.reduce((s:number,i:any)=>s+i.precio,0).toLocaleString()}</p>
                                        
                                        {o.items_orden?.length > 0 && (
                                            <button onClick={() => solicitarAprobacion(o)} className="flex items-center gap-1 text-[8px] font-black text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded hover:bg-green-500/30 transition-colors uppercase tracking-widest">
                                                <MessageSquare size={10}/> Aprobar
                                            </button>
                                        )}
                                    </div>
                                    <button onClick={() => entregarOrdenYFinalizar(o)} className="bg-emerald-600 text-slate-950 px-5 py-2.5 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-105 transition-all uppercase tracking-wider flex items-center gap-2">
                                        Listo <CheckCircle size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 🔥 TRABAJOS FINALIZADOS (COMPACTO Y LIMITADO) */}
            <section className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700/50 p-5 relative">
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle className="text-emerald-500" size={14} /> Trabajos Finalizados Recientes
                    </h2>
                    {historial.length > 3 && (
                        <button onClick={() => setModalHistorial(true)} className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-widest bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-900/50 transition-colors">
                            Ver todos ({historial.length}) <ChevronRight size={10}/>
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 relative z-10">
                    {historial.slice(0, 3).map(o => (
                        <div key={o.id} className="flex justify-between items-center p-3 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all">
                            <div className="overflow-hidden pr-2">
                                <span className="font-black text-slate-100 tracking-wider text-sm block truncate">{o.vehiculos?.patente}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[100px]">{o.vehiculos?.clientes?.nombre}</span>
                                    <span className="text-[8px] bg-slate-950/80 px-1.5 py-0.5 rounded text-emerald-400 border border-slate-800 font-bold flex items-center gap-1 shrink-0">
                                        <User size={8} /> {o.mecanico || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            
                            <button onClick={() => generarDocumentoPDF(o, o.resumen_ia, nombreTaller)} className="bg-slate-900 text-slate-500 border border-slate-700/50 p-2.5 rounded-xl hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all shrink-0" title="Generar Informe PDF">
                                <FileText size={16} />
                            </button>
                        </div>
                    ))}
                    {historial.length === 0 && <p className="text-xs text-slate-500 italic col-span-full">No hay trabajos finalizados aún.</p>}
                </div>
            </section>
        </div>
      </div>

      {/* MODALES */}
      {modalNuevaOrden && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-[35px] p-8 w-full max-w-md shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none"></div>
                  
                  <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-2 relative z-10">Nueva Orden</h3>
                  <p className="text-sm text-slate-400 mb-6 relative z-10 font-bold">
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

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Valor Diagnóstico ($)</label>
                              <input 
                                  type="number"
                                  value={valorDiagnostico}
                                  onChange={(e) => setValorDiagnostico(e.target.value)}
                                  className="w-full p-4 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-emerald-400 font-bold outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                  placeholder="Ej: 15000"
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mecánico Asignado</label>
                              <input 
                                  type="text"
                                  value={mecanicoAsignado}
                                  onChange={(e) => setMecanicoAsignado(e.target.value)}
                                  className="w-full p-4 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                  placeholder="Opcional"
                              />
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                          <button 
                              onClick={() => setModalNuevaOrden(null)}
                              disabled={creandoOrden}
                              className="flex-1 bg-transparent border border-slate-700/50 hover:border-slate-500 text-slate-400 py-4 rounded-full text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={confirmarNuevaOrden}
                              disabled={creandoOrden || !descripcionOrden.trim()}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-4 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              {creandoOrden ? 'Creando...' : 'Abrir Orden'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 🔥 RENDEREIZAR EL NUEVO MODAL DE ALERTA CON LA FUNCIÓN PARA RESOLVER */}
      {modalAlerta && (
        <ModalAlerta 
          alertaForm={alertaForm}
          setAlertaForm={setAlertaForm}
          guardarAlertaBD={guardarAlertaBD}
          guardandoAlerta={guardandoAlerta}
          onClose={() => setModalAlerta(null)}
          ordenActiva={modalAlerta}
          resolverAlertaBD={resolverAlertaBD}
        />
      )}

      {modalTelemetria && (
        <ModalTelemetria 
            onClose={() => setModalTelemetria(false)}
            gananciasEsteMes={gananciasEsteMes}
            autosEsteMes={autosEsteMes}
            ticketPromedio={ticketPromedio}
            pctServicio={pctServicio}
            pctRepuesto={pctRepuesto}
            ingresosServicio={ingresosServicio}
            ingresosRepuesto={ingresosRepuesto}
            topMarcas={topMarcas}
            topMecanicos={topMecanicos}
        />
      )}

      {modalHistorial && (
        <ModalHistorial 
            onClose={() => setModalHistorial(false)}
            busquedaHistorial={busquedaHistorial}
            setBusquedaHistorial={setBusquedaHistorial}
            historialFiltrado={historialFiltrado}
            nombreTaller={nombreTaller}
        />
      )}

      {modalCaja && (
        <ModalCaja 
          onClose={() => setModalCaja(false)}
          historial={historial}
          cajaTotal={cajaTotal}
        />
      )}

      {modalConfiguracion && (
        <ModalConfiguracion 
          onClose={() => setModalConfiguracion(false)}
          inputTaller={inputTaller}
          setInputTaller={setInputTaller}
          guardarNombreTaller={guardarNombreTaller}
          handleLogout={handleLogout}
        />
      )}

      {vehiculoInfo && (
        <ModalVehiculoInfo 
          vehiculoInfo={vehiculoInfo}
          onClose={() => setVehiculoInfo(null)}
        />
      )}

      {fotoForm && (
        <ModalEvidencia 
          fotoForm={fotoForm}
          setFotoForm={setFotoForm}
          handleSeleccionarFoto={handleSeleccionarFoto}
          subirFotoDefinitiva={subirFotoDefinitiva}
          subiendoFoto={subiendoFoto}
        />
      )}

      {modalItemVisible && (
        <ModalItem 
          itemForm={itemForm}
          setItemForm={setItemForm}
          guardarItemBD={guardarItemBD}
          guardandoItem={guardandoItem}
          onClose={() => setModalItemVisible(false)}
        />
      )}

      {modalScanner && (
        <ModalScanner 
          onClose={() => setModalScanner(false)}
          codigoScanner={codigoScanner}
          setCodigoScanner={setCodigoScanner}
          vehiculoScanner={vehiculoScanner}
          setVehiculoScanner={setVehiculoScanner}
          consultarScanner={consultarScanner}
          cargandoScanner={cargandoScanner}
          resultadoScanner={resultadoScanner}
        />
      )}

      {modalMarketing && (
        <ModalMarketing 
          onClose={() => setModalMarketing(false)}
          vehiculos={vehiculos}
          historial={historial}
          nombreTaller={nombreTaller}
        />
      )}
    </main>
  )
}