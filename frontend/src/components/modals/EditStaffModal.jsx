import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { X, User, Phone, Send, AlertTriangle, ShieldAlert } from 'lucide-react';
import AlertModal from './AlertModal';

export default function EditStaffModal({ isOpen, onClose, staff, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'error' });

    const [formData, setFormData] = useState({
        phone: '',
        telegram_chat_id: ''
    });

    useEffect(() => {
        if (staff) {
            setFormData({
                phone: staff.phone || '',
                telegram_chat_id: staff.telegram_chat_id || ''
            });
        }
    }, [staff]);

    if (!isOpen || !staff) return null;

    const handleNumberChange = (field, value, maxLength = null) => {
        let sanitized = value.replace(/[^0-9]/g, '');
        if (maxLength && sanitized.length > maxLength) sanitized = sanitized.slice(0, maxLength);
        setFormData(prev => ({ ...prev, [field]: sanitized }));
    };

    // Actualiza los datos de contacto
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // El backend tiene un endpoint específico para el telegram
            if (formData.telegram_chat_id !== staff.telegram_chat_id) {
                await api.patch(`/users/${staff.id}/link-telegram`, { telegram_id: formData.telegram_chat_id });
            }
            onSuccess();
        } catch (error) {
            setAlertData({ isOpen: true, title: 'Error', message: 'No se pudieron actualizar los datos.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // LA MAGIA DEL DESPIDO
    const handleFireEmployee = async () => {
        const confirmFire = window.confirm(`¿Estás seguro de INACTIVAR a ${staff.full_name}?\n\nPerderá acceso al sistema y será bajado de esta unidad inmediatamente.`);
        if (!confirmFire) return;

        setActionLoading(true);
        try {
            await api.patch(`/users/${staff.id}/status`, { is_active: false });
            onSuccess(); // Al refrescar, desaparecerá del camión automáticamente
        } catch (error) {
            setAlertData({ isOpen: true, title: 'Error de Sistema', message: 'No se pudo procesar la baja.', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-4xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-atlas-navy tracking-tight italic uppercase">Ajustes de Perfil</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{staff.full_name}</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Datos Intocables */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center gap-3">
                            <div className="bg-slate-200 p-2 rounded-lg"><User className="w-5 h-5 text-slate-500" /></div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Usuario Sistema</p>
                                <p className="text-sm font-bold text-atlas-navy">{staff.username}</p>
                            </div>
                        </div>

                        {/* Formulario de Actualización */}
                        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                            <div className="relative group">
                                <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Teléfono</label>
                                <Phone className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                                <input type="text" value={formData.phone} onChange={e => handleNumberChange('phone', e.target.value, 10)} className="w-full px-4 pt-6 pb-2 bg-slate-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-atlas-navy font-bold text-sm text-atlas-navy transition-all" placeholder="0912345678" />
                            </div>

                            <div className="relative group">
                                <label className="text-[9px] font-black text-[#2AABEE] uppercase absolute left-4 top-2 z-10">ID Telegram</label>
                                <Send className="absolute right-4 top-5 text-[#2AABEE]/50 w-4 h-4" />
                                <input type="text" value={formData.telegram_chat_id} onChange={e => handleNumberChange('telegram_chat_id', e.target.value)} className="w-full px-4 pt-6 pb-2 bg-blue-50/30 border-2 border-transparent rounded-xl focus:outline-none focus:border-atlas-navy font-bold text-sm text-atlas-navy transition-all" placeholder="123456789" />
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-3 bg-atlas-navy text-atlas-yellow font-black text-[10px] rounded-xl shadow-md hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest mt-2">
                                {loading ? 'Guardando...' : 'Actualizar Datos'}
                            </button>
                        </form>

                        {/* ZONA DE PELIGRO: DESPIDO */}
                        <div className="border-t border-rose-100 pt-6">
                            <div className="flex items-start gap-3 mb-4">
                                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider">Zona de Riesgo Laboral</h4>
                                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">Al inactivar a este empleado, su sesión se cerrará de inmediato y será relevado automáticamente de esta unidad.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleFireEmployee}
                                disabled={actionLoading}
                                className="w-full py-3 bg-rose-50 text-rose-600 border border-rose-200 font-black text-[10px] rounded-xl hover:bg-rose-600 hover:text-white active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-3 h-3" />
                                {actionLoading ? 'Procesando...' : 'Inactivar / Despedir Personal'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <AlertModal isOpen={alertData.isOpen} onClose={() => setAlertData({ ...alertData, isOpen: false })} title={alertData.title} message={alertData.message} type={alertData.type} />
        </>
    );
}