'use client'
import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Escuchamos el evento nativo del navegador que indica que la PWA es instalable
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Solo lo mostramos si el navegador nos da luz verde
            setIsVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handler)
        
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return
        
        // Mostramos el modal nativo de Android/iOS
        deferredPrompt.prompt()
        
        // Esperamos la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            console.log('Usuario aceptó la instalación')
            setIsVisible(false)
        }
        setDeferredPrompt(null)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] z-[9999] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
            <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest text-slate-100">Instalar CALIBRE</span>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5">Añade la app a tu pantalla de inicio</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button 
                    onClick={handleInstallClick}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5"
                >
                    <Download size={14} /> Instalar
                </button>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="text-slate-500 hover:text-slate-300 bg-slate-800 p-2 rounded-xl transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    )
}