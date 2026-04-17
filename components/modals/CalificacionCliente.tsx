import { useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CalificacionCliente({ ordenId, tipo }: { ordenId: string, tipo: 'intermedio' | 'final' }) {
    const [rating, setRating] = useState(0);
    const [comentario, setComentario] = useState('');
    const [enviado, setEnviado] = useState(false);

    const enviarFeedback = async () => {
        const dataAActualizar = tipo === 'intermedio' 
            ? { feedback_intermedio_estrellas: rating, feedback_intermedio_texto: comentario }
            : { feedback_final_estrellas: rating, feedback_final_texto: comentario };

        await supabase.from('ordenes_trabajo').update(dataAActualizar).eq('id', ordenId);
        setEnviado(true);
    };

    if (enviado) return <p className="text-emerald-500 font-bold text-center mt-4">¡Gracias por ayudarnos a mejorar!</p>;

    return (
        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 mt-6">
            <h4 className="text-sm font-black text-slate-200 text-center mb-3">
                {tipo === 'intermedio' ? '¿Cómo ha sido nuestra atención hasta ahora?' : '¿Cómo calificarías nuestro trabajo final?'}
            </h4>
            
            <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((estrella) => (
                    <button key={estrella} onClick={() => setRating(estrella)} className="focus:outline-none">
                        <Star 
                            size={32} 
                            className={`transition-colors ${rating >= estrella ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} 
                        />
                    </button>
                ))}
            </div>

            {rating > 0 && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <textarea 
                        placeholder="Cuéntanos más (opcional)..." 
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 mb-3 outline-none focus:border-emerald-500"
                    />
                    <button 
                        onClick={enviarFeedback}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-3 rounded-xl transition-all"
                    >
                        Enviar Calificación
                    </button>
                </div>
            )}
        </div>
    );
}