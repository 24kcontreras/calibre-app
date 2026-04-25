'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, AlertTriangle, PhoneForwarded, CheckCircle2, Info, Bot, MessageSquare, FileText, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import CAR_DATA from '@/app/taller/autos.json' // ⚠️ Verifica que esta ruta apunte a tu JSON

const MARCAS = Object.keys(CAR_DATA).sort();

// 🔥 VALIDADOR DE RUT
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

interface RecepcionProps {
  soloLectura: boolean;
  vehiculos: any[];
  oportunidadesVenta: any[];
  session: any;
  cargarTodo: () => Promise<void>;
  abrirOrdenModal: (vehiculo: any) => void;
  nombreTaller: string;
}

export default function Recepcion({ soloLectura, vehiculos, oportunidadesVenta, session, cargarTodo, abrirOrdenModal, nombreTaller }: RecepcionProps) {
  const [loading, setLoading] = useState(false)
  const [recepcionAbierta, setRecepcionAbierta] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [tabIzquierda, setTabIzquierda] = useState<'alertas' | 'agenda'>('alertas')

  // Estados del Formulario
  const [nombreInput, setNombreInput] = useState('')
  const [rutInput, setRutInput] = useState('')
  const [telefonoInput, setTelefonoInput] = useState('+569')
  const [correoInput, setCorreoInput] = useState('') 
  const [patenteInput, setPatenteInput] = useState('')
  const [marcaInput, setMarcaInput] = useState('')
  const [modeloInput, setModeloInput] = useState('') 

  const handleRutChange = (e: any) => {
      let v = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
      if (v.length > 1) v = v.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + v.slice(-1);
      setRutInput(v);

      const rutLimpio = v;
      const vehiculoConCliente = vehiculos.find(veh => veh.clientes?.rut === rutLimpio);
      
      if (vehiculoConCliente && vehiculoConCliente.clientes) {
          setNombreInput(vehiculoConCliente.clientes.nombre || '');
          if (vehiculoConCliente.clientes.telefono) setTelefonoInput(vehiculoConCliente.clientes.telefono);
          if (vehiculoConCliente.clientes.correo) setCorreoInput(vehiculoConCliente.clientes.correo);
      }
  }

  const ejecutarRegistroCompleto = async (cId: string | null, fd: FormData) => {
    let finalId = cId;
    const tId = session?.user?.id;
    try {
        if (!finalId) {
            const payloadCliente = { nombre: nombreInput, telefono: telefonoInput, correo: correoInput || null, rut: rutInput, taller_id: tId }; 
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
                setMarcaInput(''); setModeloInput(''); setNombreInput(''); setRutInput('');
                setTelefonoInput('+569'); setCorreoInput(''); setPatenteInput('');
                
                abrirOrdenModal(nV[0]); 
            }
        }
    } catch (error: any) { toast.error("Error en registro: " + error.message); } 
    finally { setLoading(false); }
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

  const llamarARevisionWhatsapp = (vehiculo: any) => {
      const telefono = vehiculo.clientes?.telefono;
      const cliente = vehiculo.clientes?.nombre || 'Estimado(a)';
      const modelo = `${vehiculo.marca} ${vehiculo.modelo}`;
      const msj = `Hola ${cliente} 👋, te escribimos de ${nombreTaller}. \nTe contactamos porque tenemos registrado que a tu ${modelo} (Patente: ${vehiculo.patente}) le corresponde una revisión pendiente. ¿Te gustaría agendar una cita esta semana? 🔧`;
      if (telefono && telefono.startsWith('+569') && telefono.length === 12) {
          window.open(`https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(msj)}`, '_blank');
      } else { toast.error("El cliente no tiene un teléfono válido registrado."); }
  }

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
      } else { toast.error("El cliente no tiene un teléfono válido registrado."); }
  };

  const resolverAlertaDirecta = async (alertaId: string) => {
      if (soloLectura) return;
      try {
          await supabase.from('alertas_desgaste').update({ estado: 'Resuelta' }).eq('id', alertaId);
          toast.success("¡Alerta marcada como resuelta!");
          await cargarTodo();
      } catch (error) { toast.error("Error al actualizar la alerta"); }
  }

  const rutSinFormato = rutInput.replace(/[^0-9kK]/g, '');
  const isRutValid = rutSinFormato.length >= 8 && validarRutChileno(rutInput);
  const isRutInvalid = rutSinFormato.length >= 8 && !isRutValid;

  const tLimpio = busqueda.replace(/[^a-zA-Z0-9kK]/g, '').toLowerCase()
  const vehiculosFiltrados = vehiculos.filter(v => 
    v.patente.toLowerCase().includes(tLimpio) || 
    (v.clientes?.nombre || '').toLowerCase().includes(tLimpio) ||
    (v.clientes?.rut || '').replace(/[^0-9kK]/g, '').includes(tLimpio)
  )

  const vehiculosConAlertas = vehiculos.filter(v => v.alertas_desgaste?.some((a: any) => a.estado === 'Pendiente'));

  return (
    <div className="space-y-4 md:space-y-6 h-full flex flex-col">
        {/* SECCIÓN 1: FORMULARIO RECEPCIÓN */}
        <section className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-700/50 relative overflow-hidden shrink-0">
            <div className="flex items-center justify-between">
                <button 
                    type="button"
                    onClick={() => setRecepcionAbierta(!recepcionAbierta)}
                    className="flex items-center gap-2 text-xl font-black text-slate-100 uppercase tracking-tighter focus:outline-none md:cursor-default"
                >
                    Recepción <FileText className="text-emerald-500" size={20} />
                    <ChevronDown className={`md:hidden text-emerald-500 transition-transform duration-300 ${recepcionAbierta ? 'rotate-180' : ''}`} size={24} />
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

        {/* SECCIÓN 2: BUSCADOR */}
        <section className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-700/50 shrink-0">
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
                                    <button disabled={soloLectura} onClick={() => abrirOrdenModal(v)} className="bg-emerald-600 text-slate-950 px-2 py-1.5 rounded-lg text-[9px] font-black hover:bg-emerald-500 disabled:opacity-50 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all">ORDEN</button>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-500 uppercase truncate mt-1">{v.clientes?.nombre}</p>
                        </div>
                    </div>
                )})}
            </div>
        </section>

        {/* SECCIÓN 3: PESTAÑAS (TABS) ALERTAS/AGENDA */}
        <section className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col flex-1 min-h-[320px]">
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
  )
}