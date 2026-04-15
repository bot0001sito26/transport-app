// src/utils/pdf/helpers.js

export const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const baseUrl = apiUrl.replace(/\/api.*$/, '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const fetchImageAsBase64 = async (path) => {
    if (!path) return null;
    try {
        const url = getFullImageUrl(path);

        // TRUCO ANTI-CACHÉ Y CORS ESTRICTO
        const cacheBusterUrl = `${url}?t=${new Date().getTime()}`;

        const response = await fetch(cacheBusterUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-store'
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error cargando imagen para el PDF:", error);
        return null;
    }
};

export const drawFooter = (doc, prefixText = "Documento generado por Atlas ERP.") => {
    const pages = doc.internal.getNumberOfPages();
    for (let j = 1; j <= pages; j++) {
        doc.setPage(j);
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont("helvetica", "normal");
        doc.text(prefixText, 14, pageHeight - 15);
        doc.text(`Fecha de impresión: ${new Date().toLocaleString('es-EC')}`, 14, pageHeight - 10);
        doc.text(`Página ${j} de ${pages}`, 180, pageHeight - 10);
    }
};

export const drawPhotoAppendix = async (doc, title, items) => {
    if (!items || items.length === 0) return;

    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 20);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 24, 196, 24);

    let currentY = 32;
    let colIndex = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const xPos = colIndex === 0 ? 14 : 105;

        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text(item.title, xPos, currentY);

        if (item.url) {
            const base64Data = await fetchImageAsBase64(item.url);
            if (base64Data) {
                try {
                    let format = 'JPEG';
                    if (base64Data.startsWith('data:image/png')) format = 'PNG';
                    else if (base64Data.startsWith('data:image/webp')) format = 'WEBP';
                    doc.addImage(base64Data, format, xPos, currentY + 3, 85, 100);
                } catch (e) {
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(xPos, currentY + 3, 85, 100);
                    doc.setFontSize(8);
                    doc.text("ERROR DE IMAGEN", xPos + 42.5, currentY + 53, { align: "center" });
                }
            } else {
                doc.setDrawColor(200, 200, 200);
                doc.rect(xPos, currentY + 3, 85, 100);
                doc.setFontSize(8);
                doc.text("IMAGEN NO ENCONTRADA", xPos + 42.5, currentY + 53, { align: "center" });
            }
        } else {
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.rect(xPos, currentY + 3, 85, 100, "FD");
            doc.setTextColor(148, 163, 184);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.text("FOTO NO REGISTRADA", xPos + 42.5, currentY + 53, { align: "center" });
        }

        colIndex++;
        if (colIndex > 1) {
            colIndex = 0;
            currentY += 115;
            if (currentY > 240 && i < items.length - 1) {
                doc.addPage();
                currentY = 20;
            }
        }
    }
};