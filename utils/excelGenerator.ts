import * as XLSX from 'xlsx-js-style';

export const descargarExcelSupremo = (historial: any[], oportunidades: any[], nombreTaller: string) => {
    
    // ==========================================
    // 1. CÁLCULOS
    // ==========================================
    let totalIngresos = 0, totalDescuentos = 0, totalCostoRevision = 0, totalManoObra = 0, totalRepuestos = 0;

    historial.forEach(o => {
        totalDescuentos += (o.descuento || 0);
        totalCostoRevision += (o.costo_revision || 0);
        let subtotalItems = 0;
        o.items_orden?.forEach((i: any) => {
            subtotalItems += i.precio;
            if (i.tipo_item === 'servicio') totalManoObra += i.precio;
            if (i.tipo_item === 'repuesto') totalRepuestos += i.precio;
        });
        totalIngresos += (subtotalItems + (o.costo_revision || 0) - (o.descuento || 0));
    });

    const ticketPromedio = historial.length > 0 ? Math.round(totalIngresos / historial.length) : 0;

    // 🔥 MEJORA 1: Pasamos los números en crudo, no formateados como string
    const resumenData = [
        { "Métrica Financiera": "Total Órdenes Finalizadas", "Valor": historial.length },
        { "Métrica Financiera": "Ingresos Brutos Totales", "Valor": totalIngresos },
        { "Métrica Financiera": "Ingresos por Mano de Obra", "Valor": totalManoObra },
        { "Métrica Financiera": "Ingresos por Repuestos", "Valor": totalRepuestos },
        { "Métrica Financiera": "Ingresos por Diagnósticos", "Valor": totalCostoRevision },
        { "Métrica Financiera": "Dinero en Descuentos (Fugas)", "Valor": totalDescuentos },
        { "Métrica Financiera": "Ticket Promedio por Auto", "Valor": ticketPromedio },
    ];

    const mecanicosMap: any = {};
    historial.forEach(o => {
        const m = o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER / SIN ASIGNAR';
        const totalOrden = (o.items_orden?.reduce((sum: number, i: any) => sum + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0);
        if (!mecanicosMap[m]) mecanicosMap[m] = { "Nombre Mecánico": m, "Autos Terminados": 0, "Producción Total": 0 };
        mecanicosMap[m]["Autos Terminados"] += 1;
        mecanicosMap[m]["Producción Total"] += totalOrden;
    });
    
    // 🔥 MEJORA 1: Números en crudo
    const mecanicosData = Object.values(mecanicosMap).sort((a: any, b: any) => b["Producción Total"] - a["Producción Total"]).map((m: any) => ({
        "Nombre Mecánico": m["Nombre Mecánico"],
        "Autos Terminados": m["Autos Terminados"],
        "Producción Total": m["Producción Total"]
    }));

    // 🔥 MEJORA 1: Números en crudo
    const dbData = historial.map(o => {
        const mo = o.items_orden?.filter((i:any) => i.tipo_item === 'servicio').reduce((sum:number, i:any) => sum + i.precio, 0) || 0;
        const rep = o.items_orden?.filter((i:any) => i.tipo_item === 'repuesto').reduce((sum:number, i:any) => sum + i.precio, 0) || 0;
        return {
            "ID Orden": o.id.substring(0, 8),
            "Fecha Cierre": new Date(o.updated_at).toLocaleDateString('es-CL'),
            "Patente": o.vehiculos?.patente,
            "Cliente": o.vehiculos?.clientes?.nombre || 'Desconocido',
            "Mano de Obra": mo,
            "Repuestos": rep,
            "Diagnóstico": (o.costo_revision || 0),
            "Descuento": (o.descuento || 0),
            "TOTAL PAGADO": (mo + rep + (o.costo_revision || 0) - (o.descuento || 0)),
            "Mecánico Asignado": o.mecanico || 'Sin asignar'
        };
    });

    // ==========================================
    // 2. CREACIÓN DEL EXCEL Y ESTILOS
    // ==========================================
    const wb = XLSX.utils.book_new();

    // 🔥 MEJORA 2: Función de estilos más robusta
    const aplicarEstilosAvanzados = (ws: any, anchos: number[], columnasMoneda: string[] = []) => {
        const range = XLSX.utils.decode_range(ws['!ref']);
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_cell({c: C, r: R});
                if (!ws[address]) continue;

                // Estilo base
                let style: any = {
                    font: { name: 'Calibri', sz: 11 },
                    border: {
                        top: {style: "thin", color: {auto: 1}},
                        bottom: {style: "thin", color: {auto: 1}},
                        left: {style: "thin", color: {auto: 1}},
                        right: {style: "thin", color: {auto: 1}}
                    }
                };

                // Cabecera (Fila 0)
                if (R === 0) {
                    style.font = { bold: true, color: { rgb: "FFFFFF" } };
                    style.fill = { fgColor: { rgb: "0F172A" } }; // Slate 950
                    style.alignment = { horizontal: "center", vertical: "center" };
                } else {
                    // Filas de datos
                    const headerAddress = XLSX.utils.encode_cell({c: C, r: 0});
                    const headerName = ws[headerAddress] ? ws[headerAddress].v : '';

                    // Alternar colores de fila para legibilidad
                    if (R % 2 !== 0) {
                         style.fill = { fgColor: { rgb: "F8FAFC" } }; // Slate 50
                    }

                    // Formato Moneda si aplica
                    if (columnasMoneda.includes(headerName)) {
                        style.numFmt = '"$"#,##0';
                        style.alignment = { horizontal: "right" };
                    } else if (typeof ws[address].v === 'number') {
                         style.alignment = { horizontal: "right" };
                    } else {
                         style.alignment = { horizontal: "left" };
                    }
                }
                ws[address].s = style;
            }
        }
        ws['!cols'] = anchos.map(w => ({ wch: w }));
    };

    // Aplicar a cada hoja
    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    aplicarEstilosAvanzados(wsResumen, [35, 25], ["Valor"]);
    XLSX.utils.book_append_sheet(wb, wsResumen, "1. Resumen Ejecutivo");

    const wsMecanicos = XLSX.utils.json_to_sheet(mecanicosData.length > 0 ? mecanicosData : [{"Aviso": "Sin datos"}]);
    aplicarEstilosAvanzados(wsMecanicos, [30, 20, 25], ["Producción Total"]);
    XLSX.utils.book_append_sheet(wb, wsMecanicos, "2. Mecánicos");

    const wsDB = XLSX.utils.json_to_sheet(dbData.length > 0 ? dbData : [{"Aviso": "Sin datos"}]);
    aplicarEstilosAvanzados(wsDB, [12, 15, 15, 25, 18, 18, 18, 18, 20, 25], ["Mano de Obra", "Repuestos", "Diagnóstico", "Descuento", "TOTAL PAGADO"]);
    XLSX.utils.book_append_sheet(wb, wsDB, "3. Base de Datos");

    const fechaStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Reporte_Financiero_${nombreTaller.replace(/\s+/g, '_')}_${fechaStr}.xlsx`);
} 