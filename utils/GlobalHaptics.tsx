'use client'
import { useEffect } from 'react'
import { vibrar } from '@/utils/haptics' // Ajusta la ruta a tu archivo

export default function GlobalHaptics() {
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            // Buscamos si el clic fue exactamente en un botón o en un ícono dentro de un botón
            const target = e.target as HTMLElement;
            const boton = target.closest('button');
            
            if (boton) {
                // 🔥 TRUCO: Si el botón tiene este atributo, NO vibra.
                // Es útil si a un botón específico le vas a poner un vibrar('exito') 
                // o vibrar('error') de forma manual, para que no choquen.
                if (boton.getAttribute('data-no-vibrate') === 'true') return;

                vibrar('ligero');
            }
        };

        // Escuchamos todos los clics de la página
        document.addEventListener('click', handleGlobalClick, { capture: true });

        return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
    }, []);

    // No renderizamos nada visual, es un componente puramente lógico
    return null; 
}