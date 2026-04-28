import { X, Users, PhoneForwarded, AlertTriangle, Clock, ShieldAlert, CalendarClock } from 'lucide-react';

export default function ModalCRM({ onClose, oportunidades = [], nombreTaller }: any) {

    // 🧠 MOTOR DE MENSAJES INTELIGENTES
    const generarMensajeWA = (op: any) => {
        const nombre = op.vehiculos?.clientes?.nombre?.split(' ')[0] || 'amigo/a';
        const vehiculo = `${op.vehiculos?.marca || ''} ${op.vehiculos?.modelo || ''}`.trim() || 'vehículo';
        const patente = op.vehiculos?.patente || '';
        const pieza = op.pieza || 'mantenimiento general';
        const taller = nombreTaller || 'nuestro taller';

        let texto = '';

        if (op.tipo_alerta === 'Rojo') {
            texto = `Hola ${nombre}, te escribimos de ${taller}. Revisando la ficha de tu ${vehiculo} (${patente}), el sistema nos arrojó una alerta crítica pendiente en: ${pieza}. Por tu seguridad, te sugerimos agendar una revisión pronto. ¿Te ayudo con una hora para esta semana?`;
        } else if (op.tipo_alerta === 'Amarillo') {
            texto = `Hola ${nombre}, somos de ${taller}. Hace un tiempo revisamos tu ${vehiculo} (${patente}) y dejamos una observación preventiva en: ${pieza}. Ya es buen momento para revisarlo antes de que se convierta en una falla mayor. ¿Quieres que lo miremos?`;
        } else {
            texto = `Hola ${nombre}, soy de ${taller}. ¡Hace tiempo no vemos tu ${vehiculo} (${patente})! Te escribimos para recordarte que ya debe tocarle su mantención preventiva para que siga rindiendo al 100%. ¿Te gustaría agendar una hora?`;
        }

        return encodeURIComponent(texto);
    };

    const formatearTelefono = (tel: string) => {
        if (!tel) return '';
        let limpio = tel.replace(/\D/g, '');
        // Si es de Chile y no tiene el 56, se lo agregamos (Ajusta esto según tu país si es necesario)
        if (limpio.length === 9) limpio = '56' + limpio; 
        return limpio;
    };

    // 🧠 CLASIFICACIÓN DE LEADS
    const leadsProcesados = oportunidades.map((v: any) => {
        // Buscamos si el motivo de que esté en la lista es una alerta roja, amarilla o solo por tiempo
        const alertasPendientes = v.alertas_desgaste?.filter((a: any) => a.estado === 'Pendiente') || [];
        const roja = alertasPendientes.find((a: any) => a.nivel_riesgo === 'Rojo');
        const amarilla = alertasPendientes.find((a: any) => a.nivel_riesgo === 'Amarillo');

        let tipo = 'Tiempo';
        let pieza = '';
        let icono = <CalendarClock className="text-blue-500" size={20} />;
        let colorTag = 'bg-blue-500/10 text-blue-500 border-blue-500/30';

        if (roja) {
            tipo = 'Rojo'; pieza = roja.pieza; icono = <ShieldAlert className="text-red-500" size={20} />; colorTag = 'bg-red-500/10 text-red-500 border-red-500/30';
        } else if (amarilla) {
            tipo = 'Amarillo'; pieza = amarilla.pieza; icono = <AlertTriangle className="text-yellow-500" size={20} />; colorTag = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
        }

        return { ...v, tipo_alerta: tipo, pieza, icono, colorTag };
    }).sort((a: any, b: any) => {
        // Ordenamos: Primero los rojos, luego amarillos, luego tiempo
        const orden: any = { 'Rojo': 1, 'Amarillo': 2, 'Tiempo': 3 };
        return orden[a.tipo_alerta] - orden[b.tipo_alerta];
    });


    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
            <div className="bg-slate-900 border border-slate-700/50 rounded-[35px] shadow-2xl max-w-5xl w-full relative overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

                <div className="flex justify-between items-center p-6 lg:p-8 border-b border-slate-800/50 relative z-10 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                            <Users className="text-orange-500" /> CRM & Fidelización
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Recuperación de clientes y ventas proactivas</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-orange-400 bg-slate-950/50 p-2 rounded-full border border-slate-800 transition-all hover:scale-110">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar-dark relative z-10">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-4">
                            <ShieldAlert className="text-red-500" size={32} />
                            <div>
                                <p className="text-xl font-black text-slate-100">{leadsProcesados.filter((l:any) => l.tipo_alerta === 'Rojo').length}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Riesgos Críticos</p>
                            </div>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-4">
                            <AlertTriangle className="text-yellow-500" size={32} />
                            <div>
                                <p className="text-xl font-black text-slate-100">{leadsProcesados.filter((l:any) => l.tipo_alerta === 'Amarillo').length}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Mantenimientos</p>
                            </div>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-4">
                            <CalendarClock className="text-blue-500" size={32} />
                            <div>
                                <p className="text-xl font-black text-slate-100">{leadsProcesados.filter((l:any) => l.tipo_alerta === 'Tiempo').length}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Clientes Dormidos</p>
                            </div>
                        </div>
                    </div>

                    {leadsProcesados.length === 0 ? (
                        <div className="text-center py-12 bg-slate-950/30 rounded-3xl border border-slate-800 border-dashed">
                            <Clock className="mx-auto text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400 font-bold">No hay oportunidades maduras por contactar en este momento.</p>
                            <p className="text-xs text-slate-500 mt-2">El sistema buscará alertas vencidas o clientes inactivos automáticamente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leadsProcesados.map((lead: any, i: number) => {
                                const telLimpio = formatearTelefono(lead.clientes?.telefono);
                                const puedeContactar = telLimpio.length >= 9;

                                return (
                                    <div key={i} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-orange-900/50 transition-colors group">
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-inner">
                                                {lead.icono}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-black text-slate-200 capitalize text-sm md:text-base">
                                                        {lead.clientes?.nombre || 'Cliente sin nombre'}
                                                    </h3>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest ${lead.colorTag}`}>
                                                        {lead.tipo_alerta}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    <span className="font-bold text-slate-300">{lead.patente}</span> • {lead.marca} {lead.modelo}
                                                </p>
                                                {lead.pieza && (
                                                    <p className="text-[10px] text-orange-400/80 font-bold uppercase mt-1">Foco: {lead.pieza}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto">
                                            {puedeContactar ? (
                                                <a 
                                                    href={`https://wa.me/${telLimpio}?text=${generarMensajeWA(lead)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full md:w-auto bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                >
                                                    <PhoneForwarded size={16} /> Enviar WhatsApp
                                                </a>
                                            ) : (
                                                <span className="w-full md:w-auto bg-slate-800 text-slate-500 border border-slate-700 px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center cursor-not-allowed">
                                                    Sin Teléfono Válido
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}