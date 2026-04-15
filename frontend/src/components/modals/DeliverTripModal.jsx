import { useState, useRef } from 'react';
import api from '../../api/axios';
import { Camera, X, CheckCircle2, MapPin, PackageCheck, Scale, Clock } from 'lucide-react';

// Función para asegurar que la imagen se pida al backend correcto
const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
};

export default function DeliverTripModal({ isOpen, onClose, onSuccess, onError, travelId, truckId, activeTrip }) {
    const fileInputRef = useRef(null);

    // Estado para saber qué cliente específico estamos procesando para mostrar el "Cargando..."
    const [loadingDestId, setLoadingDestId] = useState(null);

    const [deliveryPhotos, setDeliveryPhotos] = useState({});
    const [activeDestIdForUpload, setActiveDestIdForUpload] = useState(null);

    if (!isOpen || !activeTrip) return null;

    const destinations = activeTrip.destinations || [];

    const triggerUpload = (destId) => {
        setActiveDestIdForUpload(destId);
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (!activeDestIdForUpload) return;
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newPhotos = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
            setDeliveryPhotos(prev => ({
                ...prev,
                [activeDestIdForUpload]: [...(prev[activeDestIdForUpload] || []), ...newPhotos]
            }));
        }
        e.target.value = null;
        setActiveDestIdForUpload(null);
    };

    const removePhoto = (destId, indexToRemove) => {
        setDeliveryPhotos(prev => ({
            ...prev,
            [destId]: prev[destId].filter((_, i) => i !== indexToRemove)
        }));
    };

    // FUNCIÓN: Entregar a UN SOLO CLIENTE a la vez
    const handleDeliverSingle = async (destId) => {
        const currentPhotos = deliveryPhotos[destId] || [];

        if (currentPhotos.length === 0) {
            return onError("Debes subir la guía firmada por este cliente para confirmar su descarga.");
        }

        setLoadingDestId(destId);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Auditoría GPS al momento de la entrega individual
                    await api.post('/tracking/', {
                        truck_id: truckId, travel_id: travelId, latitude, longitude, speed: 0,
                        device_time: new Date().toISOString(), source: "web_delivery"
                    });

                    // Subir fotos solo de este cliente
                    const uploadPromises = currentPhotos.map(p => {
                        const formData = new FormData();
                        formData.append('file', p.file);
                        return api.post('/upload/guias_entrega', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                            .then(res => ({ photo_url: res.data.url, weight_kg: 0 })); // weight_kg 0 porque es guía de entrega
                    });

                    const uploadedPhotos = await Promise.all(uploadPromises);

                    // Payload parcial: Enviamos solo el destino que se está entregando
                    const payload = {
                        delivered_destinations: [{
                            destination_id: destId,
                            delivery_photos: uploadedPhotos
                        }]
                    };

                    // Guardamos la respuesta para saber en qué estado quedó el viaje
                    const response = await api.patch(`/travels/${travelId}/deliver`, payload);
                    const updatedTravel = response.data;

                    // Limpiamos las fotos temporales de este destino
                    setDeliveryPhotos(prev => {
                        const newPhotos = { ...prev };
                        delete newPhotos[destId];
                        return newPhotos;
                    });

                    // --- AQUÍ ESTÁ EL CAMBIO DE LOS MENSAJES ---
                    const isFinished = updatedTravel.status === 'retornando';

                    if (isFinished) {
                        onSuccess("Ruta Completada", "Todos los puntos entregados. Iniciando retorno a base.", true);
                    } else {
                        onSuccess("Entrega Parcial", "Descarga registrada. Continúe con el siguiente cliente.", false);
                    }

                } catch (error) {
                    onError("Error al procesar la descarga de este destino.");
                } finally {
                    setLoadingDestId(null);
                }
            },
            () => { setLoadingDestId(null); onError("Se requiere GPS para auditar el punto exacto de esta entrega."); },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 overflow-hidden border border-slate-100">
                <div className="p-5 sm:p-7 overflow-y-auto scrollbar-hide">
                    <div className="flex justify-between items-center mb-5 sticky top-0 bg-white z-20 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-atlas-navy tracking-tighter uppercase italic">Control de Entregas</h3>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <input type="file" accept="image/*" multiple capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

                    {destinations.length === 0 ? (
                        <p className="text-center text-slate-500 py-4 text-sm font-bold">No hay destinos registrados.</p>
                    ) : (
                        <div className="space-y-4">
                            {destinations.map(dest => {
                                const loadGuides = dest.guides?.filter(g => g.guide_type === 'carga') || [];
                                const deliveryGuides = dest.guides?.filter(g => g.guide_type === 'entrega') || [];
                                const currentDeliveryPhotos = deliveryPhotos[dest.id] || [];

                                const isDelivered = dest.status === 'entregado';
                                const isLoading = loadingDestId === dest.id;

                                return (
                                    <div key={dest.id} className={`rounded-2xl border-2 shadow-sm p-4 transition-all ${isDelivered ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100'}`}>

                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className={`text-sm font-black uppercase tracking-tight flex items-center gap-2 ${isDelivered ? 'text-emerald-700' : 'text-atlas-navy'}`}>
                                                <PackageCheck className="w-5 h-5 shrink-0" />
                                                <span className="truncate">{dest.client_name}</span>
                                            </h4>
                                            {isDelivered && (
                                                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Completado
                                                </span>
                                            )}
                                        </div>

                                        {/* Guías Originales (Las que se cargaron) */}
                                        {loadGuides.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Guías por Entregar:</p>
                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                    {loadGuides.map(guide => (
                                                        <div key={guide.id} className="shrink-0 flex flex-col gap-1 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                                            <img
                                                                src={getImageUrl(guide.photo_url)}
                                                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 opacity-90 hover:opacity-100 transition-all shadow-sm"
                                                                alt="Carga"
                                                            />
                                                            {guide.weight_kg && (
                                                                <span className="text-[8px] font-black text-slate-600 flex items-center gap-0.5">
                                                                    <Scale className="w-2.5 h-2.5 text-slate-400" />
                                                                    {guide.weight_kg} kg
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Sección de Acción: Pendiente vs Entregado */}
                                        {isDelivered ? (
                                            <div className="pt-3 border-t border-emerald-200/60 border-dashed">
                                                <p className="text-[9px] font-bold text-emerald-600 uppercase mb-2">Evidencia Entregada:</p>
                                                <div className="flex gap-2">
                                                    {deliveryGuides.map(guide => (
                                                        <img key={guide.id} src={getImageUrl(guide.photo_url)} className="w-10 h-10 rounded-lg object-cover border border-emerald-200 shadow-sm" alt="Firma" />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-3 border-t border-slate-200 border-dashed">
                                                <p className="text-[9px] font-bold text-atlas-navy uppercase mb-2">Sube la Evidencia (Firma / Sello):</p>
                                                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                                                    {currentDeliveryPhotos.map((p, index) => (
                                                        <div key={index} className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 border-atlas-navy shadow-sm">
                                                            <img src={p.preview} className="w-full h-full object-cover" alt="Firmada" />
                                                            <button type="button" onClick={() => removePhoto(dest.id, index)} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full scale-75 shadow-md">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    <div onClick={() => triggerUpload(dest.id)} className="w-14 h-14 shrink-0 border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-atlas-navy/5 hover:border-atlas-navy/40 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors">
                                                        <Camera className="w-4 h-4 text-slate-400 mb-0.5" />
                                                        <span className="text-[7px] font-black uppercase text-slate-500 text-center">Añadir</span>
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={isLoading || currentDeliveryPhotos.length === 0}
                                                    onClick={() => handleDeliverSingle(dest.id)}
                                                    className="w-full bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:text-slate-500 flex items-center justify-center gap-2"
                                                >
                                                    {isLoading ? "GUARDANDO EVIDENCIA Y GPS..." : "CONFIRMAR DESCARGA AQUÍ"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}