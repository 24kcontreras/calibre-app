'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, AlertTriangle, Info, FileText, ChevronDown, Palette } from 'lucide-react'
import toast from 'react-hot-toast'
import CAR_DATA from '@/app/taller/autos.json'
import { Session } from '@supabase/supabase-js'
import { Vehiculo, AlertaDesgaste } from '@/hooks/types'

const MARCAS = Object.keys(CAR_DATA).sort();

// 🔥 PALETA DE COLORES DE IDENTIDAD
const COLORES_AUTO = ['#94a3b8', '#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

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
  vehiculos: Vehiculo[];
  session: Session | null;
  cargarTodo: () => Promise<void>;
  abrirOrdenModal: (vehiculo: Vehiculo) => void;
  nombreTaller: string;
  abrirInfoModal?: (vehiculo: Vehiculo) => void; 
}

export default function Recepcion({ soloLectura, vehiculos, session, cargarTodo, abrirOrdenModal, nombreTaller, abrirInfoModal }: RecepcionProps) {
  const [loading, setLoading] = useState(false)
  const [recepcionAbierta, setRecepcionAbierta] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const [nombreInput, setNombreInput] = useState('')
  const [rutInput, setRutInput] = useState('')
  const [telefonoInput, setTelefonoInput] = useState('+569')
  const [correoInput, setCorreoInput] = useState('') 
  const [patenteInput, setPatenteInput] = useState('')
  const [marcaInput, setMarcaInput] = useState('')
  const [modeloInput, setModeloInput] = useState('') 
  // 🔥 ESTADO DEL COLOR (Gris por defecto)
  const [nuevoColor, setNuevoColor] = useState('#94a3b8')

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                color: nuevoColor, // 🔥 ENVIAMOS EL COLOR A SUPABASE
                cliente_id: finalId, 
                taller_id: tId 
            }]).select();
            if (errV) throw errV;
            
            if (nV && nV.length > 0) {
                toast.success("Vehículo registrado correctamente.");
                await cargarTodo();
                (document.getElementById('form-recepcion') as HTMLFormElement)?.reset();
                setMarcaInput(''); setModeloInput(''); setNombreInput(''); setRutInput('');
                setTelefonoInput('+569'); setCorreoInput(''); setPatenteInput(''); setNuevoColor('#94a3b8'); // Reiniciamos color
                
                abrirOrdenModal(nV[0]); 
            }
        }
    } catch (error: unknown) { 
        const msg = error instanceof Error ? error.message : "Error desconocido";
        toast.error("Error en registro: " + msg); 
    } 
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

  const rutSinFormato = rutInput.replace(/[^0-9kK]/g, '');
  const isRutValid = rutSinFormato.length >= 8 && validarRutChileno(rutInput);
  const isRutInvalid = rutSinFormato.length >= 8 && !isRutValid;

  const tLimpio = busqueda.replace(/[^a-zA-Z0-9kK]/g, '').toLowerCase()
  const vehiculosFiltrados = vehiculos.filter(v => 
    v.patente.toLowerCase().includes(tLimpio) || 
    (v.clientes?.nombre || '').toLowerCase().includes(tLimpio) ||
    (v.clientes?.rut || '').replace(/[^0-9kK]/g, '').includes(tLimpio)
  )

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

                    {/* 🔥 SELECTOR DE COLOR DEL VEHÍCULO */}
                    <div className="col-span-full bg-slate-950/50 p-4 rounded-2xl border border-slate-800 my-2 shadow-inner">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Palette size={14} className="text-emerald-500" /> Color del Vehículo
                        </label>
                        <div className="flex flex-wrap gap-2.5 justify-start md:justify-center">
                            {COLORES_AUTO.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setNuevoColor(c)}
                                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all duration-300 ${
                                        nuevoColor === c 
                                        ? 'border-emerald-500 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10' 
                                        : 'border-slate-700 hover:scale-110 hover:border-slate-500'
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={`Seleccionar color ${c}`}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <button disabled={loading || soloLectura} className="w-full bg-emerald-600 text-slate-950 py-4 rounded-full font-black shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all uppercase text-xs mt-3 disabled:opacity-50 hover:scale-[1.02] flex items-center justify-center gap-2">
                        {loading ? 'Procesando...' : <><Plus size={16}/> Registrar y Abrir Orden</>}
                    </button>
                </form>
            </div>
        </section>

        {/* SECCIÓN 2: BUSCADOR DE VEHÍCULOS (Ahora ocupa todo el espacio restante) */}
        <section className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col flex-1 min-h-[350px]">
            <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar Patente o RUT..." className="w-full p-3 pl-9 rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm uppercase text-xs font-bold text-slate-200 outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
            </div>
            
            <div className="space-y-2 mt-4 overflow-y-auto custom-scrollbar-dark pr-2 flex-1">
                 {vehiculosFiltrados.map(v => {
                     const alertaPendiente = v.alertas_desgaste?.find((a: AlertaDesgaste) => a.estado === 'Pendiente');
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
                                    <button 
                                        onClick={() => abrirInfoModal && abrirInfoModal(v)} 
                                        className="bg-blue-600/20 text-blue-400 p-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors" 
                                        title="Información y Contacto"
                                    >
                                        <Info size={12} />
                                    </button>
                                    
                                    <button disabled={soloLectura} onClick={() => abrirOrdenModal(v)} className="bg-emerald-600 text-slate-950 px-2 py-1.5 rounded-lg text-[9px] font-black hover:bg-emerald-500 disabled:opacity-50 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all">ORDEN</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                {/* 🔥 MUESTRA UN MINICÍRCULO DEL COLOR DEL AUTO EN LA LISTA */}
                                <div className="w-2 h-2 rounded-full border border-slate-600 shrink-0" style={{ backgroundColor: v.color || '#94a3b8' }}></div>
                                <p className="text-[9px] text-slate-500 uppercase truncate">{v.marca} {v.modelo} • {v.clientes?.nombre}</p>
                            </div>
                        </div>
                    </div>
                )})}
                
                {vehiculosFiltrados.length === 0 && (
                    <div className="text-center p-4 border border-dashed border-slate-800 rounded-xl h-full flex flex-col items-center justify-center min-h-[150px]">
                        <Search size={24} className="text-slate-700 mb-2"/>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No se encontraron vehículos.</p>
                    </div>
                )}
            </div>
        </section>
    </div>
  )
}