import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawFooter } from './helpers';

export const buildBitacoraPDF = async (notes, trucks, hasActiveFilters, startDate, endDate, truckIdFilter) => {
    const doc = new jsPDF();
    const slate800 = [30, 41, 59];
    const slate500 = [100, 116, 139];
    const atlasNavy = [15, 23, 42];

    // --- CABECERA ---
    doc.setFontSize(18);
    doc.setTextColor(...slate800);
    doc.setFont("helvetica", "bold");
    doc.text("BITÁCORA OPERATIVA CONSOLIDADA", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(...slate500);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-EC')}`, 14, 28);

    // --- SUBTÍTULOS DINÁMICOS POR FILTRO ---
    let subTitle = "Mostrando todos los registros históricos";
    if (hasActiveFilters) {
        let textParts = [];
        if (truckIdFilter) {
            const t = trucks.find(t => t.id.toString() === truckIdFilter);
            if (t) textParts.push(`Unidad: ${t.plate}`);
        }
        if (startDate && endDate) {
            textParts.push(`Periodo: ${startDate} al ${endDate}`);
        } else if (startDate) {
            textParts.push(`A partir de: ${startDate}`);
        }
        subTitle = `Reporte Filtrado | ${textParts.join(' | ')}`;
    }
    doc.text(subTitle, 14, 34);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 38, 196, 38);

    // --- TABLA DE DATOS ---
    const tableColumn = ["FECHA", "CATEGORÍA", "UNIDAD", "DETALLE DE LA ANOTACIÓN"];
    const tableRows = [];

    notes.forEach(note => {
        // Formatear fecha y hora
        const dateStr = new Date(note.date_recorded.replace(' ', 'T')).toLocaleString('es-EC', {
            dateStyle: 'short',
            timeStyle: 'short'
        });

        // Buscar placa del camión
        const truckStr = note.truck_id
            ? (trucks.find(t => t.id === note.truck_id)?.plate || 'N/A')
            : 'GENERAL';

        tableRows.push([dateStr, note.category.toUpperCase(), truckStr, note.content]);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: atlasNavy, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 3: { cellWidth: 95 } } // Dale más ancho al texto para que no se corte feo
    });

    // --- PIE DE PÁGINA OFICIAL ---
    drawFooter(doc, "Bitácora Gerencial generada de forma automática por Atlas ERP.");

    doc.save('Bitacora_Operativa_Atlas.pdf');
};