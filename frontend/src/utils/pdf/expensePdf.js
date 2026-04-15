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

// NUEVO HELPER: Obtiene el nombre cruzando con los tripulantes del camión
const getSpenderName = (userId, nestedUser, truck) => {
    if (nestedUser?.full_name) return nestedUser.full_name.toUpperCase();
    if (truck?.driver?.id === userId) return truck.driver.full_name?.toUpperCase() || 'CHOFER';
    if (truck?.official?.id === userId) return truck.official.full_name?.toUpperCase() || 'OFICIAL';
    return 'ADMINISTRACIÓN';
};

export const buildTruckExpensesPDF = async (truck, ledger, dateLabel, searchTripId, formatDateTime) => {
    const doc = new jsPDF();
    const slate800 = [30, 41, 59];
    const slate500 = [100, 116, 139];
    const emerald600 = [5, 150, 105];

    // --- CABECERA ---
    doc.setFontSize(18);
    doc.setTextColor(...slate800);
    doc.setFont("helvetica", "bold");
    doc.text("ESTADO DE CUENTA CONSOLIDADO", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(...slate500);
    doc.text(`UNIDAD: ${truck.plate} | MARCA: ${truck.brand || 'N/A'}`, 14, 26);

    // LÓGICA DE SUBTÍTULOS DINÁMICA
    let subTitle = "Todos los registros";
    if (searchTripId) {
        subTitle = `Filtrado por: Viaje #${searchTripId}`;
    } else if (dateLabel) {
        subTitle = dateLabel.includes(' al ')
            ? `Periodo Operativo: ${dateLabel}`
            : `Fecha de Operación: ${dateLabel}`;
    }
    doc.text(subTitle, 14, 31);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, 196, 35);

    // --- SEPARAR DATOS DEL LEDGER ---
    const abonos = ledger.filter(item => item.type === 'fund');
    const gastosPatio = ledger.filter(item => item.type === 'expense' && !item.travel_id);
    const gastosViaje = ledger.filter(item => item.type === 'expense' && item.travel_id);

    let currentY = 45;

    // 1. TABLA DE ABONOS (INGRESOS)
    if (abonos.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(...slate800);
        doc.setFont("helvetica", "bold");
        doc.text("1. INGRESOS / ABONOS A CAJA CHICA", 14, currentY);

        const abonosTotal = abonos.reduce((sum, item) => sum + item.amount, 0);
        const abonosBody = abonos.map(item => [
            formatDateTime(item.dateObj),
            item.category.toUpperCase(),
            getSpenderName(item.user_id, item.user, truck), // APLICADO AQUÍ
            `+$${item.amount.toFixed(2)}`
        ]);
        abonosBody.push([{ content: 'TOTAL ABONOS', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `+$${abonosTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: emerald600 } }]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['FECHA', 'CONCEPTO', 'REGISTRADO POR', 'MONTO']],
            body: abonosBody,
            theme: 'grid',
            headStyles: { fillColor: emerald600, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 3: { halign: 'right' } }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // 2. TABLA DE GASTOS DE PATIO (BASE)
    if (gastosPatio.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(...slate800);
        doc.setFont("helvetica", "bold");
        doc.text("2. GASTOS DE UNIDAD (EN PATIO/BASE)", 14, currentY);

        const patioTotal = gastosPatio.reduce((sum, item) => sum + item.amount, 0);
        const patioBody = gastosPatio.map(item => [
            formatDateTime(item.dateObj),
            item.category.toUpperCase(),
            formatExpenseDetail(item),
            getSpenderName(item.user_id, item.user, truck), // APLICADO AQUÍ
            `-$${item.amount.toFixed(2)}`
        ]);
        patioBody.push([{ content: 'TOTAL GASTOS PATIO', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `-$${patioTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [225, 29, 72] } }]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['FECHA', 'CATEGORÍA', 'DETALLE', 'REGISTRADO POR', 'MONTO']],
            body: patioBody,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 4: { halign: 'right' } }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // 3. TABLA DE GASTOS EN VIAJE (RUTA)
    if (gastosViaje.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(...slate800);
        doc.setFont("helvetica", "bold");
        doc.text("3. GASTOS OPERATIVOS (EN VIAJE/RUTA)", 14, currentY);

        const viajeTotal = gastosViaje.reduce((sum, item) => sum + item.amount, 0);
        const viajeBody = gastosViaje.map(item => [
            formatDateTime(item.dateObj),
            `VIAJE #${item.travel_id}`,
            item.category.toUpperCase(),
            formatExpenseDetail(item),
            getSpenderName(item.user_id, item.user, truck), // APLICADO AQUÍ
            `-$${item.amount.toFixed(2)}`
        ]);
        viajeBody.push([{ content: 'TOTAL GASTOS VIAJES', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `-$${viajeTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [225, 29, 72] } }]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['FECHA', 'REFERENCIA', 'CATEGORÍA', 'DETALLE', 'REGISTRADO POR', 'MONTO']],
            body: viajeBody,
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 5: { halign: 'right' } }
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    if (ledger.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...slate500);
        doc.text("No existen movimientos registrados para los filtros seleccionados.", 14, currentY);
    }

    // ==========================================
    // PÁGINA FINAL: ANEXOS FOTOGRÁFICOS
    // ==========================================
    const movimientosConFoto = ledger.filter(item => item.photo_url);

    if (movimientosConFoto.length > 0) {
        const fotosLedger = movimientosConFoto.map((item, i) => {
            let prefix = item.type === 'fund' ? 'ABONO' : (item.travel_id ? `VIAJE #${item.travel_id}` : 'PATIO');
            return {
                title: `${i + 1}. [${prefix}] ${item.category.toUpperCase()}`,
                url: item.photo_url
            };
        });
        await drawPhotoAppendix(doc, "ANEXOS FOTOGRÁFICOS DE COMPROBANTES", fotosLedger);
    }

    drawFooter(doc);

    const safeFilenameDate = dateLabel ? dateLabel.replace(/\s+/g, '_').replace(/\//g, '-') : 'Historico';
    doc.save(`Estado_Cuenta_${truck.plate}_${safeFilenameDate}.pdf`);
};