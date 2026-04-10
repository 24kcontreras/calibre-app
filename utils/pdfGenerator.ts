import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Funciones de soporte
const urlABase64PNG = async (url: string) => {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        throw new Error("No se pudo fetchear la imagen");
    }
};

const urlABase64JPEG = (url: string) => {
    return new Promise<string>((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d'); if (ctx) ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => reject(); img.src = url;
    });
};

// FUNCIÓN PRINCIPAL EXPORTADA
export const generarDocumentoPDF = async (o: any, resumenIA: string = "", nombreTaller: string) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 6, 'F');

        doc.setFontSize(26);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text(nombreTaller.toUpperCase(), 14, 22);

        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.text("POWERED BY CALIBRE", 14, 27);

        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.text("INFORME DE SERVICIO", pageWidth - 14, 20, { align: 'right' });
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const fechaHoy = new Date().toLocaleDateString('es-CL');
        doc.text(`Fecha de emisión: ${fechaHoy}`, pageWidth - 14, 25, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, 36, pageWidth - 28, 25, 2, 2, 'FD');

        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);

        doc.setFont("helvetica", "bold");
        doc.text("Cliente:", 18, 43);
        doc.text("Vehículo:", 18, 50);
        doc.text("Patente:", 18, 57);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`${o.vehiculos?.clientes?.nombre?.toUpperCase() || 'S/N'}`, 35, 43);
        doc.text(`${o.vehiculos?.marca?.toUpperCase() || ''} ${o.vehiculos?.modelo?.toUpperCase() || ''} ${o.vehiculos?.anho || ''}`, 35, 50);
        doc.text(`${o.vehiculos?.patente}`, 35, 57);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("Kilometraje:", 110, 43);
        doc.text("Mecánico:", 110, 50);
        doc.text("ID Orden:", 110, 57);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`${o.kilometraje_entrada?.toLocaleString('es-CL') || 0} km`, 135, 43);
        doc.text(`${o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : nombreTaller}`, 135, 50);
        doc.text(`#${o.id.toString().slice(0, 8).toUpperCase()}`, 135, 57);

        const totalMonto = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;

        autoTable(doc, {
            startY: 68,
            head: [['Descripción del Trabajo / Repuesto', 'Tipo', 'Origen', 'Monto']],
            body: o.items_orden?.map((i: any) => [
                i.descripcion.toUpperCase(),
                i.tipo_item,
                i.procedencia,
                `$${i.precio.toLocaleString('es-CL')}`
            ]) || [],
            foot: [['', '', 'TOTAL A PAGAR', `$${totalMonto.toLocaleString('es-CL')}`]],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            footStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        let finalY = (doc as any).lastAutoTable.finalY || 70;

        // 🔥 BLOQUE 1: DIAGNÓSTICO Y RECOMENDACIONES (IA) - AHORA VA PRIMERO
        const textoFinalIA = resumenIA && resumenIA.length > 10 ? resumenIA : `Se han completado los servicios y reemplazos indicados en la tabla superior para el vehículo patente ${o.vehiculos?.patente}, asegurando el cumplimiento de los estándares de seguridad recomendados.`;

        if (finalY + 15 > 265) {
            doc.addPage();
            finalY = 20;
        }

        finalY += 15;
        doc.setFontSize(12);
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.text("DIAGNÓSTICO Y RECOMENDACIONES", 14, finalY);

        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "normal");

        const lineasIA = doc.splitTextToSize(textoFinalIA, pageWidth - 28);
        finalY += 7; // Espacio después del título

        for (let i = 0; i < lineasIA.length; i++) {
            if (finalY > 275) {
                doc.addPage();
                finalY = 20;
            }
            doc.text(lineasIA[i], 14, finalY);
            finalY += 5; // Salto de línea
        }


        // 🔥 BLOQUE 2: SEMÁFORO DE DESGASTE (ALERTAS PENDIENTES) - AHORA VA DESPUÉS
        const alertas = o.vehiculos?.alertas_desgaste || [];
        const alertasPendientes = alertas.filter((a: any) => a.estado === 'Pendiente');

        if (alertasPendientes.length > 0) {
            finalY += 15;
            if (finalY > 250) { doc.addPage(); finalY = 20; }

            doc.setFontSize(12);
            doc.setTextColor(249, 115, 22); // Naranja corporativo
            doc.setFont("helvetica", "bold");
            doc.text("INSPECCIÓN TÉCNICA - SUGERENCIAS DE SEGURIDAD", 14, finalY);
            
            finalY += 8;

            alertasPendientes.forEach((alerta: any) => {
                if (finalY > 260) { doc.addPage(); finalY = 20; }

                const isRojo = alerta.nivel_riesgo === 'Rojo';
                if (isRojo) {
                    doc.setFillColor(254, 242, 242); 
                    doc.setDrawColor(252, 165, 165); 
                } else {
                    doc.setFillColor(254, 252, 232); 
                    doc.setDrawColor(253, 224, 71); 
                }
                
                doc.roundedRect(14, finalY, pageWidth - 28, 18, 2, 2, 'FD');

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(isRojo ? 220 : 202, isRojo ? 38 : 138, isRojo ? 38 : 4); 
                const icono = isRojo ? "URGENTE:" : "PREVENTIVO:";
                doc.text(`${icono} ${alerta.pieza.toUpperCase()}`, 18, finalY + 6);

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105); 
                
                const obsText = alerta.observacion ? alerta.observacion : (isRojo ? "Riesgo inminente de falla. Recomendamos reemplazo." : "Desgaste moderado. Vigilar en la próxima mantención.");
                const lineasObs = doc.splitTextToSize(obsText, pageWidth - 36);
                doc.text(lineasObs.slice(0, 2), 18, finalY + 13); 

                finalY += 22; 
            });
        }


        // 🔥 BLOQUE 3: EVIDENCIA FOTOGRÁFICA
        if (o.fotos_orden?.length > 0) {
            if (finalY > 230) { doc.addPage(); finalY = 20; } else { finalY += 15; }

            doc.setFontSize(12);
            doc.setTextColor(16, 185, 129);
            doc.setFont("helvetica", "bold");
            doc.text("EVIDENCIA FOTOGRÁFICA", 14, finalY);
            let y = finalY + 10;

            for (const f of o.fotos_orden.slice(0, 4)) {
                try {
                    const b64 = await urlABase64JPEG(f.url);
                    const imgProps = doc.getImageProperties(b64);
                    const pdfAncho = 80;
                    const pdfAlto = (imgProps.height * pdfAncho) / imgProps.width;

                    if (y + pdfAlto > 270) { doc.addPage(); y = 20; }

                    doc.addImage(b64, 'JPEG', 14, y, pdfAncho, pdfAlto);

                    doc.setFontSize(9);
                    doc.setFont("helvetica", "italic");
                    doc.setTextColor(100, 116, 139);
                    doc.text(`Nota técnica: ${f.descripcion}`, 14, y + pdfAlto + 5);

                    y += pdfAlto + 15;
                } catch (e) {
                    console.error("Error cargando imagen en PDF");
                }
            }
        }

        // FOOTER DE PÁGINAS
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFillColor(241, 245, 249);
            doc.rect(0, 285, pageWidth, 15, 'F');

            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.setFont("helvetica", "bold");
            doc.text(`GENERADO TECNOLÓGICAMENTE POR CALIBRE (NEURAL GARAGE OS)`, 14, 292);
            doc.text(`PÁGINA ${i} DE ${pageCount}`, pageWidth - 14, 292, { align: 'right' });
        }

        doc.save(`Reporte_${nombreTaller.replace(/\s+/g, '_')}_${o.vehiculos?.patente}.pdf`);
        return doc.output('datauristring');

    } catch (e) {
        console.error("Error al generar PDF:", e);
        throw e;
    }
};