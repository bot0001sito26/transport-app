import { useState, useRef } from 'react';
import api from '../../api/axios';
import { X, DollarSign, FileText, Upload, CheckCircle2, Wallet, Banknote } from 'lucide-react';

export default function PayCrewModal({ isOpen, onClose, onSuccess, onError, staffData, travelId }) {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);

    const [formData, setFormData] = useState({
        payment_type: 'viatico',
        amount: '',
        description: ''
    });

    if (!isOpen || !staffData) return null;

    const handleKeyDown = (e) => {
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            return onError("Debes ingresar un monto mayor a cero.");
        }
        if (!formData.description.trim()) {
            return onError("Debes ingresar un concepto o detalle del pago.");
        }

        // ESTA ES LA CORRECCIÓN CLAVE PARA EVITAR EL ERROR 500 (CORS)
        if (!photoFile) {
            return onError("El comprobante de transferencia es obligatorio.");
        }

        setLoading(true);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', photoFile);

            // Subimos a la carpeta correspondiente según el tipo
            const folder = formData.payment_type === 'viatico' ? 'viaticos' : 'sueldos';
            const uploadRes = await api.post(`/upload/${folder}`, uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const finalPhotoUrl = uploadRes.data.url;

            const payload = {
                user_id: staffData.id,
                amount: parseFloat(formData.amount),
                description: formData.description,
                photo_url: finalPhotoUrl
            };

            if (travelId && formData.payment_type === 'viatico') {
                payload.travel_id = travelId;
            }

            if (formData.payment_type === 'viatico') {
                await api.post('/finances/advances/', payload);
            } else {
                await api.post('/finances/salaries/', payload);
            }

            onSuccess();
            setFormData({ payment_type: 'viatico', amount: '', description: '' });
            setPhotoPreview(null);
            setPhotoFile(null);

        } catch (error) {
            onError(error.response?.data?.detail || "Error al procesar la transacción financiera.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-110 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">

                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-atlas-navy/5 rounded-xl">
                            <Wallet className="w-5 h-5 text-atlas-navy" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-atlas-navy tracking-tighter uppercase italic">Emisión de Pago</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{staffData.full_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_type: 'viatico' })}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${formData.payment_type === 'viatico'
                                ? 'bg-white text-atlas-navy shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Carga de Viático
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_type: 'sueldo' })}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${formData.payment_type === 'sueldo'
                                ? 'bg-white text-atlas-navy shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Pago de Sueldo
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div className="relative group">
                            <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Monto a Transferir (USD)</label>
                            <DollarSign className="absolute right-5 top-7 text-slate-300 w-5 h-5 pointer-events-none group-focus-within:text-atlas-yellow transition-colors" />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                onKeyDown={handleKeyDown}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-5 pt-8 pb-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-atlas-navy focus:bg-white transition-all font-black text-2xl text-atlas-navy"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Concepto / Referencia</label>
                            <FileText className="absolute right-5 top-7 text-slate-300 w-5 h-5 pointer-events-none group-focus-within:text-atlas-yellow transition-colors" />
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 pt-8 pb-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-atlas-navy focus:bg-white transition-all font-bold text-atlas-navy text-sm"
                                placeholder={formData.payment_type === 'viatico' ? "Ej. Recarga mensual" : "Ej. Quincena Febrero"}
                            />
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-top-2">
                        <input type="file" accept="image/*,application/pdf" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className={`group relative overflow-hidden rounded-3xl border-2 border-dashed transition-all cursor-pointer ${photoPreview ? 'border-atlas-navy bg-atlas-navy/5' : 'border-slate-200 bg-slate-50 hover:border-atlas-navy/30'
                                }`}
                        >
                            {photoPreview ? (
                                <div className="relative h-24 w-full">
                                    <img src={photoPreview} className="h-full w-full object-cover" alt="Comprobante" />
                                    <div className="absolute inset-0 bg-atlas-navy/20 flex items-center justify-center backdrop-blur-[2px]">
                                        <CheckCircle2 className="text-atlas-yellow w-8 h-8 drop-shadow-lg" />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center gap-2">
                                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comprobante Obligatorio</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Banknote className="w-5 h-5" />
                        {loading ? "Procesando..." : "Confirmar Transacción"}
                    </button>
                </form>
            </div>
        </div>
    );
}