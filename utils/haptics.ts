// utils/haptics.ts

export const vibrar = (tipo: 'ligero' | 'fuerte' | 'exito' | 'error' = 'ligero') => {
    // Si estamos en un PC o el navegador no soporta vibración, no hacemos nada y evitamos errores
    if (typeof window === 'undefined' || !navigator.vibrate) return;

    switch (tipo) {
        case 'ligero':
            navigator.vibrate(50); // Vibración súper corta (como tocar una tecla)
            break;
        case 'fuerte':
            navigator.vibrate(100); // Para acciones más pesadas (ej. Borrar un ítem)
            break;
        case 'exito':
            navigator.vibrate([50, 50, 50]); // Dos toques rápidos (Ta-Da!)
            break;
        case 'error':
            navigator.vibrate([200, 100, 200]); // Dos toques largos (Alerta)
            break;
    }
};