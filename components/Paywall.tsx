'use client'
import { useState } from 'react'
import { Lock, ShieldCheck, ArrowRight, AlertTriangle, Zap } from 'lucide-react'
import Image from 'next/image'

interface PaywallProps {
    tallerId: string;
    email: string;
    fechaVencimiento: string;
}

export default function Paywall({ tallerId, email, fechaVencimiento }: PaywallProps) {
    const [cargandoPago, setCargandoPago] = useState(false);

    const iniciarPago = async () => {
        setCargandoPago(true);
        try {
            // Llamamos a nuestro cerebro financiero (la API que creaste antes)
            const res = await fetch('/api/flow/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    taller_id: tallerId, 
                    email: email,
                    monto: 100 // Puedes cambiar el precio aquí si quieres
                })
            });
            
            const data = await res.json();
            
            if (data.url) {
                // Redirigimos al usuario a la pasarela de pago de Flow
                window.location.href = data.url;
            } else {
                alert("Error al conectar con el procesador de pagos: " + data.error);
                setCargandoPago(false);
            }
        } catch (error) {
            alert("Error de conexión. Revisa tu internet.");
            setCargandoPago(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Efecto visual de fondo (Rojo/Naranja indicando alerta) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

            <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-slate-800 shadow-2xl relative z-10 text-center">
                
                <div className="mx-auto w-20 h-20 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mb-6 relative">
                    <Lock className="text-orange-500" size={32} />
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                        Vencido
                    </div>
                </div>

                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Acceso <span className="text-orange-500">Restringido</span></h1>
                
                <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">
                    Tu suscripción a CALIBRE finalizó el <span className="text-slate-200">{new Date(fechaVencimiento).toLocaleDateString('es-CL')}</span>. 
                    Renueva tu acceso ahora para seguir gestionando tus órdenes, enviando reportes y manteniendo el control total de tu taller.
                </p>

                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 mb-8 text-left space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Zap size={14} className="text-emerald-500"/> Qué incluye tu renovación
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                        <ShieldCheck size={16} className="text-emerald-500" /> Órdenes de trabajo ilimitadas
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                        <ShieldCheck size={16} className="text-emerald-500" /> Actas de recepción 3D completas
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                        <ShieldCheck size={16} className="text-emerald-500" /> PDFs interactivos para clientes
                    </div>
                </div>

                <button 
                    onClick={iniciarPago}
                    disabled={cargandoPago}
                    className="w-full bg-emerald-600 text-slate-950 py-4 px-6 rounded-full font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:scale-100"
                >
                    {cargandoPago ? 'Conectando con pasarela segura...' : <>Pagar Mensualidad ($24.990) <ArrowRight size={16} /></>}
                </button>

                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-6 flex items-center justify-center gap-1">
                    <ShieldCheck size={10} /> Pago 100% seguro procesado por Flow
                </p>
            </div>
        </main>
    )
}