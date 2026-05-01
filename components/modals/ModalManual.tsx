'use client'
import { useState } from 'react'
import { X, BookOpen, Rocket, ClipboardList, Bot, ShieldCheck, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface ModalManualProps {
    onClose: () => void;
}

interface Section {
    title: string;
    icon: React.ReactNode;
    summary: string;
    steps: { step: string; desc: string }[];
    color: string;
}

export default function ModalManual({ onClose }: ModalManualProps) {
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    const sections: Section[] = [
        {
            title: "1. Primeros Pasos",
            icon: <Rocket className="text-emerald-400" size={20} />,
            color: "emerald",
            summary: "Configura la identidad de tu negocio y personaliza tus reportes.",
            steps: [
                { step: "Acceso", desc: "Haz clic en el icono de engranaje (Ajustes) en la parte superior derecha." },
                { step: "Identidad", desc: "Sube el logo de tu taller. Este logo aparecerá automáticamente en todos los PDF que entregues al cliente." },
                { step: "Datos Legales", desc: "Ingresa la dirección física y el teléfono de contacto. Asegúrate de que el teléfono sea el de WhatsApp." },
                { step: "Garantía", desc: "Escribe los términos de tu garantía (ej: '90 días en mano de obra'). Esto protege tu negocio legalmente." },
                { step: "Finalizar", desc: "Haz clic en 'Guardar Ajustes' para aplicar los cambios." }
            ]
        },
        {
            title: "2. Recepción de Vehículos",
            icon: <ClipboardList className="text-blue-400" size={20} />,
            color: "blue",
            summary: "Documenta el estado inicial para evitar reclamos y generar confianza.",
            steps: [
                { step: "Ingreso", desc: "En la sección Recepción, ingresa la patente y los datos del cliente." },
                { step: "Mapeo 3D", desc: "Abre el Visor 3D. Rota el vehículo y coloca marcadores rojos en cada rayón o abolladura existente." },
                { step: "Estado Interno", desc: "Seta el nivel de combustible en el medidor y marca los testigos encendidos en el tablero." },
                { step: "Inventario", desc: "Registra cualquier objeto de valor dejado en el auto (ej: 'Soporte celular, Gafas')." },
                { step: "Cierre", desc: "Haz clic en 'Registrar Orden' para mover el vehículo a la Pizarra." }
            ]
        },
        {
            title: "3. Gestión de la Pizarra",
            icon: <ShieldCheck className="text-purple-400" size={20} />,
            color: "purple",
            summary: "Controla el flujo de trabajo y la rentabilidad de cada unidad.",
            steps: [
                { step: "Flujo Kanban", desc: "Mueve la orden entre columnas: Diagnóstico → Aprobación → Repuestos → Reparación → Entrega." },
                { step: "Carga de Ítems", desc: "Dentro de la orden, agrega cada servicio y repuesto. El sistema calculará el total automáticamente." },
                { step: "Evidencia", desc: "Sube fotos del proceso (piezas viejas vs nuevas). Esto justifica el cobro al cliente." },
                { step: "Notas Técnicas", desc: "Usa los comentarios para dejar instrucciones a otros mecánicos sobre la orden." }
            ]
        },
        {
            title: "4. Inteligencia Artificial",
            icon: <Bot className="text-orange-400" size={20} />,
            color: "orange",
            summary: "Usa el Cerebro Gemini para diagnósticos precisos y cierres de venta.",
            steps: [
                { step: "Scanner IA", desc: "Abre el Scanner IA, ingresa un código DTC (ej: P0300) o un síntoma. Recibirás causas probables y pasos de revisión." },
                { step: "Asistente Técnico", desc: "Consulta sobre torques de culata o capacidades de aceite sin buscar manuales físicos." },
                { step: "Resumen de Entrega", desc: "Al finalizar, usa la IA para redactar el informe final. Convierte una lista de repuestos en un texto profesional y persuasivo." }
            ]
        },
        {
            title: "5. Live Tracker",
            icon: <BookOpen className="text-emerald-400" size={20} />,
            color: "emerald",
            summary: "Elimina las llamadas de seguimiento y ofrece transparencia total.",
            steps: [
                { step: "Obtener Link", desc: "En la orden, busca el botón de enlace público (/estado/[id])." },
                { step: "Envío", desc: "Copia el link y envíalo por WhatsApp al cliente." },
                { step: "Vista Cliente", desc: "El cliente verá el progreso en vivo y la evidencia 3D, pero NO verá tus costos internos de repuestos." }
            ]
        },
        {
            title: "6. Agenda Predictiva",
            icon: <Rocket className="text-blue-400" size={20} />,
            color: "blue",
            summary: "No esperes a que el cliente venga; llámalo tú cuando necesite el servicio.",
            steps: [
                { step: "Detectar Desgaste", desc: "Durante la reparación, si ves una pieza desgastada, abre 'Alerta de Desgaste'." },
                { step: "Clasificar Riesgo", desc: "Marca como Amarillo (Preventivo) o Rojo (Urgente)." },
                { step: "Seguimiento", desc: "Ve a Telemetría para ver qué clientes tienen alertas vencidas y contáctalos para agendar la cita." }
            ]
        },
        {
            title: "7. Suscripción",
            icon: <CreditCard className="text-red-400" size={20} />,
            color: "red",
            summary: "Mantén tu acceso activo para no interrumpir la operación del taller.",
            steps: [
                { step: "Control de Plan", desc: "Revisa los días restantes en el panel de Ajustes." },
                { step: "Renovación", desc: "Haz clic en 'Renovar Mes' y completa el pago seguro vía Flow." },
                { step: "Modo Lectura", desc: "Si el plan vence, la app entrará en Modo Solo Lectura. Podrás ver datos, pero no crear nuevas órdenes." }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-3">
                        {selectedSection ? (
                            <button 
                                onClick={() => setSelectedSection(null)} 
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                            >
                                <ArrowLeft size={16} /> Volver
                            </button>
                        ) : (
                            <div className="bg-emerald-500/20 p-2 rounded-xl">
                                <BookOpen className="text-emerald-500" size={24} />
                            </div>
                        )}
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                            {selectedSection ? selectedSection.title : "Manual de Usuario"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar-dark flex-1">
                    {!selectedSection ? (
                        <div className="space-y-6">
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                Bienvenido a <strong className="text-emerald-400">CALIBRE</strong>. Selecciona una función para aprender a utilizarla paso a paso.
                            </p>

                            <div className="grid grid-cols-1 gap-4">
                                {sections.map((section, index) => (
                                    <button 
                                        key={index} 
                                        onClick={() => setSelectedSection(section)}
                                        className="w-full text-left p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all group flex items-start gap-4"
                                    >
                                        <div className="mt-1 shrink-0">{section.icon}</div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider mb-1 group-hover:text-emerald-400 transition-colors">
                                                {section.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {section.summary}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-slate-800/30 p-4 rounded-2xl border-l-4 border-emerald-500">
                                <p className="text-sm text-slate-300 italic leading-relaxed">
                                    {selectedSection.summary}
                                </p>
                            </div>

                            <div className="space-y-6 relative">
                                {/* Línea conectora vertical */}
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-800"></div>

                                {selectedSection.steps.map((item, index) => (
                                    <div key={index} className="relative pl-10 flex gap-4">
                                        <div className="absolute left-0 top-1 w-8 h-8 bg-slate-900 border-2 border-emerald-500 rounded-full flex items-center justify-center z-10 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                        <div className="flex-1 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:bg-slate-800/60 transition-colors">
                                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">
                                                Paso {index + 1}: {item.step}
                                            </h4>
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 text-center shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-8 py-2 bg-emerald-600 text-slate-950 rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                    >
                        Cerrar Manual
                    </button>
                </div>
            </div>
        </div>
    )
}
