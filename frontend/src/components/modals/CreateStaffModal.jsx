import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { X, User, Lock, CreditCard, Phone, Award, Send, Users, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import AlertModal from './AlertModal';

export default function CreateStaffModal({ isOpen, onClose, onSuccess, onError, truckId, staffType }) {
    // --- ESTADO PARA CONTROLAR LAS PESTAÑAS ---
    const [activeTab, setActiveTab] = useState('existing'); // 'existing' o 'new'

    const [formData, setFormData] = useState({
        full_name: '', username: '', password: '', dni: '', phone: '', telegram_chat_id: '', license_type: ''
    });
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'error' });

    // --- CONSULTA AL BACKEND: Obtener todo el personal del dueño ---
    const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ['usersList'],
        queryFn: async () => (await api.get('/users/')).data,
        enabled: isOpen // Solo consulta si el modal está abierto
    });

    // Filtramos solo el rol que estamos buscando (chofer u oficial)
    const availableStaff = allUsers.filter(u => u.role === staffType);

    if (!isOpen) return null;

    const isDriver = staffType === 'driver';
    const title = isDriver ? 'Asignación de Chofer' : 'Asignación de Oficial';

    // --- MANEJADORES DEL FORMULARIO (Sin cambios) ---
    const handleNumberChange = (field, value, maxLength = null) => {
        let sanitized = value.replace(/[^0-9]/g, '');
        if (maxLength && sanitized.length > maxLength) sanitized = sanitized.slice(0, maxLength);
        setFormData(prev => ({ ...prev, [field]: sanitized }));
    };

    const handleNameChange = (e) => {
        let sanitized = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        setFormData(prev => ({ ...prev, full_name: sanitized }));
    };

    const handleUsernameChange = (e) => {
        let sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
        setFormData(prev => ({ ...prev, username: sanitized }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.full_name.trim()) errors.full_name = "Requerido";
        if (!formData.username.trim()) errors.username = "Requerido";
        if (!formData.password) errors.password = "Requerido";
        if (!formData.dni.trim() || formData.dni.length < 10) errors.dni = "10 dígitos req.";
        if (!formData.phone.trim() || formData.phone.length < 10) errors.phone = "10 dígitos req.";
        if (isDriver && !formData.license_type.trim()) errors.license_type = "Obligatoria";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // --- CREAR NUEVO PERSONAL ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                full_name: formData.full_name, username: formData.username, password: formData.password,
                dni: formData.dni, phone: formData.phone, telegram_chat_id: formData.telegram_chat_id.trim() || null,
                role: staffType, assigned_truck_id: parseInt(truckId), license_type: isDriver ? formData.license_type : null
            };
            const response = await api.post('/users/', payload);
            setFormData({ full_name: '', username: '', password: '', dni: '', phone: '', telegram_chat_id: '', license_type: '' });
            onSuccess(response.data);
        } catch (error) {
            let errorMessage = "Error al registrar el personal.";
            if (error.response?.status === 400 || error.response?.status === 409) {
                errorMessage = "El DNI o Usuario ya existe en la base de datos. Ve a la pestaña 'Personal Existente' para reactivarlo.";
            } else if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                errorMessage = Array.isArray(detail) ? `Error en: ${detail[0].loc.pop()}` : detail;
            }
            setAlertData({ isOpen: true, title: 'Error de Registro', message: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // --- ASIGNAR PERSONAL EXISTENTE ---
    const handleAssignExisting = async (user) => {
        setLoading(true);
        try {
            // 1. Si estaba inactivo (despedido), lo revivimos primero
            if (!user.is_active) {
                await api.patch(`/users/${user.id}/status`, { is_active: true });
            }
            // 2. Lo asignamos al nuevo camión
            await api.patch(`/users/${user.id}/assign-truck`, { truck_id: parseInt(truckId) });

            onSuccess(); // Refresca la vista
        } catch (error) {
            setAlertData({ isOpen: true, title: 'Error de Asignación', message: 'No se pudo asignar al empleado.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">

                    {/* Cabecera Fija */}
                    <div className="p-6 pb-0">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-atlas-navy tracking-tight italic uppercase">{title}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestión de Tripulación</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sistema de Pestañas */}
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                            <button onClick={() => setActiveTab('existing')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'existing' ? 'bg-atlas-navy text-atlas-yellow shadow-sm' : 'text-slate-400 hover:text-atlas-navy'}`}>
                                <Users className="w-4 h-4" /> Personal Existente
                            </button>
                            <button onClick={() => setActiveTab('new')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-atlas-navy text-atlas-yellow shadow-sm' : 'text-slate-400 hover:text-atlas-navy'}`}>
                                <UserPlus className="w-4 h-4" /> Nuevo Ingreso
                            </button>
                        </div>
                    </div>

                    {/* Contenido Dinámico con Scroll Interno */}
                    <div className="p-6 pt-0 overflow-y-auto custom-scrollbar flex-1">

                        {/* PESTAÑA 1: PERSONAL EXISTENTE */}
                        {activeTab === 'existing' && (
                            <div className="space-y-3 animate-in fade-in">
                                {isLoadingUsers ? (
                                    <div className="py-12 text-center text-slate-400"><p className="text-xs font-bold uppercase animate-pulse">Cargando base de datos...</p></div>
                                ) : availableStaff.length > 0 ? (
                                    availableStaff.map((user) => (
                                        <div key={user.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-atlas-navy/30 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-bold text-atlas-navy">{user.full_name}</h4>
                                                    {!user.is_active ? (
                                                        <span className="flex items-center gap-1 bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"><AlertCircle className="w-3 h-3" /> Inactivo</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Activo</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">DNI: {user.dni}</p>

                                                {/* Etiqueta de estado actual del camión */}
                                                {user.assigned_truck_id === parseInt(truckId) ? (
                                                    <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Ya asignado a esta unidad</span>
                                                ) : user.assigned_truck_id ? (
                                                    <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold uppercase tracking-widest">En otro camión</span>
                                                ) : (
                                                    <span className="text-[9px] bg-atlas-navy/10 text-atlas-navy border border-atlas-navy/20 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Libre de asignación</span>
                                                )}
                                            </div>

                                            {user.assigned_truck_id !== parseInt(truckId) && (
                                                <button
                                                    onClick={() => handleAssignExisting(user)}
                                                    disabled={loading}
                                                    className="shrink-0 bg-atlas-navy text-atlas-yellow px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {loading ? '...' : (user.is_active ? 'Reasignar' : 'Reactivar')}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No hay historial de personal<br />con este rol.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PESTAÑA 2: NUEVO INGRESO */}
                        {activeTab === 'new' && (
                            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in" noValidate>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 relative group">
                                        <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Nombre Completo</label>
                                        <User className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                                        <input type="text" value={formData.full_name} onChange={handleNameChange} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.full_name ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="Nombre y Apellido" />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Usuario de Acceso</label>
                                        <User className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                                        <input type="text" value={formData.username} onChange={handleUsernameChange} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.username ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="usuario.apellido" />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Contraseña</label>
                                        <Lock className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                                        <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.password ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="••••••••" />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">DNI / Cédula</label>
                                        <CreditCard className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                                        <input type="text" inputMode="numeric" value={formData.dni} onChange={e => handleNumberChange('dni', e.target.value, 10)} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.dni ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="0999999999" />
                                    </div>

                                    <div className="relative group">
                                        <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Teléfono</label>
                                        <Phone className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                                        <input type="text" inputMode="numeric" value={formData.phone} onChange={e => handleNumberChange('phone', e.target.value, 10)} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.phone ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="0912345678" />
                                    </div>

                                    <div className="md:col-span-2 relative group">
                                        <label className="text-[9px] font-black text-[#2AABEE] uppercase absolute left-4 top-2 z-10">ID Telegram (Opcional)</label>
                                        <Send className="absolute right-4 top-5 text-[#2AABEE]/50 w-4 h-4" />
                                        <input type="text" inputMode="numeric" value={formData.telegram_chat_id} onChange={e => handleNumberChange('telegram_chat_id', e.target.value)} className="w-full px-4 pt-6 pb-2 bg-blue-50/30 border-2 border-transparent rounded-xl focus:outline-none focus:border-blue-200 focus:bg-blue-50 transition-all font-bold text-sm text-atlas-navy" placeholder="Ej. 123456789" />
                                    </div>

                                    {isDriver && (
                                        <div className="md:col-span-2 relative group">
                                            <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Licencia</label>
                                            <Award className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                                            <select value={formData.license_type} onChange={e => setFormData({ ...formData, license_type: e.target.value })} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy appearance-none ${fieldErrors.license_type ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`}>
                                                <option value="">Selecciona...</option>
                                                <option value="Tipo E">Tipo E (Camiones Pesados)</option>
                                                <option value="Tipo G">Tipo G (Maquinaria)</option>
                                                <option value="Tipo C">Tipo C (Livianos)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4 mt-2">
                                    <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-atlas-navy text-atlas-yellow font-black text-[10px] rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest">
                                        {loading ? 'Procesando...' : 'Confirmar Ingreso'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <AlertModal
                isOpen={alertData.isOpen}
                onClose={() => setAlertData({ ...alertData, isOpen: false })}
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
            />
        </>
    );
}