import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function CalificacionCliente({ ordenId, tipo }: { ordenId: string, tipo: 'intermedio' | 'final' }) {
    const [rating, setRating] = useState(0);
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    const enviarFeedback = async () => {
        if (rating === 0) return toast.error("Por favor selecciona una calificación.");
        setEnviando(true);
        
        try {
            // Aseguramos que los nombres coincidan exactamente con la base de datos
            const dataAActualizar = tipo === 'intermedio' 
                ? { feedback_intermedio_estrellas: rating, feedback_intermedio_texto: comentario }
                : { feedback_final_estrellas: rating, feedback_final_texto: comentario };

            const { error } = await supabase
                .from('ordenes_trabajo')
                .update(dataAActualizar)
                .eq('id', ordenId);
            
            if (error) throw error;
            
            setEnviado(true);
            toast.success("¡Calificación enviada con éxito!");
        } catch (err: any) {
            console.error("Error guardando feedback:", err);
            toast.error("Hubo un error de conexión. Intenta nuevamente.");
        } finally {
            setEnviando(false);
        }
    };

    if (enviado) {
        return (
            <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 md:p-8 rounded-3xl text-center shadow-inner mt-8">
                <Star className="text-emerald-500 fill-emerald-500 mx-auto mb-4" size={48} />
                <h4 className="text-emerald-400 font-black uppercase tracking-widest text-sm">¡Valoramos tu opinión!</h4>
                <p className="text-emerald-500/80 text-xs font-bold mt-2">Tus comentarios nos ayudan a ser el mejor taller de la ciudad.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-slate-700/50 mt-8 shadow-xl">
            <div className="text-center mb-6">
                <h4 className="text-sm md:text-base font-black text-slate-100 uppercase tracking-widest">
                    {tipo === 'intermedio' ? '¿Cómo va nuestra atención?' : 'Califica nuestro servicio'}
                </h4>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Tu opinión es fundamental</p>
            </div>
            
            <div className="flex justify-center gap-2 md:gap-4 mb-6">
                {[1, 2, 3, 4, 5].map((estrella) => (
                    <button 
                        key={estrella} 
                        onClick={() => setRating(estrella)} 
                        className="focus:outline-none hover:scale-110 transition-transform"
                    >
                        <Star 
                            size={40} 
                            className={`transition-all drop-shadow-md ${rating >= estrella ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} 
                        />
                    </button>
                ))}
            </div>

            {rating > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                    <textarea 
                        placeholder="Cuéntanos más sobre tu experiencia (opcional)..." 
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-sm text-slate-200 outline-none focus:border-yellow-500/50 transition-colors resize-none min-h-[100px]"
                    />
                    <button 
                        onClick={enviarFeedback}
                        disabled={enviando}
                        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-yellow-950 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)] disabled:opacity-50"
                    >
                        {enviando ? 'Enviando...' : <><Send size={16} /> Enviar Calificación</>}
                    </button>
                </div>
            )}
        </div>
    );
}