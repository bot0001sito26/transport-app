import { useState, useRef } from 'react';
import api from '../../api/axios';
import { Camera, X, CheckCircle2, Receipt, DollarSign, FileText, Fuel, Gauge } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ReportExpenseModal({ isOpen, onClose, onSuccess, onError, travelId, truckId, user }) {
    const fileInputRef = useRef(null);
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);

    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        description: '',
        gallons: '',
        odometer_reading: ''
    });

    if (!isOpen) return null;

    const getUploadEndpoint = (cat) => {
        if (cat === 'combustible') return '/upload/combustible';
        if (cat === 'peaje') return '/upload/peaje';
        if (cat === 'comida') return '/upload/comida';
        if (cat === 'mecanica') return '/upload/mecanica';
        return '/upload/otros';
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleNumberChange = (field, value) => {
        let sanitized = value.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        if (parts.length > 2) {
            sanitized = parts[0] + '.' + parts.slice(1).join('');
        }
        setFormData(prev => ({ ...prev, [field]: sanitized }));
    };

    const handleReport = async (e) => {
        e.preventDefault();

        if (!formData.category) return onError("Seleccione una categoria.");
        if (!formData.amount || parseFloat(formData.amount) <= 0) return onError("Ingrese un monto valido.");
        if (!formData.description.trim()) return onError("Ingrese el motivo del gasto.");
        if (!photoFile) return onError("La foto del comprobante es obligatoria.");

        if (formData.category === 'combustible') {
            if (!formData.gallons || parseFloat(formData.gallons) <= 0) return onError("Indique los galones comprados.");
            if (!formData.odometer_reading || parseFloat(formData.odometer_reading) <= 0) return onError("Indique el kilometraje al tanquear.");
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    await api.post('/tracking/', {
                        truck_id: truckId,
                        travel_id: travelId || null,
                        latitude, longitude,
                        speed: 0,
                        device_time: new Date().toISOString(),
                        source: "expense_report"
                    });

                    const uploadEndpoint = getUploadEndpoint(formData.category);
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', photoFile);
                    uploadFormData.append('travel_id', travelId ? travelId.toString() : 'patio');

                    const uploadRes = await api.post(uploadEndpoint, uploadFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    const payload = {
                        truck_id: truckId,
                        travel_id: travelId || null,
                        category: formData.category,
                        user_id: user.id,
                        amount: parseFloat(formData.amount),
                        description: formData.description,
                        photo_url: uploadRes.data.url,
                        gallons: formData.category === 'combustible' ? parseFloat(formData.gallons) : null,
                        odometer_reading: formData.category === 'combustible' ? parseFloat(formData.odometer_reading) : null
                    };

                    await api.post('/finances/expenses/', payload);

                    // --- INVALIDACIÓN MÁGICA DE CACHÉ ---
                    queryClient.invalidateQueries({ queryKey: ['truckDetail', truckId] });
                    queryClient.invalidateQueries({ queryKey: ['truckExpenses', truckId] });
                    queryClient.invalidateQueries({ queryKey: ['ownerTrucks'] });
                    // ------------------------------------

                    onSuccess();
                    setFormData({ category: '', amount: '', description: '', gallons: '', odometer_reading: '' });
                    setPhotoPreview(null);
                    setPhotoFile(null);
                } catch (error) {
                    const msg = error.response?.data?.detail || "Error al registrar gasto.";
                    if (typeof onError === 'function') {
                        onError(Array.isArray(msg) ? msg[0].msg : msg);
                    } else {
                        console.error("Error:", msg);
                    }
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setLoading(false);
                onError("Se requiere GPS para validar el reporte de gasto.");
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-atlas-yellow rounded-full"></div>
                        <h3 className="text-xl font-black text-atlas-navy tracking-tighter uppercase italic">Reportar Gasto</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleReport} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2 relative group">
                            <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Categoria</label>
                            <Receipt className="absolute right-5 top-7 text-slate-300 w-5 h-5 pointer-events-none group-focus-within:text-atlas-yellow transition-colors" />
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-5 pt-8 pb-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-atlas-navy focus:bg-white transition-all font-bold text-atlas-navy appearance-none text-sm cursor-pointer"
                            >
                                <option value="">Seleccione...</option>
                                <option value="combustible">Combustible</option>
                                <option value="peaje">Peaje</option>
                                <option value="mecanica">Mecánica (Daño en ruta/patio)</option>
                                {travelId && <option value="comida">Alimentacion (Viático)</option>}
                                <option value="otros">Otros (Cargadores, etc.)</option>
                            </select>
                        </div>

                        <div className="col-span-2 relative group">
                            <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Descripcion</label>
                            <FileText className="absolute right-5 top-7 text-slate-300 w-5 h-5 pointer-events-none group-focus-within:text-atlas-yellow transition-colors" />
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 pt-8 pb-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-atlas-navy focus:bg-white transition-all font-bold text-atlas-navy text-sm"
                                placeholder="Motivo del gasto"
                            />
                        </div>

                        <div className="col-span-2 relative group">
                            <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Monto Total (USD)</label>
                            <DollarSign className="absolute right-5 top-7 text-slate-300 w-5 h-5 pointer-events-none group-focus-within:text-atlas-yellow transition-colors" />
                            <input
                                type="text" inputMode="decimal"
                                value={formData.amount}
                                onChange={(e) => handleNumberChange('amount', e.target.value)}
                                className="w-full px-5 pt-8 pb-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-atlas-navy focus:bg-white transition-all font-black text-2xl text-atlas-navy"
                                placeholder="0.00"
                            />
                        </div>

                        {formData.category === 'combustible' && (
                            <div className="col-span-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="relative group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Galones</label>
                                    <Fuel className="absolute right-4 top-7 text-slate-300 w-5 h-5 pointer-events-none group-focus-within:text-atlas-yellow transition-colors" />
                                    <input
                                        type="text" inputMode="decimal"
                                        value={formData.gallons}
                                        onChange={(e) => handleNumberChange('gallons', e.target.value)}
                                        className="w-full px-5 pt-8 pb-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-atlas-navy focus:bg-white transition-all font-bold text-atlas-navy text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Odómetro</label>
                                    <Gauge className="absolute right-4 top-7 text-slate-300 w-5 h-5 pointer-events-none group-focus-within:text-atlas-yellow transition-colors" />
                                    <input
                                        type="text" inputMode="decimal"
                                        value={formData.odometer_reading}
                                        onChange={(e) => handleNumberChange('odometer_reading', e.target.value)}
                                        className="w-full px-5 pt-8 pb-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-atlas-navy focus:bg-white transition-all font-bold text-atlas-navy text-sm"
                                        placeholder="KM"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    <div
                        onClick={() => fileInputRef.current.click()}
                        className={`group relative overflow-hidden rounded-3xl border-2 border-dashed transition-all cursor-pointer ${photoPreview ? 'border-atlas-navy bg-atlas-navy/5' : 'border-slate-200 bg-slate-50 hover:border-atlas-navy/30'}`}
                    >
                        {photoPreview ? (
                            <div className="relative h-32 w-full">
                                <img src={photoPreview} className="h-full w-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-atlas-navy/20 flex items-center justify-center backdrop-blur-[2px]">
                                    <CheckCircle2 className="text-atlas-yellow w-10 h-10 drop-shadow-lg" />
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center gap-2">
                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera className="w-6 h-6 text-slate-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comprobante Fisico</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? "Registrando..." : "Confirmar Gasto"}
                    </button>
                </form>
            </div>
        </div>
    );
}