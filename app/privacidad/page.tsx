import { FileText, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-bold text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>

        <header className="mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 border border-slate-800 rounded-2xl mb-4 shadow-xl">
             <ShieldCheck className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-100 mb-2">
             Política de Privacidad
          </h1>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">
            CALIBRE OS • Última actualización: Abril 2026
          </p>
        </header>

        <section className="bg-slate-900/50 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-slate-800 shadow-2xl space-y-8 text-sm text-slate-300 leading-relaxed">
          
          <div>
            <h2 className="text-emerald-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={16} /> 1. Responsabilidad y Ley N° 19.628
            </h2>
            <p>CALIBRE actúa como una plataforma de gestión de datos (SaaS) orientada a talleres mecánicos. El taller suscrito es el responsable directo de la recolección, veracidad y tratamiento de los datos ingresados de sus clientes finales, en conformidad con la Ley N° 19.628 sobre Protección de la Vida Privada de la República de Chile.</p>
          </div>

          <div>
            <h2 className="text-emerald-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={16} /> 2. Datos Recopilados
            </h2>
            <p>El sistema permite a los talleres almacenar información técnica y de contacto estrictamente necesaria para la prestación del servicio, la cual incluye: RUT, Nombres, Teléfonos, Patentes e historial técnico de mantenciones y reparaciones de los vehículos.</p>
          </div>

          <div>
            <h2 className="text-emerald-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={16} /> 3. Uso de la Información
            </h2>
            <p>Los datos alojados en la plataforma se utilizan de manera automatizada exclusivamente para:</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-slate-400">
              <li>Generación de órdenes de trabajo, cotizaciones e informes técnicos (PDF).</li>
              <li>Envío de notificaciones de estado y alertas preventivas vía WhatsApp al cliente final.</li>
              <li>Generación de métricas internas de rendimiento (Telemetría) de uso exclusivo para la administración del taller.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-emerald-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={16} /> 4. Seguridad y Almacenamiento
            </h2>
            <p>La información es resguardada en servidores en la nube utilizando protocolos de encriptación modernos. Se aplican Políticas de Seguridad de Filas (Row Level Security - RLS) para garantizar que la base de datos de un taller esté completamente aislada y sea inaccesible para cualquier otra cuenta o taller suscrito a CALIBRE.</p>
          </div>

          <div>
            <h2 className="text-emerald-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={16} /> 5. No Transferencia a Terceros
            </h2>
            <p>CALIBRE garantiza que no comercializa, alquila, ni cede las bases de datos de los talleres a agencias de publicidad, corredoras de seguros u otros terceros bajo ninguna circunstancia.</p>
          </div>

        </section>
      </div>
    </main>
  );
}