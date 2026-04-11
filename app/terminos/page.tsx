import Link from 'next/link'
import { ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 p-6 md:p-20 selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-4xl mx-auto">
        
        {/* Header de la página */}
        <Link href="/" className="inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors mb-12 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Volver al inicio</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 border-b border-slate-900 pb-12">
            <div className="bg-emerald-500/10 p-4 rounded-3xl border border-emerald-500/20 shrink-0">
                <ShieldCheck className="text-emerald-500" size={40} />
            </div>
            <div>
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">Términos y Condiciones</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Última actualización: Abril 2026</p>
            </div>
        </div>

        {/* Intro */}
        <p className="text-slate-400 leading-relaxed mb-12 text-sm">
          Bienvenido a <strong>CALIBRE (Neural Garage OS)</strong>. Los siguientes Términos y Condiciones (en adelante, los "Términos") constituyen un contrato legalmente vinculante entre usted (en adelante, "el Usuario", "el Taller" o "el Suscriptor") y CALIBRE SOFTWARE. Al registrarse, acceder o utilizar nuestra plataforma web y sus herramientas, usted declara haber leído, entendido y aceptado íntegramente estos Términos.
        </p>

        {/* Contenido Legal Extenso */}
        <div className="space-y-16 text-sm leading-relaxed">
          
          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">01.</span> Descripción del Servicio y Licencia
            </h2>
            <p className="text-slate-400">
              CALIBRE es un software como servicio (SaaS) diseñado para la gestión operativa, administrativa y diagnóstica de talleres automotrices. La Empresa le otorga al Usuario una licencia de uso personal, intransferible, revocable y no exclusiva para acceder a la Plataforma. Queda estrictamente prohibido subarrendar, revender o realizar ingeniería inversa sobre la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">02.</span> Creación de Cuentas y Responsabilidad
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Credenciales:</strong> El Usuario es enteramente responsable de mantener la confidencialidad de su correo corporativo y contraseña. Toda acción realizada bajo su cuenta se presumirá hecha por el Usuario titular.</li>
              <li><strong>Uso indebido:</strong> CALIBRE no se responsabiliza por la pérdida de información, alteraciones de órdenes de trabajo o robo de datos de clientes derivados del uso de contraseñas débiles o accesos no autorizados por negligencia del Usuario.</li>
            </ul>
          </section>

          <section className="bg-red-950/20 p-8 rounded-[32px] border border-red-900/30">
            <h2 className="text-red-400 font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <AlertTriangle size={20} /> <span className="font-mono">03.</span> Exención Absoluta por Asistencia de IA
            </h2>
            <p className="text-slate-400 mb-4">La Plataforma integra herramientas de Inteligencia Artificial (IA), incluyendo la "Biblioteca Técnica" y el "Diagnóstico IA":</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Naturaleza referencial:</strong> Los datos generados por la IA (torques de culata, luces de válvulas, presiones, capacidades de fluidos, códigos OBD2, etc.) son aproximaciones probabilísticas y <strong>puramente referenciales</strong>. La IA está sujeta a "alucinaciones" (generación de datos falsos que parecen reales).</li>
              <li><strong>Obligación de verificación:</strong> CALIBRE <strong>NO reemplaza</strong> bajo ninguna circunstancia el manual oficial del fabricante (OEM) ni el criterio técnico y profesional del mecánico. Es obligación ineludible verificar todo dato numérico en las fuentes oficiales antes de intervenir un vehículo.</li>
              <li><strong>Exención de daños:</strong> La Empresa no asume responsabilidad civil, penal ni administrativa por daños físicos a personas, daños catastróficos a motores o vehículos, lucro cesante o cualquier otro perjuicio derivado de la aplicación de la información proporcionada por la IA de CALIBRE.</li>
            </ul>
          </section>

            <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">04.</span> Evidencia Fotográfica
            </h2>
            <p className="text-slate-400 mb-2">CALIBRE permite la captura y subida de imágenes para la documentación del estado del vehículo:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
                <li>El Usuario declara y garantiza que posee el derecho legal o el consentimiento explícito del dueño del vehículo para fotografiar su automóvil y componentes.</li>
                <li>Estas imágenes se almacenan de forma segura en la nube y se utilizan exclusivamente para el respaldo técnico de la orden de trabajo.</li>
            </ul>
            </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">05.</span> Tratamiento de Datos (Ley N° 19.628)
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Rol de la Empresa:</strong> CALIBRE actúa exclusivamente como <em>Encargado del Tratamiento</em> de la infraestructura en la nube. Proveemos el espacio lógico (servidores) para que el Usuario almacene su información.</li>
              <li><strong>Rol del Usuario:</strong> El Taller actúa como <em>Responsable de los Datos</em> de sus propios clientes (RUT, nombres, teléfonos, historial). Es responsabilidad del Taller obtener el consentimiento previo de sus clientes para almacenar esta información.</li>
              <li><strong>Indemnidad:</strong> El Usuario exime a CALIBRE de cualquier reclamo o demanda derivada de un mal manejo de los datos de sus clientes finales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">06.</span> Integración con Terceros
            </h2>
            <p className="text-slate-400">
              La plataforma genera enlaces directos para facilitar la comunicación vía WhatsApp. CALIBRE no tiene asociación con Meta Platforms Inc. Si la cuenta de WhatsApp del Usuario es suspendida por enviar spam o violar políticas de Meta, CALIBRE no tendrá responsabilidad alguna. El servicio también depende de la estabilidad de proveedores globales (ej. Vercel, Supabase).
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">07.</span> Planes, Pagos y Facturación
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>Las suscripciones se cobrarán por adelantado según el plan elegido.</li>
              <li>Los pagos no son reembolsables por periodos no utilizados en caso de cancelación anticipada.</li>
              <li>CALIBRE se reserva el derecho de modificar los precios notificando con 30 días de anticipación.</li>
              <li>La Empresa podrá bloquear el acceso a la cuenta si el pago no se acredita en la fecha de vencimiento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">08.</span> Disponibilidad y "As Is"
            </h2>
            <p className="text-slate-400">
              El servicio se entrega "tal cual" (As is) y "según disponibilidad". No garantizamos que el software esté 100% libre de errores o interrupciones. El Usuario es responsable de mantener un control paralelo o exportar sus registros vitales periódicamente ante eventuales fallos masivos en la nube.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">09.</span> Suspensión del Servicio
            </h2>
            <p className="text-slate-400">
              La Empresa se reserva el derecho unilateral de suspender cuentas que realicen intentos de hackeo (DDoS, Scraping), compartan credenciales para evadir licencias adicionales, o utilicen la plataforma para actividades ilícitas (ej. desarmadurías clandestinas o blanqueo de patentes).
            </p>
          </section>

          <section className="bg-slate-900/80 p-8 md:p-10 rounded-[32px] border border-slate-700 shadow-2xl">
            <h2 className="text-white font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-lg">
               <span className="text-emerald-500 font-mono">10.</span> Límite Máximo de Responsabilidad
            </h2>
            <p className="text-slate-400 italic text-base leading-relaxed">
              "En la medida máxima permitida por la ley aplicable, la responsabilidad total acumulada de CALIBRE SOFTWARE frente al Usuario por cualquier reclamo derivado de estos Términos, el uso del software, pérdida de datos o fallos de la IA, <strong>estará limitada estrictamente al monto total que el Usuario haya pagado a la Empresa por concepto de suscripción durante los últimos tres (3) meses</strong> anteriores al evento que originó el reclamo. Si el Usuario utiliza una versión gratuita, la responsabilidad de CALIBRE será cero ($0)."
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">11.</span> Modificaciones a los Términos
            </h2>
            <p className="text-slate-400">
              CALIBRE podrá modificar estos Términos y Condiciones en cualquier momento. Cualquier actualización significativa será notificada. El uso continuo de la Plataforma después de dicha modificación constituye la aceptación tácita.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-lg">
                <span className="text-emerald-500 font-mono">12.</span> Ley Aplicable y Jurisdicción
            </h2>
            <p className="text-slate-400">
              Estos Términos y Condiciones se regirán por las leyes de la República de Chile. Cualquier dificultad, disputa o controversia será sometida a la jurisdicción de los Tribunales Ordinarios de Justicia de la ciudad y comuna de Santiago.
            </p>
          </section>

        </div>

        <footer className="mt-24 pt-12 border-t border-slate-900 text-center pb-8">
            <div className="flex justify-center mb-4 opacity-50">
                <ShieldCheck size={24} className="text-slate-600" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Calibre Software — Neural Garage OS <br className="md:hidden" />
                <span className="hidden md:inline"> | </span> 
                Documento Legal Vinculante
            </p>
        </footer>
      </div>
    </main>
  )
}