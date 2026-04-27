import { useState } from 'react';
import { X, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

export default function ImagePreviewModal({ isOpen, onClose, imageUrl, title = "Comprobante" }) {
    const [scale, setScale] = useState(1);

    if (!isOpen) return null;

    const handleClose = () => {
        setScale(1);
        onClose();
    };

    const handleDownload = async () => {
        if (!imageUrl) return;
        try {
            // TRUCO ANTI-CACHÉ: Evita el error 304 y fuerza las cabeceras CORS
            const cacheBusterUrl = `${imageUrl}?t=${new Date().getTime()}`;

            const response = await fetch(cacheBusterUrl, {
                method: 'GET',
                mode: 'cors',      // Obligamos a procesar CORS
                cache: 'no-store'  // Prohibimos sacar la imagen de la caché local
            });

            if (!response.ok) {
                throw new Error(`Error en la descarga: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Sanitizamos el título para que sea un buen nombre de archivo
            const safeTitle = title.replace(/\s+/g, '_').toLowerCase();
            const extension = imageUrl.split('.').pop() || 'jpg';
            link.download = `${safeTitle}.${extension}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al descargar la imagen:", error);
            alert("No se pudo descargar el comprobante. Por favor, recarga la página e intenta de nuevo.");
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center sm:p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
            {/* Ajuste para móviles: h-[100dvh] garantiza que no se salga de la pantalla por la barra del navegador */}
            <div className="bg-white w-full max-w-4xl rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-dvh sm:h-[90vh] animate-in zoom-in-95">

                {/* Header protegido contra desbordamientos */}
                <div className="flex justify-between items-center p-3 sm:p-4 border-b border-slate-100 shrink-0 bg-white">
                    {/* Contenedor del título con flex-1 y min-w-0 para permitir que el texto se trunque */}
                    <h3 className="text-sm font-bold text-atlas-navy flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{title}</span>
                    </h3>

                    {/* Contenedor de botones con shrink-0 para que NUNCA se aplasten o se salgan de pantalla */}
                    <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
                        <button type="button" onClick={handleDownload} className="p-2 text-slate-500 hover:bg-atlas-navy/10 hover:text-atlas-navy rounded-full transition-colors shrink-0" title="Descargar comprobante">
                            <Download className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
                        <button type="button" onClick={() => setScale(s => Math.max(1, s - 0.5))} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors shrink-0"><ZoomOut className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setScale(1)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors shrink-0"><RotateCcw className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setScale(s => Math.min(4, s + 0.5))} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors shrink-0"><ZoomIn className="w-4 h-4" /></button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button type="button" onClick={handleClose} className="p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors shrink-0">
                            <X className="w-6 h-6 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                <div className={`p-4 overflow-auto flex ${scale > 1 ? 'items-start' : 'items-center'} justify-center bg-slate-100 flex-1`}>
                    {imageUrl ? (
                        <div style={{ width: `${100 * scale}%`, transition: 'width 0.2s ease-out', display: 'flex', justifyContent: 'center' }}>
                            <img
                                src={imageUrl}
                                alt={title}
                                className={`rounded-xl shadow-md ${scale === 1 ? 'max-h-[80vh] object-contain' : 'h-auto w-full object-contain'}`}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 font-medium italic">El comprobante no está disponible.</p>
                    )}
                </div>
            </div>
        </div>
    );
}