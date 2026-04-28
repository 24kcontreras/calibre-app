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

    const resumenData = [
        { "Métrica Financiera": "Total Órdenes Finalizadas", "Valor": historial.length.toString() },
        { "Métrica Financiera": "Ingresos Brutos Totales", "Valor": `$${totalIngresos.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Ingresos por Mano de Obra", "Valor": `$${totalManoObra.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Ingresos por Repuestos", "Valor": `$${totalRepuestos.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Ingresos por Diagnósticos", "Valor": `$${totalCostoRevision.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Dinero en Descuentos (Fugas)", "Valor": `$${totalDescuentos.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Ticket Promedio por Auto", "Valor": `$${ticketPromedio.toLocaleString('es-CL')}` },
    ];

    const mecanicosMap: any = {};
    historial.forEach(o => {
        const m = o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER / SIN ASIGNAR';
        const totalOrden = (o.items_orden?.reduce((sum: number, i: any) => sum + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0);
        if (!mecanicosMap[m]) mecanicosMap[m] = { "Nombre Mecánico": m, "Autos Terminados": 0, "Producción Total": 0 };
        mecanicosMap[m]["Autos Terminados"] += 1;
        mecanicosMap[m]["Producción Total"] += totalOrden;
    });
    const mecanicosData = Object.values(mecanicosMap).sort((a: any, b: any) => b["Producción Total"] - a["Producción Total"]).map((m: any) => ({
        "Nombre Mecánico": m["Nombre Mecánico"],
        "Autos Terminados": m["Autos Terminados"],
        "Producción Total": `$${m["Producción Total"].toLocaleString('es-CL')}`
    }));

    const dbData = historial.map(o => {
        const mo = o.items_orden?.filter((i:any) => i.tipo_item === 'servicio').reduce((sum:number, i:any) => sum + i.precio, 0) || 0;
        const rep = o.items_orden?.filter((i:any) => i.tipo_item === 'repuesto').reduce((sum:number, i:any) => sum + i.precio, 0) || 0;
        return {
            "ID Orden": o.id.substring(0, 8),
            "Fecha Cierre": new Date(o.updated_at).toLocaleDateString('es-CL'),
            "Patente": o.vehiculos?.patente,
            "Cliente": o.vehiculos?.clientes?.nombre || 'Desconocido',
            "Mano de Obra": `$${mo.toLocaleString('es-CL')}`,
            "Repuestos": `$${rep.toLocaleString('es-CL')}`,
            "Diagnóstico": `$${(o.costo_revision || 0).toLocaleString('es-CL')}`,
            "Descuento": `$${(o.descuento || 0).toLocaleString('es-CL')}`,
            "TOTAL PAGADO": `$${(mo + rep + (o.costo_revision || 0) - (o.descuento || 0)).toLocaleString('es-CL')}`,
            "Mecánico Asignado": o.mecanico || 'Sin asignar'
        };
    });

    // ==========================================
    // 2. CREACIÓN DEL EXCEL Y ESTILOS
    // ==========================================
    const wb = XLSX.utils.book_new();

    const aplicarEstilos = (ws: any, anchos: number[]) => {
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1"; // Fila 1 (Cabecera)
            if (!ws[address]) continue;
            ws[address].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "0F172A" } }, // Slate 950
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
        ws['!cols'] = anchos.map(w => ({ wch: w }));
    };

    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    aplicarEstilos(wsResumen, [35, 25]);
    XLSX.utils.book_append_sheet(wb, wsResumen, "1. Resumen Ejecutivo");

    const wsMecanicos = XLSX.utils.json_to_sheet(mecanicosData.length > 0 ? mecanicosData : [{"Aviso": "Sin datos"}]);
    aplicarEstilos(wsMecanicos, [30, 20, 25]);
    XLSX.utils.book_append_sheet(wb, wsMecanicos, "2. Mecánicos");

    const wsDB = XLSX.utils.json_to_sheet(dbData.length > 0 ? dbData : [{"Aviso": "Sin datos"}]);
    aplicarEstilos(wsDB, [12, 15, 15, 25, 18, 18, 18, 18, 20, 25]);
    XLSX.utils.book_append_sheet(wb, wsDB, "3. Base de Datos");

    const fechaStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Reporte_Financiero_${nombreTaller.replace(/\s+/g, '_')}_${fechaStr}.xlsx`);
}