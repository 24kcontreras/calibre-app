'use client'
import { useEffect } from 'react'
import { vibrar } from '@/utils/haptics'

export default function GlobalHaptics() {
    useEffect(() => {
        const handleGlobalClick = (e: Event) => {
            const target = e.target as HTMLElement;
            const elementoClicable = target.closest('button, a, [role="button"]');
            
            if (elementoClicable) {
                if (elementoClicable.getAttribute('data-no-vibrate') === 'true') return;
                vibrar('ligero');
            }
        };

        // 🔥 Lo cambiamos de nuevo a 'click' para asegurar la compatibilidad estricta de Android
        document.addEventListener('click', handleGlobalClick, { capture: true });

        return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
    }, []);

    return null; 
}