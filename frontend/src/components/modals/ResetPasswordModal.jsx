import { useState } from 'react';
import api from '../../api/axios';

export default function ResetPasswordModal({ isOpen, onClose, userId, onSuccess, onError }) {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch(`/users/${userId}/password?new_password=${newPassword}`);
            setNewPassword('');
            onSuccess();
        } catch (error) {
            // Usamos la función onError devuelta al padre
            onError(error.response?.data?.detail || "No se pudo actualizar la contraseña. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-atlas-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-6 md:p-8">
                    <h3 className="text-xl font-extrabold text-atlas-navy mb-4">Resetear Contraseña</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nueva Contraseña</label>
                            <input
                                required
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-atlas-navy/30 focus:border-atlas-navy outline-none transition-all text-atlas-navy font-bold"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 mt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                            <button type="submit" disabled={loading} className="px-4 py-2.5 bg-atlas-navy text-atlas-yellow font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50">
                                {loading ? 'Cambiando...' : 'Actualizar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}