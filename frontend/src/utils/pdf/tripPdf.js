import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawPhotoAppendix, drawFooter } from './helpers';

// Helper para enriquecer la descripción del combustible
const formatExpenseDetail = (item) => {
    let desc = item.description ? item.description.toUpperCase() : 'N/A';
    if (item.category && item.category.toUpperCase() === 'COMBUSTIBLE') {
        const extras = [];
        if (item.gallons) extras.push(`${item.gallons} GAL`);
        if (item.odometer_reading) extras.push(`ODO: ${item.odometer_reading}`);
        if (extras.length > 0) desc += `\n[ ${extras.join(' | ')} ]`;
    }
    return desc;
};

// NUEVO HELPER MEJORADO: Busca en el viaje, luego en el camión
const getSpenderName = (userId, nestedUser, trip) => {
    // 1. Si el gasto trae el usuario anidado (lo ideal)
    if (nestedUser?.full_name) return nestedUser.full_name.toUpperCase();

    // 2. Si el usuario coincide con los tripulantes guardados en el viaje
    if (trip?.driver?.id === userId) return trip.driver.full_name?.toUpperCase() || 'CHOFER';
    if (trip?.official?.id === userId) return trip.official.full_name?.toUpperCase() || 'OFICIAL';

    // 3. Fallback: Si el viaje solo trajo los IDs planos
    if (trip?.driver_id === userId) return 'CHOFER';
    if (trip?.official_id === userId) return 'OFICIAL';

    // 4. Fallback extremo: Buscar en el camión por si acaso
    if (trip?.truck?.driver?.id === userId) return trip.truck.driver.full_name?.toUpperCase() || 'CHOFER';
    if (trip?.truck?.official?.id === userId) return trip.truck.official.full_name?.toUpperCase() || 'OFICIAL';

    // 5. Si nada de lo anterior coincide, fue alguien externo
    return 'ADMINISTRACIÓN';
};

export const buildTripSummaryPDF = async (trip, expenses, kms, totalGastos, formatDateTime) => {
    const doc = new jsPDF();
    const slate800 = [30, 41, 59];
    const slate500 = [100, 116, 139];
    const emerald600 = [5, 150, 105];

    const safeDestination = trip.destinations?.length > 0
        ? trip.destinations.map(d => d.client_name).join(' / ')
        : (trip.destination_client || 'DESTINO NO REGISTRADO');

    const safeStatus = trip.status || 'FINALIZADO';
    const safeMaterial = trip.material_type || 'NO ESPECIFICADO';

    // ==========================================
    // PÁGINA 1: DATOS DUROS Y TABLAS
    // ==========================================
    doc.setFontSize(20);
    doc.setTextColor(...slate800);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN DE VIAJE", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(...slate500);
    doc.text(`ID DE REGISTRO: #${trip.id}`, 14, 26);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(11);
    doc.setTextColor(...slate800);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DEL DESTINO", 14, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Cliente/Destino: ${safeDestination.toUpperCase()}`, 14, 46);
    doc.text(`Estado del Viaje: ${safeStatus.toUpperCase()}`, 14, 51);

    autoTable(doc, {
        startY: 60,
        head: [['EVENTO', 'FECHA Y HORA']],
        body: [
            ['REGISTRO DE CARGA', formatDateTime(trip.loaded_at)],
            ['SALIDA DE BASE (INICIO RUTA)', formatDateTime(trip.start_time)],
            ['ENTREGA EN OBRA (DESCARGA)', formatDateTime(trip.delivered_at)],
            ['LLEGADA A BASE (CIERRE)', formatDateTime(trip.end_time)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['MATERIAL', 'PESO (TON)', 'ODÓM. INICIO', 'ODÓM. FINAL', 'RECORRIDO']],
        body: [
            [
                safeMaterial.toUpperCase(),
                `${trip.weight_kg || 0} KG`,
                trip.start_odometer ? trip.start_odometer.toString() : '---',
                trip.end_odometer ? trip.end_odometer.toString() : '---',
                `${kms} KM`
            ]
        ],
        theme: 'grid',
        headStyles: { fillColor: emerald600, fontStyle: 'bold' },
        styles: { fontSize: 9, halign: 'center', cellPadding: 4 }
    });

    doc.setFontSize(11);
    doc.setTextColor(...slate800);
    doc.setFont("helvetica", "bold");
    doc.text("DESGLOSE DE GASTOS EN RUTA", 14, doc.lastAutoTable.finalY + 15);

    if (expenses && expenses.length > 0) {
        const expensesBody = expenses.map(exp => {
            // Lógica para enriquecer la descripción del gasto
            let desc = (exp.description || 'SIN DESCRIPCIÓN').toUpperCase();
            if (exp.category && exp.category.toUpperCase() === 'COMBUSTIBLE') {
                const extras = [];
                if (exp.gallons) extras.push(`${exp.gallons} GAL`);
                if (exp.odometer) extras.push(`ODO: ${exp.odometer}`);
                if (extras.length > 0) desc += `\n[ ${extras.join(' | ')} ]`;
            }

            return [
                formatDateTime(exp.created_at),
                (exp.category || 'OTRO').toUpperCase(),
                desc,
                getSpenderName(exp.user_id, exp.user, trip), // PASAMOS EL OBJETO TRIP COMPLETO AQUÍ
                `$${exp.amount.toFixed(2)}`
            ];
        });

        expensesBody.push([
            { content: 'TOTAL GASTOS REGISTRADOS', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [248, 250, 252] } },
            { content: `$${totalGastos}`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['FECHA', 'CATEGORÍA', 'DETALLE/DESCRIPCIÓN', 'REGISTRADO POR', 'MONTO']],
            body: expensesBody,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 4: { halign: 'right' } }
        });
    } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...slate500);
        doc.text("No se registraron gastos durante este ciclo de viaje.", 14, doc.lastAutoTable.finalY + 25);
    }

    // ==========================================
    // PÁGINAS DINÁMICAS DE ANEXOS FOTOGRÁFICOS
    // ==========================================
    const opPhotos = [];

    if (trip.start_odometer_photo_url) opPhotos.push({ title: "ODÓMETRO INICIAL", url: trip.start_odometer_photo_url });
    if (trip.end_odometer_photo_url) opPhotos.push({ title: "ODÓMETRO FINAL", url: trip.end_odometer_photo_url });

    if (trip.guide_photo_url) opPhotos.push({ title: "GUÍA DE REMISIÓN", url: trip.guide_photo_url });
    if (trip.delivery_photo_url) opPhotos.push({ title: "GUÍA SELLADA", url: trip.delivery_photo_url });

    trip.destinations?.forEach(dest => {
        dest.guides?.forEach(g => {
            const labelName = g.guide_type === 'carga' ? `GUÍA CARGA (${dest.client_name})` : `GUÍA SELLADA (${dest.client_name})`;
            opPhotos.push({ title: labelName.toUpperCase(), url: g.photo_url });
        });
    });

    if (opPhotos.length > 0) {
        await drawPhotoAppendix(doc, "ANEXOS FOTOGRÁFICOS DE OPERACIÓN", opPhotos);
    }

    const gastosConFoto = expenses ? expenses.filter(exp => exp.photo_url) : [];
    if (gastosConFoto.length > 0) {
        const expPhotos = gastosConFoto.map((exp, i) => ({
            title: `${i + 1}. ${(exp.category || 'GASTO').toUpperCase()} - $${exp.amount.toFixed(2)}`,
            url: exp.photo_url
        }));
        await drawPhotoAppendix(doc, "ANEXOS FOTOGRÁFICOS DE GASTOS", expPhotos);
    }

    drawFooter(doc, "Este documento es un registro oficial de operación generado automáticamente por Atlas ERP.");

    const safeFileName = safeDestination.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    doc.save(`Resumen_Viaje_${trip.id}_${safeFileName}.pdf`);
};