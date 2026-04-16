import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Interfaz para la configuración del PDF (Evita errores de TypeScript)
interface ConfigPDF {
    nombreTaller: string;
    direccion: string;
    telefono: string;
    garantia: string;
    logoUrl: string | null;
    incluirIva: boolean;
}

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
        throw new Error("No se pudo fetchear la imagen PNG");
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

// FUNCIÓN PRINCIPAL EXPORTADA (Ahora recibe configPDF)
export const generarDocumentoPDF = async (o: any, resumenIA: string = "", configPDF: ConfigPDF) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- BARRA SUPERIOR VERDE ---
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 6, 'F');

        let posicionYHeader = 22;

        // --- MANEJO DEL LOGO DEL TALLER ---
        if (configPDF.logoUrl) {
            try {
                // Intentamos procesar el logo. Como puede ser PNG (fondo transparente), usamos la función PNG
                const logoB64 = await urlABase64PNG(configPDF.logoUrl);
                const props = doc.getImageProperties(logoB64);
                const anchoDeseado = 40; // Ancho máximo del logo
                const altoCalculado = (props.height * anchoDeseado) / props.width;
                
                doc.addImage(logoB64, 'PNG', 14, 12, anchoDeseado, altoCalculado);
                posicionYHeader = 12 + altoCalculado + 8; // Empujamos el texto hacia abajo
            } catch (err) {
                console.error("Error al cargar el logo del taller para el PDF", err);
                // Si falla el logo, no detenemos el PDF, seguimos normal
            }
        }

        // --- NOMBRE DEL TALLER Y MARCA DE AGUA ---
        doc.setFontSize(24);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text(configPDF.nombreTaller.toUpperCase(), 14, posicionYHeader);

        doc.setFontSize(7);
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.text("POWERED BY CALIBRE", 14, posicionYHeader + 5);

        // --- INFORMACIÓN CORPORATIVA (DERECHA) ---
        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.text("INFORME TÉCNICO", pageWidth - 14, 18, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const fechaHoy = new Date().toLocaleDateString('es-CL');
        doc.text(`Fecha de emisión: ${fechaHoy}`, pageWidth - 14, 24, { align: 'right' });
        
        // Dirección y Teléfono
        if (configPDF.direccion) {
            doc.text(configPDF.direccion, pageWidth - 14, 30, { align: 'right' });
        }
        if (configPDF.telefono) {
            doc.text(`Tel: ${configPDF.telefono}`, pageWidth - 14, 34, { align: 'right' });
        }

        // --- LÍNEA DIVISORIA ---
        const startYLine = posicionYHeader > 34 ? posicionYHeader + 10 : 40;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, startYLine, pageWidth - 14, startYLine);

        // --- CAJA DE DATOS DEL CLIENTE/VEHÍCULO ---
        const startYCaja = startYLine + 4;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, startYCaja, pageWidth - 28, 25, 2, 2, 'FD');

        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);

        doc.setFont("helvetica", "bold");
        doc.text("Cliente:", 18, startYCaja + 7);
        doc.text("Vehículo:", 18, startYCaja + 14);
        doc.text("Patente:", 18, startYCaja + 21);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`${o.vehiculos?.clientes?.nombre?.toUpperCase() || 'S/N'}`, 35, startYCaja + 7);
        doc.text(`${o.vehiculos?.marca?.toUpperCase() || ''} ${o.vehiculos?.modelo?.toUpperCase() || ''} ${o.vehiculos?.anho || ''}`, 35, startYCaja + 14);
        doc.text(`${o.vehiculos?.patente}`, 35, startYCaja + 21);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("Kilometraje:", 110, startYCaja + 7);
        doc.text("Mecánico:", 110, startYCaja + 14);
        doc.text("ID Orden:", 110, startYCaja + 21);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        // 🔥 CORRECCIÓN DEL KILOMETRAJE AQUÍ (cambiamos kilometraje_entrada a kilometraje)
        doc.text(o.kilometraje ? `${o.kilometraje.toLocaleString('es-CL')} km` : 'No registrado', 135, startYCaja + 7);
        doc.text(`${o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER'}`, 135, startYCaja + 14);
        doc.text(`#${o.id.toString().slice(0, 8).toUpperCase()}`, 135, startYCaja + 21);

        // --- TABLA DE PRECIOS Y CÁLCULO DE IVA ---
        const totalItemsMonto = o.items_orden?.reduce((sum: number, item: any) => sum + item.precio, 0) || 0;
        
        let footData: any[][] = [];
        
        if (configPDF.incluirIva) {
            const iva = Math.round(totalItemsMonto * 0.19);
            const totalConIva = totalItemsMonto + iva;
            footData = [
                ['', '', 'SUBTOTAL', `$${totalItemsMonto.toLocaleString('es-CL')}`],
                ['', '', 'IVA (19%)', `$${iva.toLocaleString('es-CL')}`],
                ['', '', 'TOTAL A PAGAR', `$${totalConIva.toLocaleString('es-CL')}`]
            ];
        } else {
            footData = [['', '', 'TOTAL A PAGAR', `$${totalItemsMonto.toLocaleString('es-CL')}`]];
        }

        autoTable(doc, {
            startY: startYCaja + 32,
            head: [['Descripción del Trabajo / Repuesto', 'Tipo', 'Origen', 'Monto']],
            body: o.items_orden?.map((i: any) => [
                i.descripcion.toUpperCase(),
                i.tipo_item,
                i.procedencia,
                `$${i.precio.toLocaleString('es-CL')}`
            ]) || [],
            foot: footData,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didParseCell: function (data) {
                // Pintar la última fila del footer (el TOTAL A PAGAR) de verde
                if (data.section === 'foot' && data.row.index === footData.length - 1) {
                    data.cell.styles.fillColor = [16, 185, 129];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontSize = 10;
                }
            }
        });

        let finalY = (doc as any).lastAutoTable.finalY || 70;

        // --- BLOQUE 1: DIAGNÓSTICO Y RECOMENDACIONES (IA) ---
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
        finalY += 7; 

        for (let i = 0; i < lineasIA.length; i++) {
            if (finalY > 275) {
                doc.addPage();
                finalY = 20;
            }
            doc.text(lineasIA[i], 14, finalY);
            finalY += 5; 
        }

        // --- BLOQUE 2: SEMÁFORO DE DESGASTE ---
        const alertas = o.vehiculos?.alertas_desgaste || [];
        const alertasPendientes = alertas.filter((a: any) => a.estado === 'Pendiente');

        if (alertasPendientes.length > 0) {
            finalY += 15;
            if (finalY > 250) { doc.addPage(); finalY = 20; }

            doc.setFontSize(12);
            doc.setTextColor(249, 115, 22); 
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


        // --- BLOQUE 3: EVIDENCIA FOTOGRÁFICA ---
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
            finalY = y; // Actualizar finalY por si hay garantía después
        }

        // --- BLOQUE 4: TÉRMINOS DE GARANTÍA (LETRA CHICA) ---
        if (configPDF.garantia && configPDF.garantia.trim() !== "") {
            if (finalY > 260) { doc.addPage(); finalY = 20; } else { finalY += 15; }
            
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184); // Gris claro
            doc.setFont("helvetica", "italic");
            
            const lineasGarantia = doc.splitTextToSize(`Condiciones y Garantía: ${configPDF.garantia}`, pageWidth - 28);
            for (let i = 0; i < lineasGarantia.length; i++) {
                if (finalY > 275) { doc.addPage(); finalY = 20; }
                doc.text(lineasGarantia[i], 14, finalY);
                finalY += 3.5; 
            }
        }

        // --- FOOTER DE PÁGINAS ---
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

        doc.save(`Reporte_${configPDF.nombreTaller.replace(/\s+/g, '_')}_${o.vehiculos?.patente}.pdf`);
        return doc.output('datauristring');

    } catch (e) {
        console.error("Error al generar PDF:", e);
        throw e;
    }
};