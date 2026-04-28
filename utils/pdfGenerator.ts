import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // 🔥 Restaurado a tu versión original confiable

interface ConfigPDF {
    nombreTaller: string;
    direccion: string;
    telefono: string;
    garantia: string;
    logoUrl: string | null;
    incluirIva: boolean;
}

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

const MAPA_TESTIGOS: Record<string, string> = {
    'check_engine': 'Check Engine',
    'aceite': 'Presión de Aceite',
    'bateria': 'Batería',
    'abs': 'Frenos ABS'
};

// =========================================================================
// 1. FUNCIÓN ORIGINAL: INFORME TÉCNICO DE ORDEN INDIVIDUAL
// =========================================================================
export const generarDocumentoPDF = async (o: any, resumenIA: string = "", configPDF: ConfigPDF) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 6, 'F');

        let posicionYHeader = 22;

        if (configPDF.logoUrl) {
            try {
                const logoB64 = await urlABase64PNG(configPDF.logoUrl);
                const props = doc.getImageProperties(logoB64);
                const anchoDeseado = 40; 
                const altoCalculado = (props.height * anchoDeseado) / props.width;
                doc.addImage(logoB64, 'PNG', 14, 12, anchoDeseado, altoCalculado);
                posicionYHeader = 12 + altoCalculado + 8; 
            } catch (err) {
                console.error("Error logo", err);
            }
        }

        doc.setFontSize(24);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text(configPDF.nombreTaller.toUpperCase(), 14, posicionYHeader);

        doc.setFontSize(7);
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.text("POWERED BY CALIBRE", 14, posicionYHeader + 5);

        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.text("INFORME TÉCNICO", pageWidth - 14, 18, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const fechaHoy = new Date().toLocaleDateString('es-CL');
        doc.text(`Fecha de emisión: ${fechaHoy}`, pageWidth - 14, 24, { align: 'right' });
        
        if (configPDF.direccion) doc.text(configPDF.direccion, pageWidth - 14, 30, { align: 'right' });
        if (configPDF.telefono) doc.text(`Tel: ${configPDF.telefono}`, pageWidth - 14, 34, { align: 'right' });

        const startYLine = posicionYHeader > 34 ? posicionYHeader + 10 : 40;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, startYLine, pageWidth - 14, startYLine);

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
        doc.text(o.kilometraje ? `${o.kilometraje.toLocaleString('es-CL')} km` : 'No registrado', 135, startYCaja + 7);
        doc.text(`${o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER'}`, 135, startYCaja + 14);
        doc.text(`#${o.id.toString().slice(0, 8).toUpperCase()}`, 135, startYCaja + 21);

        let finalY = startYCaja + 30;

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("ACTA DE RECEPCIÓN (ESTADO INICIAL)", 14, finalY);
        finalY += 4;

        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, finalY, pageWidth - 28, 16, 2, 2, 'FD');

        const nivelBencina = o.nivel_combustible ? `${o.nivel_combustible}%` : 'No reg.';
        let testigosArr: string[] = [];
        try { testigosArr = typeof o.testigos === 'string' ? JSON.parse(o.testigos) : (o.testigos || []); } catch(e){}
        const luces = testigosArr.length > 0 ? testigosArr.map((t: string) => MAPA_TESTIGOS[t] || t).join(', ') : 'Ninguna';
        const danos = o.danos_previos ? o.danos_previos.substring(0, 50) + (o.danos_previos.length > 50 ? '...' : '') : 'Sin daños reportados';

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "bold");
        doc.text("Combustible:", 18, finalY + 6);
        doc.text("Testigos:", 60, finalY + 6);
        doc.text("Daños Carrocería:", 18, finalY + 12);
        doc.text("Objetos Valor:", 110, finalY + 12);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(nivelBencina, 40, finalY + 6);
        doc.text(luces, 75, finalY + 6);
        doc.text(danos, 45, finalY + 12);
        doc.text(o.objetos_valor || 'Sin objetos', 130, finalY + 12);

        finalY += 24;

        const items = o.items_orden || [];
        const servicios = items.filter((i: any) => i.tipo_item === 'servicio');
        const repuestos = items.filter((i: any) => i.tipo_item === 'repuesto');
        
        const subtotalServicios = servicios.reduce((sum: number, item: any) => sum + item.precio, 0);
        const subtotalRepuestos = repuestos.reduce((sum: number, item: any) => sum + item.precio, 0);
        const costoRevision = o.costo_revision || 0;
        const descuento = o.descuento || 0;

        const subtotalBruto = subtotalServicios + subtotalRepuestos + costoRevision;
        const totalNeto = subtotalBruto - descuento;

        if (servicios.length > 0 || costoRevision > 0) {
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text("MANO DE OBRA Y SERVICIOS", 14, finalY);
            finalY += 2;

            let bodyServicios = servicios.map((i: any) => [
                i.descripcion.toUpperCase(),
                `$${i.precio.toLocaleString('es-CL')}`
            ]);

            if (costoRevision > 0) {
                bodyServicios.unshift([
                    "DIAGNÓSTICO Y REVISIÓN TÉCNICA INICIAL",
                    `$${costoRevision.toLocaleString('es-CL')}`
                ]);
            }

            // 🔥 VOLVEMOS A AUTOTABLE ORIGINAL
            autoTable(doc, {
                startY: finalY,
                head: [['Descripción del Servicio', 'Valor']],
                body: bodyServicios,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 1: { halign: 'right', cellWidth: 40 } }
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        if (repuestos.length > 0) {
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text("REPUESTOS E INSUMOS UTILIZADOS", 14, finalY);
            finalY += 2;

            autoTable(doc, {
                startY: finalY,
                head: [['Descripción del Repuesto', 'Procedencia']],
                body: repuestos.map((i: any) => [i.descripcion.toUpperCase(), i.procedencia.toUpperCase()]),
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        const xStartCobros = pageWidth - 90;
        let footerCobros = [];
        
        if (configPDF.incluirIva) {
            const iva = Math.round(totalNeto * 0.19);
            const totalConIva = totalNeto + iva;
            footerCobros = [
                ['SUBTOTAL NETO', `$${totalNeto.toLocaleString('es-CL')}`],
                ['IVA (19%)', `$${iva.toLocaleString('es-CL')}`],
                ['TOTAL A PAGAR', `$${totalConIva.toLocaleString('es-CL')}`]
            ];
        } else {
            footerCobros = [['TOTAL A PAGAR', `$${totalNeto.toLocaleString('es-CL')}`]];
        }

        if (descuento > 0) footerCobros.unshift(['DESCUENTO APLICADO', `-$${descuento.toLocaleString('es-CL')}`]);

        autoTable(doc, {
            startY: finalY,
            margin: { left: xStartCobros },
            body: footerCobros,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2, halign: 'right' },
            columnStyles: { 0: { fontStyle: 'bold', textColor: [71, 85, 105] }, 1: { fontStyle: 'bold', textColor: [15, 23, 42] } },
            didParseCell: function (data: any) {
                if (data.row.index === footerCobros.length - 1) {
                    data.cell.styles.fillColor = [16, 185, 129];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontSize = 10;
                }
                if (descuento > 0 && data.row.index === 0) data.cell.styles.textColor = [234, 88, 12];
            }
        });

        finalY = (doc as any).lastAutoTable.finalY || finalY + 20;

        const textoFinalIA = resumenIA && resumenIA.length > 10 ? resumenIA : `Servicios completados para el vehículo patente ${o.vehiculos?.patente}.`;

        if (finalY + 15 > 265) { doc.addPage(); finalY = 20; }

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
            if (finalY > 275) { doc.addPage(); finalY = 20; }
            doc.text(lineasIA[i], 14, finalY);
            finalY += 5; 
        }

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
                if (isRojo) { doc.setFillColor(254, 242, 242); doc.setDrawColor(252, 165, 165); } 
                else { doc.setFillColor(254, 252, 232); doc.setDrawColor(253, 224, 71); }
                
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
                } catch (e) { console.error("Error cargando imagen en PDF"); }
            }
            finalY = y; 
        }

        if (configPDF.garantia && configPDF.garantia.trim() !== "") {
            if (finalY > 260) { doc.addPage(); finalY = 20; } else { finalY += 15; }
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184); 
            doc.setFont("helvetica", "italic");
            const lineasGarantia = doc.splitTextToSize(`Condiciones y Garantía: ${configPDF.garantia}`, pageWidth - 28);
            for (let i = 0; i < lineasGarantia.length; i++) {
                if (finalY > 275) { doc.addPage(); finalY = 20; }
                doc.text(lineasGarantia[i], 14, finalY);
                finalY += 3.5; 
            }
        }

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

// =========================================================================
// 2. FUNCIÓN NUEVA: RADIOGRAFÍA GERENCIAL MENSUAL
// =========================================================================
export const generarRadiografiaMensualPDF = async (historial: any[] = [], oportunidades: any[] = [], configPDF: ConfigPDF) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const ordenesEsteMes = historial.filter(o => {
            const d = new Date(o.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        let ingresosServicio = 0;
        let ingresosRepuesto = 0;
        let costoRevisionTotal = 0;
        let descuentosTotal = 0;

        ordenesEsteMes.forEach(o => {
            descuentosTotal += (o.descuento || 0);
            costoRevisionTotal += (o.costo_revision || 0);
            o.items_orden?.forEach((i: any) => {
                if (i.tipo_item === 'servicio') ingresosServicio += i.precio;
                if (i.tipo_item === 'repuesto') ingresosRepuesto += i.precio;
            });
        });

        const ingresosBrutos = ingresosServicio + ingresosRepuesto + costoRevisionTotal - descuentosTotal;
        const autosEsteMes = ordenesEsteMes.length;
        const ticketPromedio = autosEsteMes > 0 ? Math.round(ingresosBrutos / autosEsteMes) : 0;

        const ingresosPorMecanico = ordenesEsteMes.reduce((acc: any, o: any) => {
            const m = o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER';
            const totalOrden = (o.items_orden?.reduce((s: number, i: any) => s + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0);
            acc[m] = (acc[m] || 0) + totalOrden;
            return acc;
        }, {});
        const rendimientoMecanicos = Object.entries(ingresosPorMecanico).sort((a: any, b: any) => b[1] - a[1]);

        doc.setFillColor(16, 185, 129); 
        doc.rect(0, 0, pageWidth, 6, 'F');

        let posicionY = 22;

        if (configPDF?.logoUrl) {
            try {
                const logoB64 = await urlABase64PNG(configPDF.logoUrl);
                const props = doc.getImageProperties(logoB64);
                const anchoDeseado = 40; 
                const altoCalculado = (props.height * anchoDeseado) / props.width;
                doc.addImage(logoB64, 'PNG', 14, 12, anchoDeseado, altoCalculado);
                posicionY = 12 + altoCalculado + 8; 
            } catch (err) { console.error("Error al cargar logo", err); }
        }

        const nombreAUsar = configPDF?.nombreTaller || 'MI TALLER';

        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text(nombreAUsar.toUpperCase(), 14, posicionY);

        doc.setFontSize(7);
        doc.setTextColor(16, 185, 129);
        doc.text("RADIOGRAFÍA FINANCIERA • CALIBRE OS", 14, posicionY + 5);

        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.text("CIERRE DE MES", pageWidth - 14, 18, { align: 'right' });
        
        const nombreMes = new Date().toLocaleString('es-CL', { month: 'long', year: 'numeric' }).toUpperCase();
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Período: ${nombreMes}`, pageWidth - 14, 24, { align: 'right' });
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, pageWidth - 14, 29, { align: 'right' });

        posicionY = posicionY > 34 ? posicionY + 10 : 40;

        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("1. RESUMEN EJECUTIVO", 14, posicionY);
        posicionY += 4;

        // 🔥 BLINDADO PARA EVITAR QUE EXPLOTE SI NO HAY DATOS
        autoTable(doc, {
            startY: posicionY,
            head: [['Métrica', 'Valor']],
            body: [
                ['INGRESOS BRUTOS TOTALES', `$${ingresosBrutos.toLocaleString('es-CL')}`],
                ['VEHÍCULOS ATENDIDOS', `${autosEsteMes} Autos`],
                ['TICKET PROMEDIO', `$${ticketPromedio.toLocaleString('es-CL')}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
            bodyStyles: { fontSize: 11, fontStyle: 'bold' },
            columnStyles: { 1: { halign: 'right', textColor: [16, 185, 129] } }
        });
        posicionY = (doc as any).lastAutoTable.finalY + 12;

        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("2. DISTRIBUCIÓN DE INGRESOS", 14, posicionY);
        posicionY += 4;

        autoTable(doc, {
            startY: posicionY,
            head: [['Concepto', 'Monto Generado']],
            body: [
                ['Mano de Obra y Servicios', `$${ingresosServicio.toLocaleString('es-CL')}`],
                ['Venta de Repuestos e Insumos', `$${ingresosRepuesto.toLocaleString('es-CL')}`],
                ['Diagnósticos (Revisión Inicial)', `$${costoRevisionTotal.toLocaleString('es-CL')}`],
                ['Fugas de Capital (Descuentos Regalados)', `-$${descuentosTotal.toLocaleString('es-CL')}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 1: { halign: 'right' } }
        });
        posicionY = (doc as any).lastAutoTable.finalY + 12;

        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("3. RANKING DE PRODUCTIVIDAD (MECÁNICOS)", 14, posicionY);
        posicionY += 4;

        // 🔥 EL BLINDAJE CONTRA EL ERROR SILENCIOSO (SI NO HAY MECÁNICOS ESTE MES)
        const bodyMecanicos = rendimientoMecanicos.length > 0 
            ? rendimientoMecanicos.map(([nombre, total]: any, i: number) => [`#${i + 1}`, nombre, `$${total.toLocaleString('es-CL')}`])
            : [['-', 'Sin registros de mecánicos este mes', '-']];

        autoTable(doc, {
            startY: posicionY,
            head: [['Posición', 'Nombre del Mecánico', 'Producción Total ($)']],
            body: bodyMecanicos,
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } }
        });
        posicionY = (doc as any).lastAutoTable.finalY + 15;

        if (posicionY > 230) { doc.addPage(); posicionY = 20; }

        doc.setFontSize(12);
        doc.setTextColor(234, 88, 12);
        doc.setFont("helvetica", "bold");
        doc.text("HOJA DE ACCIÓN: OPORTUNIDADES CRM", 14, posicionY);
        
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        posicionY += 4;
        doc.text("Clientes con alertas maduras que deben ser contactados para agendar mantención.", 14, posicionY);
        posicionY += 4;

        if (oportunidades.length > 0) {
            autoTable(doc, {
                startY: posicionY,
                head: [['Cliente', 'Teléfono', 'Patente', 'Motivo / Alerta']],
                body: oportunidades.map((op: any) => [op.vehiculos?.clientes?.nombre || 'S/N', op.vehiculos?.clientes?.telefono || 'S/N', op.vehiculos?.patente, op.pieza || 'Mantenimiento']),
                theme: 'grid',
                headStyles: { fillColor: [234, 88, 12], fontStyle: 'bold' },
                bodyStyles: { fontSize: 8 },
            });
        } else {
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text("No hay alertas maduras pendientes para este mes.", 14, posicionY + 6);
        }

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

        doc.save(`Radiografia_Mensual_${nombreAUsar.replace(/\s+/g, '_')}_${nombreMes}.pdf`);
        
    } catch (e) {
        console.error("Error al generar PDF:", e);
        throw e;
    }
};