import { useState } from 'react';
import { X, CheckCircle, MapPin, Gauge, Loader2, Camera, Image as ImageIcon, Wallet } from 'lucide-react';
import api from '../../api/axios';

export default function FinishTripModal({ isOpen, onClose, travelId, truckId, truck, onSuccess, onError }) {
    const [odometer, setOdometer] = useState('');
    const [photo, setPhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gpsStatus, setGpsStatus] = useState('pending');

    if (!isOpen) return null;

    const currentCash = truck?.current_balance || 0;

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!odometer || isNaN(odometer)) return onError("Por favor ingresa un odómetro válido.");
        if (!photo) return onError("La foto del odómetro final es obligatoria.");
        if (!truckId) return onError("Error interno: No se identificó el camión.");

        setIsSubmitting(true);
        setGpsStatus('scanning');

        if (!navigator.geolocation) {
            setGpsStatus('error');
            onError("Tu dispositivo no soporta geolocalización.");
            setIsSubmitting(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setGpsStatus('success');
                try {
                    await api.post('/tracking/', {
                        truck_id: truckId,
                        travel_id: travelId,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        speed: 0,
                        device_time: new Date().toISOString(),
                        source: "finish_trip"
                    });

                    const formData = new FormData();
                    formData.append('file', photo);
                    const uploadRes = await api.post('/upload/odometro_final', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    await api.patch(`/travels/${travelId}/finish`, {
                        end_odometer: parseFloat(odometer),
                        end_odometer_photo_url: uploadRes.data.url,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });

                    onSuccess();
                    setOdometer('');
                    setPhoto(null);
                    setPreviewUrl('');
                } catch (error) {
                    onError(error.response?.data?.detail || "No se pudo finalizar el viaje.");
                } finally {
                    setIsSubmitting(false);
                }
            },
            (error) => {
                console.error(error);
                setGpsStatus('error');
                onError("No pudimos obtener tu ubicación GPS. Asegúrate de dar permisos.");
                setIsSubmitting(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-atlas-navy tracking-tight">Finalizar Viaje</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Llegada a Base</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-atlas-navy rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">

                    {/* CONFIRMACIÓN DE CAJA CHICA INCRUSTADA */}
                    <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5" /> Liquidación de Efectivo
                        </h4>

                        <div className="flex justify-between items-end mb-3">
                            <span className="text-xs font-bold text-slate-600">Saldo físico a guardar o entregar:</span>
                            <span className="text-xl font-black text-emerald-600">${currentCash.toFixed(2)}</span>
                        </div>

                        <label className="flex items-start gap-2.5 mt-2 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:border-atlas-navy/30 transition-colors">
                            <input type="checkbox" required className="mt-0.5 w-4 h-4 text-atlas-navy rounded border-slate-300 focus:ring-atlas-navy" />
                            <span className="text-[10px] sm:text-xs text-slate-600 font-medium leading-tight">
                                Confirmo que el remanente del fondo físico es exacto.
                            </span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Kilometraje Final
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Gauge className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="number" step="0.1" required
                                value={odometer}
                                onChange={(e) => setOdometer(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-atlas-navy/30 focus:border-atlas-navy text-atlas-navy font-semibold text-lg transition-all outline-none"
                                placeholder="Ej. 125400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Foto del Odómetro Final
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-atlas-navy/40 hover:bg-atlas-navy/5 transition-colors relative overflow-hidden group">
                            {previewUrl ? (
                                <div className="absolute inset-0 w-full h-full">
                                    <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs font-bold flex items-center gap-2"><Camera className="w-4 h-4" /> CAMBIAR FOTO</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-center">
                                    <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                                    <div className="flex text-sm text-slate-600 justify-center">
                                        <span className="relative cursor-pointer rounded-md font-bold text-atlas-navy hover:text-slate-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-atlas-navy">
                                            <span>Subir archivo</span>
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase">PNG, JPG, JPEG</p>
                                </div>
                            )}
                            <input
                                id="photo-upload" name="photo-upload" type="file" accept="image/jpeg, image/png, image/jpg"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handlePhotoChange} required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-atlas-navy/5 border border-atlas-navy/10">
                        {gpsStatus === 'scanning' ? (
                            <Loader2 className="w-5 h-5 text-atlas-navy animate-spin" />
                        ) : (
                            <MapPin className="w-5 h-5 text-atlas-navy" />
                        )}
                        <p className="text-xs text-atlas-navy font-medium leading-tight">
                            Al finalizar, se capturará tu ubicación GPS automáticamente para auditoría en el mapa.
                        </p>
                    </div>

                    <button
                        type="submit" disabled={isSubmitting}
                        className="w-full bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-4 rounded-xl font-bold shadow-lg shadow-atlas-navy/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> PROCESANDO...</>
                        ) : (
                            <><CheckCircle className="w-5 h-5" /> CONFIRMAR LLEGADA</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}