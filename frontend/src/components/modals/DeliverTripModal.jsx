import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Camera, X, CheckCircle2, PackageCheck, PackageOpen, FileText, ChevronDown } from 'lucide-react';

const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
};

export default function DeliverTripModal({ isOpen, onClose, onSuccess, onError, travelId, truckId, activeTrip }) {
    const [loadingDestId, setLoadingDestId] = useState(null);
    const [expandedDestId, setExpandedDestId] = useState(null);

    // Mantenemos 1 foto de estiba y 1 foto de guía por destino
    const [stowagePhotos, setStowagePhotos] = useState({});
    const [guidePhotos, setGuidePhotos] = useState({});

    useEffect(() => {
        if (isOpen && activeTrip?.destinations?.length > 0) {
            // Expandimos el primer destino que no esté entregado por defecto
            const firstPending = activeTrip.destinations.find(d => d.status !== 'entregado');
            if (firstPending) setExpandedDestId(firstPending.id);
        }
    }, [isOpen, activeTrip]);

    if (!isOpen || !activeTrip) return null;
    const destinations = activeTrip.destinations || [];

    const toggleExpand = (id) => setExpandedDestId(expandedDestId === id ? null : id);

    const handleStowageChange = (destId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        setStowagePhotos(prev => ({ ...prev, [destId]: { file, preview: URL.createObjectURL(file) } }));
        e.target.value = null;
    };

    const removeStowagePhoto = (destId) => {
        setStowagePhotos(prev => { const newPhotos = { ...prev }; delete newPhotos[destId]; return newPhotos; });
    };

    const handleGuideChange = (destId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        setGuidePhotos(prev => ({ ...prev, [destId]: { file, preview: URL.createObjectURL(file) } }));
        e.target.value = null;
    };

    const removeGuidePhoto = (destId) => {
        setGuidePhotos(prev => { const newPhotos = { ...prev }; delete newPhotos[destId]; return newPhotos; });
    };

    const handleDeliverSingle = async (destId) => {
        const currentStowage = stowagePhotos[destId];
        const currentGuide = guidePhotos[destId];

        if (!currentStowage) return onError("Debes subir la foto de la estiba (evidencia del personal descargando).");
        if (!currentGuide) return onError("Debes subir la guía firmada por este cliente para confirmar su descarga.");

        setLoadingDestId(destId);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    await api.post('/tracking/', {
                        truck_id: truckId, travel_id: travelId, latitude, longitude, speed: 0,
                        device_time: new Date().toISOString(), source: "web_delivery"
                    });

                    // 1. Subir foto de Estibas
                    const stowageForm = new FormData();
                    stowageForm.append('file', currentStowage.file);
                    const stowageRes = await api.post('/upload/foto_estiba', stowageForm, { headers: { 'Content-Type': 'multipart/form-data' } });

                    // 2. Subir Guía de Entrega (1 sola)
                    const guideForm = new FormData();
                    guideForm.append('file', currentGuide.file);
                    const guideRes = await api.post('/upload/guias_entrega', guideForm, { headers: { 'Content-Type': 'multipart/form-data' } });

                    // 3. Enviar payload (el backend espera arreglo, enviamos array de 1 elemento)
                    const payload = {
                        delivered_destinations: [{
                            destination_id: destId,
                            stowage_photo_url: stowageRes.data.url,
                            delivery_photos: [{ photo_url: guideRes.data.url, weight_kg: 0 }]
                        }]
                    };

                    const response = await api.patch(`/travels/${travelId}/deliver`, payload);
                    const updatedTravel = response.data;

                    removeStowagePhoto(destId);
                    removeGuidePhoto(destId);

                    const isFinished = updatedTravel.status === 'retornando';

                    if (isFinished) {
                        onSuccess("Ruta Completada", "Todos los puntos entregados. Iniciando retorno a base.", true);
                    } else {
                        // Expandimos automáticamente el siguiente pendiente
                        const nextPending = updatedTravel.destinations.find(d => d.status !== 'entregado');
                        if (nextPending) setExpandedDestId(nextPending.id);
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
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-110 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-4xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 overflow-hidden border border-slate-100">

                <div className="flex justify-between items-center p-5 sm:px-7 sm:py-5 border-b border-slate-100 bg-white z-20 shrink-0 shadow-sm">
                    <h3 className="text-xl sm:text-2xl font-black text-atlas-navy tracking-tight uppercase italic">Control de Entregas</h3>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 sm:p-7 overflow-y-auto scrollbar-hide flex-1">
                    {destinations.length === 0 ? (
                        <p className="text-center text-slate-500 py-4 text-sm font-bold">No hay destinos registrados.</p>
                    ) : (
                        <div className="space-y-4">
                            {destinations.map((dest, index) => {
                                const isExpanded = expandedDestId === dest.id;
                                const isDelivered = dest.status === 'entregado';
                                const isLoading = loadingDestId === dest.id;
                                const stowagePreview = stowagePhotos[dest.id]?.preview;
                                const guidePreview = guidePhotos[dest.id]?.preview;

                                // Guías originales y de entrega enviadas desde el backend
                                const loadGuides = dest.guides?.filter(g => g.guide_type === 'carga') || [];
                                const deliveryGuides = dest.guides?.filter(g => g.guide_type === 'entrega') || [];

                                return (
                                    <div key={dest.id} className={`bg-white border-2 rounded-2xl shadow-sm transition-all overflow-hidden ${isDelivered ? 'border-emerald-100 bg-emerald-50/20' : (isExpanded ? 'border-atlas-navy/30' : 'border-slate-100')}`}>

                                        {/* Cabecera Colapsable */}
                                        <div
                                            className="flex items-center justify-between p-3 sm:p-4 cursor-pointer select-none bg-slate-50/50"
                                            onClick={() => toggleExpand(dest.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${isDelivered ? 'bg-emerald-100 text-emerald-600' : (isExpanded ? 'bg-atlas-navy text-atlas-yellow' : 'bg-slate-200 text-slate-500')}`}>
                                                    {isDelivered ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                                                </div>
                                                <div>
                                                    <h4 className={`text-xs md:text-sm font-black uppercase tracking-wide ${isDelivered ? 'text-emerald-700' : 'text-atlas-navy'}`}>
                                                        {dest.client_name}
                                                    </h4>
                                                    {!isDelivered && loadGuides.length > 0 && (
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Carga: {loadGuides[0].weight_kg || '0'} Kg</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <ChevronDown className={`w-5 h-5 ${isDelivered ? 'text-emerald-400' : 'text-slate-400'} transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>

                                        {/* Contenido Expandido */}
                                        {isExpanded && (
                                            <div className="p-4 sm:p-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">

                                                {isDelivered ? (
                                                    <div className="space-y-4">
                                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                                                <CheckCircle2 className="w-4 h-4" /> Entrega Verificada
                                                            </p>
                                                            <div className="flex gap-3 overflow-x-auto">
                                                                {dest.stowage_photo_url && (
                                                                    <div className="w-20 h-20 shrink-0 relative rounded-lg overflow-hidden border border-emerald-200 shadow-sm">
                                                                        <img src={getImageUrl(dest.stowage_photo_url)} className="w-full h-full object-cover" alt="Estiba" />
                                                                    </div>
                                                                )}
                                                                {deliveryGuides.map(guide => (
                                                                    <div key={guide.id} className="w-20 h-20 shrink-0 relative rounded-lg overflow-hidden border border-emerald-200 shadow-sm">
                                                                        <img src={getImageUrl(guide.photo_url)} className="w-full h-full object-cover" alt="Firma" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* 1. Foto Estibas */}
                                                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200 flex flex-col">
                                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">1. Foto Estibas</label>
                                                                <div className="flex-1">
                                                                    {stowagePreview ? (
                                                                        <div className="relative w-full h-28 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                                            <img src={stowagePreview} className="w-full h-full object-cover" alt="Estiba" />
                                                                            <button type="button" onClick={() => removeStowagePhoto(dest.id)} className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 active:scale-95 transition-all">
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-atlas-navy/40 cursor-pointer transition-all group/upload">
                                                                            <PackageOpen className="w-6 h-6 text-slate-400 group-hover/upload:text-atlas-navy mb-1.5 transition-colors" />
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/upload:text-atlas-navy transition-colors">Subir Foto</span>
                                                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleStowageChange(dest.id, e)} />
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* 2. Guía Sellada (ÚNICA) */}
                                                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200 flex flex-col">
                                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">2. Guía Sellada</label>
                                                                <div className="flex-1 flex flex-col gap-2">
                                                                    {guidePreview ? (
                                                                        <div className="relative w-full h-28 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                                            <img src={guidePreview} className="w-full h-full object-cover" alt="Guía" />
                                                                            <button type="button" onClick={() => removeGuidePhoto(dest.id)} className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 active:scale-95 transition-all">
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-atlas-navy/40 cursor-pointer transition-all group/upload">
                                                                            <FileText className="w-6 h-6 text-slate-400 group-hover/upload:text-atlas-navy mb-1.5 transition-colors" />
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/upload:text-atlas-navy transition-colors">Subir Guía</span>
                                                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleGuideChange(dest.id, e)} />
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Botón con mb-6 y mt-6 para que NUNCA choque */}
                                                        <button
                                                            disabled={isLoading || !stowagePreview || !guidePreview}
                                                            onClick={() => handleDeliverSingle(dest.id)}
                                                            className="w-full mt-6 bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-4 rounded-xl font-black text-[13px] shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:text-slate-500 flex items-center justify-center gap-2"
                                                        >
                                                            {isLoading ? "GUARDANDO EVIDENCIA Y GPS..." : "CONFIRMAR DESCARGA"}
                                                        </button>
                                                    </div>
                                                )}
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