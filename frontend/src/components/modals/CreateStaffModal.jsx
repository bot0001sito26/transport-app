import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { X, Users, UserPlus } from 'lucide-react';
import AlertModal from './AlertModal';
import StaffExistingList from './components/StaffExistingList';
import StaffNewForm from './components/StaffNewForm';

export default function CreateStaffModal({ isOpen, onClose, onSuccess, onError, truckId, staffType }) {
    const [activeTab, setActiveTab] = useState('existing');
    const [formData, setFormData] = useState({
        full_name: '', username: '', password: '', dni: '', phone: '', license_type: ''
    });
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'error' });

    const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ['usersList'],
        queryFn: async () => (await api.get('/users/')).data,
        enabled: isOpen
    });

    const availableStaff = allUsers.filter(u => u.role === staffType);
    if (!isOpen) return null;

    const isDriver = staffType === 'driver';
    let title = 'Asignación de Personal';
    if (staffType === 'driver') title = 'Asignación de Chofer';
    else if (staffType === 'official') title = 'Asignación de Oficial';
    else if (staffType === 'extra_official') title = 'Asignación de Oficial Extra';

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                full_name: formData.full_name,
                username: formData.username,
                password: formData.password,
                dni: formData.dni,
                phone: formData.phone,
                // Enviamos null al backend para que el campo quede vacío pero exista
                telegram_chat_id: null,
                role: staffType,
                assigned_truck_id: parseInt(truckId),
                license_type: isDriver ? formData.license_type : null
            };
            const response = await api.post('/users/', payload);
            setFormData({ full_name: '', username: '', password: '', dni: '', phone: '', license_type: '' });
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

    const handleAssignExisting = async (user) => {
        setLoading(true);
        try {
            if (!user.is_active) {
                await api.patch(`/users/${user.id}/status`, { is_active: true });
            }
            await api.patch(`/users/${user.id}/assign-truck`, { truck_id: parseInt(truckId) });
            onSuccess();
        } catch (error) {
            setAlertData({ isOpen: true, title: 'Error de Asignación', message: 'No se pudo asignar al empleado.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-4xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
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

                        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                            <button onClick={() => setActiveTab('existing')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'existing' ? 'bg-atlas-navy text-atlas-yellow shadow-sm' : 'text-slate-400 hover:text-atlas-navy'}`}>
                                <Users className="w-4 h-4" /> Personal Existente
                            </button>
                            <button onClick={() => setActiveTab('new')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-atlas-navy text-atlas-yellow shadow-sm' : 'text-slate-400 hover:text-atlas-navy'}`}>
                                <UserPlus className="w-4 h-4" /> Nuevo Ingreso
                            </button>
                        </div>
                    </div>

                    <div className="p-6 pt-0 overflow-y-auto custom-scrollbar flex-1">
                        {activeTab === 'existing' && (
                            <StaffExistingList availableStaff={availableStaff} isLoadingUsers={isLoadingUsers} truckId={truckId} handleAssignExisting={handleAssignExisting} loading={loading} />
                        )}

                        {activeTab === 'new' && (
                            <StaffNewForm formData={formData} fieldErrors={fieldErrors} isDriver={isDriver} loading={loading} handleNameChange={handleNameChange} handleUsernameChange={handleUsernameChange} handleNumberChange={handleNumberChange} setFormData={setFormData} handleSubmit={handleSubmit} />
                        )}
                    </div>
                </div>
            </div>

            <AlertModal isOpen={alertData.isOpen} onClose={() => setAlertData({ ...alertData, isOpen: false })} title={alertData.title} message={alertData.message} type={alertData.type} />
        </>
    );
}