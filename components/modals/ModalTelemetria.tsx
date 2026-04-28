import { X, BarChart3, TrendingUp, CarFront, Wrench, Package, DollarSign, Wallet, Calendar, CheckCircle2, Star, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export default function ModalTelemetria({
  onClose,
  gananciasEsteMes,
  autosEsteMes,
  ticketPromedio,
  pctServicio,
  pctRepuesto,
  ingresosServicio,
  ingresosRepuesto,
  topMarcas,
  topMecanicos,
  historial,
  oportunidades = [],
  nombreTaller = 'MI TALLER'
}: any) {

  // CÁLCULOS V2: Productividad Real ($) por Mecánico
  const ingresosPorMecanico = historial.reduce((acc: any, o: any) => {
    const m = o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER';
    const totalOrden = o.items_orden?.reduce((s: number, i: any) => s + i.precio, 0) || 0;
    acc[m] = (acc[m] || 0) + totalOrden;
    return acc;
  }, {});

  const rendimientoMecanicos = Object.entries(ingresosPorMecanico).sort((a: any, b: any) => b[1] - a[1]);

  // CÁLCULOS V2: NPS / Satisfacción
  const ordenesConFeedback = historial.filter((o: any) => o.feedback_final_estrellas > 0);
  const promedioEstrellas = ordenesConFeedback.length > 0 
    ? (ordenesConFeedback.reduce((acc: number, o: any) => acc + o.feedback_final_estrellas, 0) / ordenesConFeedback.length).toFixed(1)
    : "0.0";
  const ultimosComentarios = ordenesConFeedback.filter((o: any) => o.feedback_final_texto && o.feedback_final_texto.trim() !== '').slice(0, 5);

  // 🔥 MOTOR DE GENERACIÓN PDF (LA RADIOGRAFÍA)
  const generarRadiografiaPDF = async () => {
      const elemento = document.getElementById('plantilla-radiografia-pdf');
      if (!elemento) return toast.error("No se pudo cargar la plantilla");

      const toastId = toast.loading("Generando Radiografía Gerencial...");

      try {
          // Tomamos una "foto" de alta calidad del contenedor oculto
          const canvas = await html2canvas(elemento, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
          const imgData = canvas.toDataURL('image/png');

          // Creamos el PDF formato A4 vertical
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          const mesActual = new Date().toLocaleString('es-CL', { month: 'long', year: 'numeric' });
          pdf.save(`Radiografia_${nombreTaller.replace(/\s+/g, '_')}_${mesActual}.pdf`);

          toast.success("¡Radiografía descargada con éxito!", { id: toastId });
      } catch (error) {
          console.error(error);
          toast.error("Hubo un problema al generar el documento", { id: toastId });
      }
  };

  return (
    <>
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
      <div className="bg-slate-900 border border-slate-700/50 rounded-[35px] shadow-2xl max-w-4xl w-full relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

        <div className="flex justify-between items-center p-6 lg:p-8 border-b border-slate-800/50 relative z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                <BarChart3 className="text-emerald-500" /> Dashboard & Caja
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Rendimiento financiero del taller</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-emerald-400 bg-slate-950/50 p-2 rounded-full border border-slate-800 transition-all hover:scale-110">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 lg:p-8 overflow-y-auto custom-scrollbar-dark relative z-10">
          
          {/* 🔥 BOTÓN PARA GENERAR LA RADIOGRAFÍA PDF */}
          <div className="mb-8">
              <button 
                  onClick={generarRadiografiaPDF}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 text-slate-950 py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:from-emerald-500 hover:to-emerald-300 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.01]"
              >
                  <FileText size={18} /> Descargar Radiografía Gerencial (PDF)
              </button>
              <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                  Genera un documento profesional listo para auditoría o impresión.
              </p>
          </div>

          {/* 💰 TARJETAS PRINCIPALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-950/50 p-5 rounded-3xl border border-emerald-900/30 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors"><DollarSign size={80}/></div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 relative z-10">Ingresos del Mes</p>
              <p className="text-3xl font-black text-slate-100 tracking-tighter relative z-10">${gananciasEsteMes.toLocaleString('es-CL')}</p>
            </div>
            
            <div className="bg-slate-950/50 p-5 rounded-3xl border border-blue-900/30 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors"><CarFront size={80}/></div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 relative z-10">Autos Reparados</p>
              <p className="text-3xl font-black text-slate-100 tracking-tighter relative z-10">{autosEsteMes} <span className="text-sm text-slate-500">vehículos</span></p>
            </div>

            <div className="bg-slate-950/50 p-5 rounded-3xl border border-purple-900/30 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-purple-500/10 group-hover:text-purple-500/20 transition-colors"><TrendingUp size={80}/></div>
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1 relative z-10">Ticket Promedio</p>
              <p className="text-3xl font-black text-slate-100 tracking-tighter relative z-10">${ticketPromedio.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 📊 SPLIT INGRESOS */}
            <div className="bg-slate-800/30 p-6 rounded-3xl border border-slate-700/50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Distribución de Ingresos</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="flex items-center gap-1 text-slate-300"><Wrench size={12} className="text-blue-400"/> Mano de Obra ({pctServicio}%)</span>
                    <span className="text-emerald-400">${ingresosServicio.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pctServicio}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="flex items-center gap-1 text-slate-300"><Package size={12} className="text-orange-400"/> Venta Repuestos ({pctRepuesto}%)</span>
                    <span className="text-emerald-400">${ingresosRepuesto.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pctRepuesto}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🏆 PRODUCTIVIDAD */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 p-5 rounded-3xl border border-slate-700/50 flex flex-col">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Top Marcas</h3>
                    <div className="space-y-3 flex-1">
                        {topMarcas.map((marca: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300 capitalize">{i+1}. {marca[0]}</span>
                                <span className="text-slate-500 font-black">${(marca[1] / 1000).toFixed(0)}k</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-slate-800/30 p-5 rounded-3xl border border-slate-700/50 flex flex-col">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Productividad</h3>
                    <div className="space-y-3 flex-1 max-h-32 overflow-y-auto custom-scrollbar-dark pr-1">
                        {rendimientoMecanicos.map(([nombre, total]: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300 capitalize truncate w-16">{nombre}</span>
                                <span className="text-emerald-400 font-black shrink-0">${(total / 1000).toFixed(0)}k</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* ⭐ FEEDBACK */}
          <div className="bg-slate-800/30 p-6 rounded-3xl border border-slate-700/50 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Satisfacción del Cliente</h3>
              <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full">
                <span className="text-yellow-400 font-black text-sm">{promedioEstrellas}</span>
                <Star className="text-yellow-400 fill-yellow-400" size={14} />
              </div>
            </div>
            {ultimosComentarios.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Aún no hay comentarios.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar-dark pr-2">
                {ultimosComentarios.map((o: any) => (
                  <div key={o.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{o.vehiculos?.patente}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < o.feedback_final_estrellas ? "text-yellow-400 fill-yellow-400" : "text-slate-700"} />)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{o.feedback_final_texto}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ========================================================================================= */}
    {/* 🔥 PLANTILLA OCULTA PARA EL PDF (DISEÑO CORPORATIVO CLARO) */}
    {/* Esta parte vive fuera de la pantalla (left: -9999px) y se dibuja solo para la "foto" */}
    {/* ========================================================================================= */}
    <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div id="plantilla-radiografia-pdf" className="w-[800px] bg-slate-50 p-12 font-sans text-slate-900 min-h-[1123px]">
            
            {/* Header del Reporte */}
            <div className="border-b-4 border-emerald-600 pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">{nombreTaller}</h1>
                    <p className="text-emerald-700 font-bold tracking-widest uppercase mt-2 text-sm">Radiografía de Cierre Mensual</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-500 font-bold text-sm">Generado el: {new Date().toLocaleDateString('es-CL')}</p>
                    <p className="text-slate-400 text-xs font-semibold">Calibre OS - Inteligencia Automotriz</p>
                </div>
            </div>

            {/* Resumen Financiero Macro */}
            <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ingresos Brutos</p>
                    <p className="text-3xl font-black text-emerald-600">${gananciasEsteMes.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vehículos Atendidos</p>
                    <p className="text-3xl font-black text-blue-600">{autosEsteMes}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ticket Promedio</p>
                    <p className="text-3xl font-black text-purple-600">${ticketPromedio.toLocaleString('es-CL')}</p>
                </div>
            </div>

            {/* Split de Ingresos y Productividad */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b pb-2">Distribución de Ingresos</h3>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-600">Mano de Obra ({pctServicio}%)</span>
                        <span className="font-black text-slate-800">${ingresosServicio.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-600">Venta de Repuestos ({pctRepuesto}%)</span>
                        <span className="font-black text-slate-800">${ingresosRepuesto.toLocaleString('es-CL')}</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b pb-2">Top Productividad (Mecánicos)</h3>
                    {rendimientoMecanicos.slice(0, 4).map(([nombre, total]: any, i: number) => (
                        <div key={i} className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-600 capitalize">{i+1}. {nombre}</span>
                            <span className="font-black text-emerald-600">${total.toLocaleString('es-CL')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hoja de Acción - CRM */}
            <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                    🎯 Oportunidades de Venta Inmediata (CRM)
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-4">Clientes con mantenimientos pendientes o alertas de desgaste maduras. Ideal para campañas de retención telefónica.</p>
                
                <table className="w-full text-left bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-black">
                        <tr>
                            <th className="p-4 border-b">Cliente</th>
                            <th className="p-4 border-b">Patente</th>
                            <th className="p-4 border-b">Contacto</th>
                            <th className="p-4 border-b">Motivo / Alerta</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-slate-700">
                        {oportunidades.slice(0, 8).map((op: any, i: number) => (
                            <tr key={i} className="border-b last:border-b-0">
                                <td className="p-4">{op.vehiculos?.clientes?.nombre || 'Sin nombre'}</td>
                                <td className="p-4 font-black text-slate-900">{op.vehiculos?.patente}</td>
                                <td className="p-4 text-blue-600">{op.vehiculos?.clientes?.telefono || '-'}</td>
                                <td className="p-4 text-orange-600 font-bold">{op.pieza || 'Mantenimiento General'}</td>
                            </tr>
                        ))}
                        {oportunidades.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic">No hay alertas maduras este mes.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    </div>
    </>
  )
}