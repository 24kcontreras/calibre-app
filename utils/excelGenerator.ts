import * as XLSX from 'xlsx';

export const descargarExcelSupremo = (historial: any[], oportunidades: any[], nombreTaller: string) => {
    
    // ==========================================
    // 1. CÁLCULOS: RESUMEN EJECUTIVO
    // ==========================================
    let totalIngresos = 0;
    let totalDescuentos = 0;
    let totalCostoRevision = 0;
    let totalManoObra = 0;
    let totalRepuestos = 0;

    historial.forEach(o => {
        const desc = o.descuento || 0;
        const rev = o.costo_revision || 0;
        totalDescuentos += desc;
        totalCostoRevision += rev;
        
        let subtotalItems = 0;
        o.items_orden?.forEach((i: any) => {
            subtotalItems += i.precio;
            if (i.tipo_item === 'servicio') totalManoObra += i.precio;
            if (i.tipo_item === 'repuesto') totalRepuestos += i.precio;
        });

        totalIngresos += (subtotalItems + rev - desc);
    });

    const ticketPromedio = historial.length > 0 ? Math.round(totalIngresos / historial.length) : 0;

    const resumenData = [
        { "Métrica Financiera": "Total Órdenes Finalizadas", "Valor": historial.length },
        { "Métrica Financiera": "Ingresos Brutos Totales", "Valor": `$${totalIngresos.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Ingresos por Mano de Obra", "Valor": `$${totalManoObra.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Ingresos por Repuestos", "Valor": `$${totalRepuestos.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Ingresos por Diagnósticos", "Valor": `$${totalCostoRevision.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Dinero en Descuentos (Fugas)", "Valor": `$${totalDescuentos.toLocaleString('es-CL')}` },
        { "Métrica Financiera": "Ticket Promedio por Auto", "Valor": `$${ticketPromedio.toLocaleString('es-CL')}` },
    ];

    // ==========================================
    // 2. CÁLCULOS: RENDIMIENTO MECÁNICOS
    // ==========================================
    const mecanicosMap: any = {};
    historial.forEach(o => {
        const m = o.mecanico && o.mecanico !== 'Sin asignar' ? o.mecanico.toUpperCase() : 'TALLER / SIN ASIGNAR';
        const totalOrden = (o.items_orden?.reduce((sum: number, i: any) => sum + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0);
        
        if (!mecanicosMap[m]) mecanicosMap[m] = { "Nombre Mecánico": m, "Autos Terminados": 0, "Producción ($)": 0 };
        mecanicosMap[m]["Autos Terminados"] += 1;
        mecanicosMap[m]["Producción ($)"] += totalOrden;
    });
    const mecanicosData = Object.values(mecanicosMap).sort((a: any, b: any) => b["Producción ($)"] - a["Producción ($)"]);

    // ==========================================
    // 3. CÁLCULOS: INTELIGENCIA DE MARCAS
    // ==========================================
    const marcasMap: any = {};
    historial.forEach(o => {
        const marca = o.vehiculos?.marca ? o.vehiculos.marca.toUpperCase() : 'DESCONOCIDA';
        const totalOrden = (o.items_orden?.reduce((sum: number, i: any) => sum + i.precio, 0) || 0) + (o.costo_revision || 0) - (o.descuento || 0);
        
        if (!marcasMap[marca]) marcasMap[marca] = { "Marca de Vehículo": marca, "Cantidad Atendida": 0, "Rentabilidad ($)": 0 };
        marcasMap[marca]["Cantidad Atendida"] += 1;
        marcasMap[marca]["Rentabilidad ($)"] += totalOrden;
    });
    const marcasData = Object.values(marcasMap).sort((a: any, b: any) => b["Rentabilidad ($)"] - a["Rentabilidad ($)"]);

    // ==========================================
    // 4. CÁLCULOS: CRM (OPORTUNIDADES DE VENTA)
    // ==========================================
    const crmData = oportunidades.map(op => ({
        "Nivel Riesgo": op.nivel_riesgo,
        "Componente / Falla": op.pieza,
        "Observación Mecánico": op.observacion || 'Sin observaciones',
        "Patente": op.vehiculos?.patente,
        "Marca y Modelo": `${op.vehiculos?.marca} ${op.vehiculos?.modelo}`,
        "Cliente": op.vehiculos?.clientes?.nombre || 'Desconocido',
        "Teléfono (WhatsApp)": op.vehiculos?.clientes?.telefono || 'No registrado',
        "Fecha Detección": new Date(op.created_at).toLocaleDateString('es-CL')
    }));

    // ==========================================
    // 5. CÁLCULOS: BASE DE DATOS CONTABLE
    // ==========================================
    const dbData = historial.map(o => {
        const subtotalItems = o.items_orden?.reduce((sum: number, i: any) => sum + i.precio, 0) || 0;
        const totalNeto = subtotalItems + (o.costo_revision || 0) - (o.descuento || 0);
        return {
            "ID Orden": o.id.substring(0, 8),
            "Fecha Cierre": new Date(o.updated_at).toLocaleDateString('es-CL'),
            "Patente": o.vehiculos?.patente,
            "Cliente": o.vehiculos?.clientes?.nombre || 'Desconocido',
            "RUT": o.vehiculos?.clientes?.rut || '-',
            "Diagnóstico ($)": o.costo_revision || 0,
            "Mano de Obra ($)": o.items_orden?.filter((i:any) => i.tipo_item === 'servicio').reduce((sum:number, i:any) => sum + i.precio, 0) || 0,
            "Repuestos ($)": o.items_orden?.filter((i:any) => i.tipo_item === 'repuesto').reduce((sum:number, i:any) => sum + i.precio, 0) || 0,
            "Descuento ($)": o.descuento || 0,
            "TOTAL PAGADO ($)": totalNeto,
            "Mecánico": o.mecanico || 'Sin asignar'
        };
    });

    // ==========================================
    // CONSTRUCCIÓN DEL EXCEL (Libro de trabajo)
    // ==========================================
    const wb = XLSX.utils.book_new();

    // Convertir arrays a hojas de Excel
    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    const wsMecanicos = XLSX.utils.json_to_sheet(mecanicosData);
    const wsMarcas = XLSX.utils.json_to_sheet(marcasData);
    const wsCRM = XLSX.utils.json_to_sheet(crmData.length > 0 ? crmData : [{"Aviso": "No hay oportunidades pendientes"}]);
    const wsDB = XLSX.utils.json_to_sheet(dbData.length > 0 ? dbData : [{"Aviso": "No hay órdenes finalizadas"}]);

    // Añadir hojas al libro
    XLSX.utils.book_append_sheet(wb, wsResumen, "1. Resumen Ejecutivo");
    XLSX.utils.book_append_sheet(wb, wsMecanicos, "2. Rendimiento Mecánicos");
    XLSX.utils.book_append_sheet(wb, wsMarcas, "3. Analítica de Marcas");
    XLSX.utils.book_append_sheet(wb, wsCRM, "4. CRM Ventas Futuras");
    XLSX.utils.book_append_sheet(wb, wsDB, "5. Base de Datos Contable");

    // Nombre del archivo con la fecha de hoy
    const fechaArchivo = new Date().toISOString().split('T')[0];
    const fileName = `Reporte_Supremo_${nombreTaller.replace(/\s+/g, '_')}_${fechaArchivo}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
}