'use client'
import { useEffect } from 'react'
import { vibrar } from '@/utils/haptics'

export default function GlobalHaptics() {
    useEffect(() => {
        const handleGlobalClick = (e: Event) => {
            const target = e.target as HTMLElement;
            // 🔥 Buscamos botones, enlaces o CUALQUIER elemento que actúe como botón
            const elementoClicable = target.closest('button, a, [role="button"]');
            
            if (elementoClicable) {
                // Respetamos si el botón pide no vibrar
                if (elementoClicable.getAttribute('data-no-vibrate') === 'true') return;
                vibrar('ligero');
            }
        };

        // pointerdown se dispara apenas el dedo toca el cristal (más táctil que el 'click')
        document.addEventListener('pointerdown', handleGlobalClick, { capture: true });

        return () => document.removeEventListener('pointerdown', handleGlobalClick, { capture: true });
    }, []);

    return null; 
}