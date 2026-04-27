import { useState } from 'react';
import api from '../../api/axios';
import { X, Building2, User, Lock, CreditCard, Phone } from 'lucide-react';

export default function CreateOwnerModal({ isOpen, onClose, onSuccess, onError }) {
    const [formData, setFormData] = useState({ username: '', password: '', full_name: '', dni: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    if (!isOpen) return null;

    const validateForm = () => {
        const errors = {};
        if (!formData.full_name.trim()) errors.full_name = "Requerido";
        if (!formData.username.trim()) errors.username = "Requerido";
        if (!formData.password) errors.password = "Requerido";

        if (!formData.dni.trim()) {
            errors.dni = "Requerido";
        } else if (formData.dni.length !== 10) {
            errors.dni = "Debe tener exactamente 10 números";
        }

        if (!formData.phone.trim()) {
            errors.phone = "Requerido";
        } else if (formData.phone.length !== 10) {
            errors.phone = "Debe tener exactamente 10 números";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await api.post('/users/', { ...formData, role: 'owner' });
            setFormData({ username: '', password: '', full_name: '', dni: '', phone: '' });
            setFieldErrors({});
            onSuccess(response.data);
        } catch (error) {
            onError(error.response?.data?.detail || "Hubo un problema al crear el dueño. Verifica los datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-atlas-navy tracking-tight italic uppercase">Registrar Dueño</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Alta de franquicia</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Empresa / Nombre */}
                            <div className="md:col-span-2 relative group flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Empresa / Nombre Completo</label>
                                <Building2 className="absolute right-5 top-7 text-slate-300 w-5 h-5 group-focus-within:text-atlas-yellow transition-colors" />
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => {
                                        setFormData({ ...formData, full_name: e.target.value });
                                        if (fieldErrors.full_name) setFieldErrors({ ...fieldErrors, full_name: null });
                                    }}
                                    className={`w-full px-5 pt-8 pb-3 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all font-bold text-atlas-navy ${fieldErrors.full_name ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`}
                                    placeholder="Logística S.A."
                                />
                            </div>

                            {/* Usuario */}
                            <div className="relative group flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Usuario de Acceso</label>
                                <User className="absolute right-5 top-7 text-slate-300 w-5 h-5 group-focus-within:text-atlas-yellow transition-colors" />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => {
                                        // Filtro estricto: Todo a minúsculas y sin espacios
                                        const cleanUsername = e.target.value.toLowerCase().replace(/\s+/g, '');
                                        setFormData({ ...formData, username: cleanUsername });
                                        if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: null });
                                    }}
                                    className={`w-full px-5 pt-8 pb-3 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all font-bold text-atlas-navy ${fieldErrors.username ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`}
                                    placeholder="empresa123"
                                />
                            </div>

                            {/* Contraseña */}
                            <div className="relative group flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Contraseña</label>
                                <Lock className="absolute right-5 top-7 text-slate-300 w-5 h-5 group-focus-within:text-atlas-yellow transition-colors" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                                    }}
                                    className={`w-full px-5 pt-8 pb-3 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all font-bold text-atlas-navy ${fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`}
                                    placeholder="••••••••"
                                />
                            </div>

                            {/* DNI */}
                            <div className="relative group flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">DNI / RUC</label>
                                <CreditCard className={`absolute right-5 top-7 w-5 h-5 transition-colors ${fieldErrors.dni ? 'text-red-400' : 'text-slate-300 group-focus-within:text-atlas-yellow'}`} />
                                <input
                                    type="text"
                                    value={formData.dni}
                                    onChange={e => {
                                        // Filtro estricto: Solo números, máximo 10 caracteres
                                        const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setFormData({ ...formData, dni: onlyNums });
                                        if (fieldErrors.dni) setFieldErrors({ ...fieldErrors, dni: null });
                                    }}
                                    className={`w-full px-5 pt-8 pb-3 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all font-bold text-atlas-navy ${fieldErrors.dni ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`}
                                    placeholder="0999999999"
                                />
                                {fieldErrors.dni && fieldErrors.dni !== "Requerido" && (
                                    <span className="text-[10px] text-red-500 font-bold mt-1 px-2">{fieldErrors.dni}</span>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div className="relative group flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Teléfono</label>
                                <Phone className={`absolute right-5 top-7 w-5 h-5 transition-colors ${fieldErrors.phone ? 'text-red-400' : 'text-slate-300 group-focus-within:text-atlas-yellow'}`} />
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => {
                                        // Filtro estricto: Solo números, máximo 10 caracteres
                                        const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setFormData({ ...formData, phone: onlyNums });
                                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: null });
                                    }}
                                    className={`w-full px-5 pt-8 pb-3 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all font-bold text-atlas-navy ${fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`}
                                    placeholder="0900000000"
                                />
                                {fieldErrors.phone && fieldErrors.phone !== "Requerido" && (
                                    <span className="text-[10px] text-red-500 font-bold mt-1 px-2">{fieldErrors.phone}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-8 mt-6 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => {
                                    setFieldErrors({});
                                    onClose();
                                }}
                                className="px-6 py-3 text-sm text-slate-400 font-bold hover:text-atlas-navy transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-atlas-navy text-atlas-yellow font-black text-xs rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
                            >
                                {loading ? 'Procesando...' : 'Confirmar Alta'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}