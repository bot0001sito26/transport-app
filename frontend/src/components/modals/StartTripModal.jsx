import { useState, useRef } from 'react';
import api from '../../api/axios';
import { Gauge, Camera, X, MapPin, Loader2 } from 'lucide-react';

export default function StartTripModal({ isOpen, onClose, onSuccess, onError, travelId, truckId }) {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [odometer, setOdometer] = useState('');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleStart = async (e) => {
        e.preventDefault();
        if (!odometer || odometer <= 0) {
            onError("Por favor ingresa un kilometraje válido.");
            return;
        }
        if (!photoFile) {
            onError("La foto del tablero (odómetro) es obligatoria.");
            return;
        }

        setLoading(true);

        if (!navigator.geolocation) {
            onError("Tu navegador no soporta geolocalización.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // 1. Subir Foto a la categoría correcta
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', photoFile);

                    // La URL ahora coincide con @router.post("/{category}")
                    const uploadResponse = await api.post('/upload/odometro_inicial', uploadFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    const photoUrl = uploadResponse.data.url;

                    // 2. Guardar ubicación inicial en tracking
                    await api.post('/tracking/', {
                        truck_id: truckId,
                        travel_id: travelId,
                        latitude: latitude,
                        longitude: longitude,
                        speed: 0,
                        device_time: new Date().toISOString(),
                        source: "web_start"
                    });

                    // 3. Iniciar el viaje (Clave corregida a start_odometer_photo_url para consistencia)
                    await api.patch(`/travels/${travelId}/start`, {
                        start_odometer: parseFloat(odometer),
                        start_odometer_photo_url: photoUrl
                    });

                    onSuccess();
                    // Limpieza de estado
                    setOdometer('');
                    setPhotoFile(null);
                    setPhotoPreview(null);
                } catch (error) {
                    onError(error.response?.data?.detail || "Error al iniciar despacho.");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setLoading(false);
                onError("Se requiere GPS para confirmar la salida de patio.");
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-110 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-4xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-atlas-yellow rounded-full"></div>
                        <h3 className="text-xl font-black text-atlas-navy italic uppercase tracking-tighter">Iniciar Ruta</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleStart} className="space-y-6">
                    <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase absolute left-4 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">
                            Kilometraje de Salida
                        </label>
                        <Gauge className="absolute right-4 top-6 text-slate-300 w-5 h-5 group-focus-within:text-atlas-yellow transition-colors" />
                        <input
                            type="number"
                            required
                            value={odometer}
                            onChange={e => setOdometer(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-atlas-navy focus:bg-white rounded-2xl pt-8 pb-3 px-4 font-black text-2xl text-atlas-navy outline-none transition-all"
                            placeholder="000000"
                        />
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className={`w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${photoPreview ? 'border-atlas-navy bg-atlas-navy/5 text-atlas-navy' : 'border-slate-200 text-slate-400 hover:border-atlas-navy/40 bg-slate-50'}`}
                    >
                        <Camera className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">
                            {photoPreview ? "Tablero Capturado" : "Tomar Foto Odómetro"}
                        </span>
                    </button>

                    {photoPreview && (
                        <div className="relative w-full h-20 rounded-xl overflow-hidden border border-slate-100">
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="flex items-center gap-2 justify-center text-slate-400 bg-slate-50 py-2 rounded-xl">
                        <MapPin className="w-4 h-4 animate-pulse text-atlas-navy" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-atlas-navy">Se adjuntará ubicación GPS</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-5 rounded-2xl font-black text-lg shadow-lg shadow-atlas-navy/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                        ) : (
                            "Arrancar Viaje"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}