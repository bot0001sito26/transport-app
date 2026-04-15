import { useState } from 'react';
import api from '../../api/axios';
import { X, Truck, Save, Loader2 } from 'lucide-react';

export default function CreateTruckModal({ isOpen, onClose, onSuccess, onError }) {
    const [formData, setFormData] = useState({
        plate: '', brand: '', model: '', capacity_tons: '', tracking_type: 'telegram', tracklink_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    if (!isOpen) return null;

    const validateForm = () => {
        const errors = {};
        if (!formData.plate.trim()) errors.plate = "Obligatorio";
        else if (!/^[A-Z0-9-]+$/i.test(formData.plate)) errors.plate = "Formato: ABC-1234";
        if (!formData.brand.trim()) errors.brand = "Obligatorio";
        if (!formData.model.trim()) errors.model = "Obligatorio";
        if (!formData.capacity_tons || isNaN(formData.capacity_tons) || Number(formData.capacity_tons) <= 0) errors.capacity_tons = "Inválido";
        if (formData.tracking_type === 'tracklink' && !formData.tracklink_id.trim()) errors.tracklink_id = "Requerido";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                ...formData,
                plate: formData.plate.toUpperCase().trim(),
                capacity_tons: parseFloat(formData.capacity_tons),
                tracklink_id: formData.tracking_type === 'telegram' ? null : formData.tracklink_id.trim()
            };
            const response = await api.post('/trucks/', payload);
            setFormData({ plate: '', brand: '', model: '', capacity_tons: '', tracking_type: 'telegram', tracklink_id: '' });
            setFieldErrors({});
            onSuccess(response.data);
        } catch (error) {
            let msg = "Error al registrar la unidad.";
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                msg = Array.isArray(detail) ? `Formato rechazado: ${detail[0].loc[detail[0].loc.length - 1]}` : detail;
            }
            onError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Cabecera */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-atlas-navy p-2 rounded-xl">
                            <Truck className="w-4 h-4 text-atlas-yellow" />
                        </div>
                        <h3 className="text-sm font-bold text-atlas-navy uppercase tracking-wide">Nueva Unidad</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-atlas-navy hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Placa Identificadora</label>
                            <input
                                type="text"
                                required
                                value={formData.plate}
                                onChange={(e) => {
                                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                                    if (val.length === 3 && !val.includes('-')) val += '-';
                                    setFormData({ ...formData, plate: val });
                                }}
                                maxLength={8}
                                placeholder="ABC-1234"
                                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:border-atlas-navy focus:ring-1 focus:ring-atlas-navy/30 transition-all text-sm font-mono font-medium tracking-widest text-atlas-navy ${fieldErrors.plate ? 'border-red-300 focus:ring-red-400 bg-red-50/50' : 'border-slate-200'}`}
                            />
                            {fieldErrors.plate && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-wide">{fieldErrors.plate}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Marca</label>
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={e => { setFormData({ ...formData, brand: e.target.value }); if (fieldErrors.brand) setFieldErrors({ ...fieldErrors, brand: null }); }}
                                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:border-atlas-navy focus:ring-1 focus:ring-atlas-navy/30 transition-all text-sm text-atlas-navy ${fieldErrors.brand ? 'border-red-300 focus:ring-red-400' : 'border-slate-200'}`}
                                placeholder="Ej. Hino"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Modelo</label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={e => { setFormData({ ...formData, model: e.target.value }); if (fieldErrors.model) setFieldErrors({ ...fieldErrors, model: null }); }}
                                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:border-atlas-navy focus:ring-1 focus:ring-atlas-navy/30 transition-all text-sm text-atlas-navy ${fieldErrors.model ? 'border-red-300 focus:ring-red-400' : 'border-slate-200'}`}
                                placeholder="Ej. GH"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tonelaje</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.capacity_tons}
                                onChange={e => { setFormData({ ...formData, capacity_tons: e.target.value }); if (fieldErrors.capacity_tons) setFieldErrors({ ...fieldErrors, capacity_tons: null }); }}
                                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:border-atlas-navy focus:ring-1 focus:ring-atlas-navy/30 transition-all text-sm text-atlas-navy ${fieldErrors.capacity_tons ? 'border-red-300 focus:ring-red-400' : 'border-slate-200'}`}
                                placeholder="Ej. 12.5"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Telemetría</label>
                            <select
                                value={formData.tracking_type}
                                onChange={e => setFormData({ ...formData, tracking_type: e.target.value })}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-atlas-navy focus:ring-1 focus:ring-atlas-navy/30 transition-all text-sm font-medium text-atlas-navy cursor-pointer"
                            >
                                <option value="telegram">Telegram</option>
                                <option value="tracklink">Tracklink</option>
                            </select>
                        </div>

                        {formData.tracking_type === 'tracklink' && (
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ID Dispositivo Tracklink</label>
                                <input
                                    type="text"
                                    value={formData.tracklink_id}
                                    onChange={e => { setFormData({ ...formData, tracklink_id: e.target.value }); if (fieldErrors.tracklink_id) setFieldErrors({ ...fieldErrors, tracklink_id: null }); }}
                                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:border-atlas-navy focus:ring-1 focus:ring-atlas-navy/30 transition-all font-mono text-sm text-atlas-navy ${fieldErrors.tracklink_id ? 'border-red-300 focus:ring-red-400' : 'border-slate-200'}`}
                                    placeholder="TK-987654321"
                                />
                                {fieldErrors.tracklink_id && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-wide">{fieldErrors.tracklink_id}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 mt-2">
                        <button type="button" onClick={() => { setFieldErrors({}); onClose(); }} className="flex-1 py-3 text-[10px] text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-atlas-navy text-atlas-yellow text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-atlas-navy/20 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}