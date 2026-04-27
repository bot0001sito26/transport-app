import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const buildFinanzasPDF = async (metrics, startDate, endDate) => {
    try {
        const doc = new jsPDF('p', 'pt', 'a4');

        // 1. Cabecera y Branding de ATLAS
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text('ATLAS', 40, 40);

        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text('REPORTE FINANCIERO Y AUDITORÍA DE CAJA', 40, 58);

        doc.setFontSize(10);
        doc.text(`Periodo evaluado: ${startDate} al ${endDate}`, 40, 75);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC')}`, 40, 90);

        // Línea separadora
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.line(40, 100, 555, 100);

        // 2. Tabla de Resumen (Debe/Haber)
        const ingresos = metrics?.ingresos || 0;
        const egresosRuta = metrics?.egresosRuta || 0;
        const egresosPatio = metrics?.egresosPatio || 0;
        const nomina = metrics?.nomina || 0;
        const balance = metrics?.balance || 0;

        autoTable(doc, {
            startY: 120,
            head: [['Concepto', 'Tipo', 'Monto ($)']],
            body: [
                ['Ingresos Cobrados (Facturación)', 'HABER', `+ ${ingresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`],
                ['Gastos de Ruta (Operación)', 'DEBE', `- ${egresosRuta.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`],
                ['Gastos de Patio (Mantenimiento)', 'DEBE', `- ${egresosPatio.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`],
                ['Nómina (Sueldos y Anticipos)', 'DEBE', `- ${nomina.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`],
                ['BALANCE NETO DEL PERIODO', 'RESULTADO', `${balance >= 0 ? '+' : ''}${balance.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            willDrawCell: function (data) {
                if (data.row.index === 4 && data.section === 'body') {
                    doc.setFont('helvetica', 'bold');
                    if (balance < 0) doc.setTextColor(220, 38, 38);
                    else doc.setTextColor(5, 150, 105);
                }
            }
        });

        // 3. Estado de las Cajas Chicas (IDENTIFICACIÓN POR PLACA)
        const finalY = doc.lastAutoTable.finalY + 30;
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('ESTADO DE CAJAS CHICAS (ACTIVO CIRCULANTE EN RUTA)', 40, finalY);

        const trucksData = metrics?.trucksData || [];
        const cajaChicaBody = trucksData.map(t => [
            // CORRECCIÓN AQUÍ: Usamos t.plate (singular) como dice tu backend
            t.plate ? `Placa: ${t.plate.toUpperCase()}` : `Unidad ID: ${t.id}`,
            t.brand || '---',
            `$${(t.current_balance || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`
        ]);

        const totalCajaChica = metrics?.cajaChica || 0;
        cajaChicaBody.push([{ content: 'TOTAL DISPONIBLE EN FLOTA', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, `$${totalCajaChica.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`]);

        autoTable(doc, {
            startY: finalY + 15,
            head: [['Identificador del Camión', 'Marca', 'Saldo en Caja']],
            body: cajaChicaBody,
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' }, // Atlas Yellow
            styles: { fontSize: 9 },
            columnStyles: {
                2: { halign: 'right' }
            }
        });

        // Pie de página
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Reporte de Auditoría ATLAS - Página ${i} de ${pageCount}`, 40, doc.internal.pageSize.height - 30);
        }

        return doc.output('blob');

    } catch (error) {
        console.error("Error al construir el PDF de Finanzas:", error);
        throw error;
    }
};