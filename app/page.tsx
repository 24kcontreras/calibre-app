'use client'
import { useState, useEffect } from 'react' 
import { useRouter } from 'next/navigation' 
import { supabase } from '@/lib/supabase' 
import Link from 'next/link'
import Image from 'next/image' 
import { ArrowRight, Bot, FileText, CheckCircle, Star, Shield, LineChart, LayoutDashboard, Lock, BookOpen, Database, MessageCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react' 

export default function LandingPage() {
  const router = useRouter()
  const [comprobandoSesion, setComprobandoSesion] = useState(true)

  // 🔥 ESTADO PARA EL CARRUSEL MÓVIL
  const [slideActivo, setSlideActivo] = useState(0);

  const slideAnterior = () => {
      setSlideActivo((prev) => (prev === 0 ? 5 : prev - 1));
  };
  
  const slideSiguiente = () => {
      setSlideActivo((prev) => (prev === 5 ? 0 : prev + 1));
  };

  useEffect(() => {
    const revisarSiYaTieneLlave = async () => {
      const { data } = await supabase.auth.getSession();
      
      // 🛡️ BLOQUEO DE REDIRECCIÓN: Si el usuario tiene sesión pero viene de un flujo de reseteo,
      // NO lo mandamos a /taller para evitar que entre sin cambiar la clave.
      const isResetFlow = window.location.search.includes('next=/actualizar-password') || 
                          window.location.pathname.includes('actualizar-password');

      if (data.session && !isResetFlow) {
        router.push('/taller'); 
      } else {
        setComprobandoSesion(false);
      }
    };
    
    revisarSiYaTieneLlave();
  }, [router]);

  if (comprobandoSesion) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
              <Loader2 className="text-emerald-500 animate-spin" size={48} />
          </div>
      );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-hidden">
        
      {/* 🟢 BARRA DE NAVEGACIÓN */}
      <nav className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
                <Image 
                    src="/logo-calibre.png" 
                    alt="Logo Calibre" 
                    width={28} 
                    height={28} 
                    className="object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />
                <span className="text-xl font-black uppercase tracking-tighter">Calibre<span className="text-emerald-500">.</span></span>
            </div>
            <Link href="/taller" className="bg-slate-800 text-slate-200 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all">
                Iniciar Sesión
            </Link>
        </div>
      </nav>

      {/* 🟢 SECCIÓN PRINCIPAL (HERO) */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-20 flex flex-col items-center text-center z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[150px] pointer-events-none -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Actualiza tu taller
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
            El Taller del Futuro, <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                ES EL TUYO.
            </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 font-bold leading-relaxed">
            Elimina el papel, los presupuestos perdidos en WhatsApp y los clientes enojados. Controla tus ingresos, vehículos y mecánicos con el poder de la Inteligencia Artificial.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
            <Link href="/taller" className="group flex items-center justify-center gap-3 bg-emerald-600 text-slate-950 px-8 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                Empezar Gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>

        {/* 🔥 PRUEBA SOCIAL ACTUALIZADA */}
        <div className="flex flex-col items-center gap-3 mb-16">
            <div className="flex -space-x-3">
                {['TM', 'AM', 'RC', 'MS'].map((initials, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-slate-300 tracking-widest">
                        {initials}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <div className="flex text-emerald-500">
                    <Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/>
                </div>
                <span>Talleres a lo largo del país ya operan con Calibre</span>
            </div>
        </div>

        {/* 🟢 MOCKUP VISUAL DEL SISTEMA (Oculto en móviles con hidden md:block) */}
        <div className="hidden md:block w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-t-3xl rounded-b-lg shadow-2xl overflow-hidden relative">
            <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                <div className="ml-4 bg-slate-900 border border-slate-700 px-3 py-1 rounded-md text-[10px] text-slate-500 font-mono flex-1 text-center max-w-sm mx-auto flex items-center justify-center gap-2">
                    <Lock size={10} className="text-emerald-500" /> calibreos.com/taller
                </div>
            </div>
            <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 opacity-90">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-left">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-20 h-6 bg-slate-800 rounded-md animate-pulse"></div>
                            <div className="w-16 h-4 bg-emerald-900/30 rounded-full border border-emerald-800"></div>
                        </div>
                        <div className="w-32 h-4 bg-slate-800 rounded-md mb-2"></div>
                        <div className="w-24 h-3 bg-slate-800/50 rounded-md mb-6"></div>
                        <div className="w-full h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center px-4">
                            <div className="w-8 h-8 rounded-full bg-slate-800 mr-3"></div>
                            <div className="w-20 h-3 bg-slate-800 rounded-md"></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950 to-transparent"></div>
        </div>
      </section>

      {/* 🟢 SECCIÓN DE BENEFICIOS CON CARRUSEL INTERACTIVO */}
      <section id="beneficios" className="w-full bg-slate-900 border-t border-slate-800 py-24 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-100">Por qué elegir <span className="text-emerald-500">Calibre</span></h2>
                <p className="mt-4 text-slate-400 font-bold max-w-2xl mx-auto">Un ecosistema completo diseñado para que dejes de apagar incendios y empieces a crecer.</p>
            </div>

            {/* 🔥 VISTA MÓVIL: CARRUSEL CONTROLADO */}
            <div className="md:hidden relative w-full pb-12">
                <div className="overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 relative min-h-[380px]">
                    <div 
                        className="flex transition-transform duration-500 ease-in-out h-full"
                        style={{ transform: `translateX(-${slideActivo * 100}%)` }}
                    >
                        {/* Slide 1 */}
                        <div className="w-full flex-shrink-0 py-8 px-12 flex flex-col justify-center">
                            <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 mx-auto">
                                <LayoutDashboard className="text-emerald-500" size={32} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-center">Pizarra Inteligente</h3>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed text-center">Visualiza todos los vehículos en tiempo real. Asigna mecánicos, actualiza estados y controla los tiempos de entrega con un solo clic.</p>
                        </div>
                        {/* Slide 2 */}
                        <div className="w-full flex-shrink-0 py-8 px-12 flex flex-col justify-center">
                            <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 mx-auto">
                                <Bot className="text-blue-500" size={32} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-center">Diagnóstico IA</h3>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed text-center">Ingresa códigos de falla o síntomas, y nuestra IA te entregará probabilidades de diagnóstico, torques referenciales y pasos a seguir.</p>
                        </div>
                        {/* Slide 3 */}
                        <div className="w-full flex-shrink-0 py-8 px-12 flex flex-col justify-center">
                            <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 mx-auto">
                                <BookOpen className="text-purple-500" size={32} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-center">Manual Técnico IA</h3>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed text-center">Accede a especificaciones exactas en segundos. Consulta torques de apriete, luz de válvulas y capacidades sin perder horas en internet.</p>
                        </div>
                        {/* Slide 4 */}
                        <div className="w-full flex-shrink-0 py-8 px-12 flex flex-col justify-center">
                            <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 mx-auto">
                                <Database className="text-cyan-500" size={32} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-center">Historial Clínico Auto</h3>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed text-center">Mantén un registro inmutable de mantenimientos, kilometrajes y reparaciones previas por cada vehículo que visita tus instalaciones.</p>
                        </div>
                        {/* Slide 5 */}
                        <div className="w-full flex-shrink-0 py-8 px-12 flex flex-col justify-center">
                            <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 mx-auto">
                                <MessageCircle className="text-green-500" size={32} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-center">Enlaces a WhatsApp</h3>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed text-center">Envía recordatorios, presupuestos y notificaciones de vehículo listo directo al celular de tu cliente en segundos.</p>
                        </div>
                        {/* Slide 6 */}
                        <div className="w-full flex-shrink-0 py-8 px-12 flex flex-col justify-center">
                            <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 mx-auto">
                                <FileText className="text-orange-500" size={32} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-center">Informes Profesionales</h3>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed text-center">Genera reportes técnicos en formato PDF con el logo de tu taller. Transmite transparencia y justifica el valor de tus servicios.</p>
                        </div>
                    </div>

                    {/* Controles de Flechas Flotantes (Más sutiles y con espacio) */}
                    <button onClick={slideAnterior} className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 bg-slate-900/90 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-400 border border-slate-700/50 backdrop-blur-md z-10 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={slideSiguiente} className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 bg-slate-900/90 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-400 border border-slate-700/50 backdrop-blur-md z-10 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Indicadores (Puntos) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <button 
                            key={index} 
                            onClick={() => setSlideActivo(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${slideActivo === index ? 'w-6 bg-emerald-500' : 'w-2 bg-slate-700 hover:bg-slate-500'}`}
                            aria-label={`Ir al slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* 🔥 VISTA PC: GRILLA NORMAL */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Pizarra */}
                <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800 hover:border-emerald-500/50 transition-colors group">
                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-800">
                        <LayoutDashboard className="text-emerald-500" size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Pizarra Inteligente</h3>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">Visualiza todos los vehículos en tiempo real. Asigna mecánicos, actualiza estados y controla los tiempos de entrega con un solo clic.</p>
                </div>

                {/* 2. diagnóstico IA */}
                <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800 hover:border-blue-500/50 transition-colors group">
                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-800">
                        <Bot className="text-blue-500" size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Diagnóstico IA</h3>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">Ingresa códigos de falla o síntomas, y nuestra IA te entregará probabilidades de diagnóstico, torques referenciales y pasos a seguir.</p>
                </div>

                {/* 3. manual */}
                <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800 hover:border-purple-500/50 transition-colors group">
                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-800">
                        <BookOpen className="text-purple-500" size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Manual Técnico IA</h3>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">Accede a especificaciones exactas en segundos. Consulta torques de apriete, luz de válvulas y capacidades sin perder horas en internet.</p>
                </div>

                {/* 4. Base de Datos / Historial */}
                <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800 hover:border-cyan-500/50 transition-colors group">
                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-800">
                        <Database className="text-cyan-500" size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Historial Clínico Auto</h3>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">Mantén un registro inmutable de mantenimientos, kilometrajes y reparaciones previas por cada vehículo que visita tus instalaciones.</p>
                </div>

                {/* 5. Conexión WhatsApp */}
                <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800 hover:border-green-500/50 transition-colors group">
                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-800">
                        <MessageCircle className="text-green-500" size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Enlaces a WhatsApp</h3>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">Envía recordatorios, presupuestos y notificaciones de vehículo listo directo al celular de tu cliente en segundos.</p>
                </div>

                {/* 6. Informes PDF */}
                <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800 hover:border-orange-500/50 transition-colors group">
                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-800">
                        <FileText className="text-orange-500" size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Informes Profesionales</h3>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">Genera reportes técnicos en formato PDF con el logo de tu taller. Transmite transparencia y justifica el valor de tus servicios.</p>
                </div>
            </div>
        </div>
      </section>

      {/* 🟢 SECCIÓN PROFUNDA (FEATURE IZQ/DER) */}
      <section className="w-full bg-slate-950 py-24 relative z-10 border-t border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
                <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
                    <LineChart className="text-blue-400" size={24} />
                </div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">Conoce los números <br/><span className="text-blue-400">reales de tu negocio.</span></h2>
                <p className="text-slate-400 font-bold mb-8 leading-relaxed">
                    Deja de adivinar si este mes fue bueno o malo. Nuestra telemetría financiera te muestra el flujo de caja, el ticket promedio por auto y el margen de ganancia entre repuestos y mano de obra en tiempo real.
                </p>
                <ul className="space-y-4">
                    {['Flujo de caja automatizado', 'Reporte de mecánicos más productivos', 'Marcas de autos más rentables'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-black text-slate-300 uppercase tracking-wider">
                            <CheckCircle className="text-emerald-500" size={16} /> {item}
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
                <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 relative z-10 shadow-2xl">
                    <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ingresos del Mes</p>
                            <p className="text-4xl font-black text-slate-100">$2.450.000</p>
                        </div>
                        <div className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-800 flex items-center gap-1">
                            +15%
                        </div>
                    </div>
                    <div className="flex items-end gap-4 h-32">
                        {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
                            <div key={i} className="w-full bg-slate-800 rounded-t-md relative group">
                                <div className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-t-md transition-all duration-500 group-hover:bg-blue-400" style={{height: `${h}%`}}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 🟢 FOOTER CTA (Llamado a la acción) */}
      <section className="w-full max-w-4xl mx-auto px-6 py-24 text-center relative z-10">
        <Shield className="text-slate-700 mx-auto mb-6" size={48} />
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">Tu taller, blindado en la nube.</h2>
        <p className="text-slate-400 font-bold mb-10 max-w-xl mx-auto">Únete a la nueva era de la gestión automotriz. Trabajamos en base a sistemas internacionales con seguridad de nivel bancario para que tu información y la de tus clientes esté 100% protegida.</p>
        <Link href="/taller" className="inline-flex items-center justify-center gap-3 bg-emerald-600 text-slate-950 px-10 py-6 rounded-full font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            Ingresar a mi Taller <ArrowRight size={18} />
        </Link>
      </section>

      {/* 🟢 FOOTER CORPORATIVO */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 group cursor-default">
                <Image 
                    src="/logo-calibre.png" 
                    alt="Logo Calibre" 
                    width={20} 
                    height={20} 
                    className="object-contain opacity-50 group-hover:opacity-100 transition-opacity"
                />
                <span className="text-lg font-black uppercase tracking-tighter text-slate-300">
                    Calibre<span className="text-emerald-500">.</span>
                </span>
            </div>

            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">
                © 2026 Calibre Software. Todos los derechos reservados.
            </div>

            <div className="flex gap-8">
                <Link href="/soporte" className="text-[10px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-all hover:translate-y-[-1px]">
                    Soporte
                </Link>
                <Link href="/privacidad" className="text-[10px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-all hover:translate-y-[-1px]">
                    Privacidad
                </Link>
                <Link href="/terminos" className="text-[10px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-all hover:translate-y-[-1px]">
                    Términos
                </Link>
            </div>
        </div>
      </footer>
    </main>
  )
}