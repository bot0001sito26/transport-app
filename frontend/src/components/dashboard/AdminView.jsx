import { useState, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Loader2, UserPlus, ExternalLink, Settings, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

import CreateOwnerModal from '../modals/CreateOwnerModal';
import ResetPasswordModal from '../modals/ResetPasswordModal';
import ConfirmActionModal from '../modals/ConfirmActionModal';
import AlertModal from '../modals/AlertModal';

export default function AdminView() {
    const queryClient = useQueryClient();
    const { impersonate } = useContext(AuthContext);

    // Estados de Modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [resetModalData, setResetModalData] = useState({ isOpen: false, userId: null });
    const [confirmModalData, setConfirmModalData] = useState({ isOpen: false, user: null });
    const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    // Estados de Búsqueda y Paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Puedes cambiar la cantidad de filas por página aquí

    const showAlert = (title, message, type = 'success') => setAlertData({ isOpen: true, title, message, type });

    // 1. OBTENCIÓN CON CACHÉ
    const { data: owners = [], isLoading } = useQuery({
        queryKey: ['ownersList'],
        queryFn: async () => {
            const response = await api.get('/users/');
            return response.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    // 2. MUTACIÓN OPTIMIZADA
    const toggleStatusMutation = useMutation({
        mutationFn: async (user) => {
            await api.patch(`/users/${user.id}/status?is_active=${!user.is_active}`);
            return user;
        },
        onSuccess: (user) => {
            queryClient.invalidateQueries({ queryKey: ['ownersList'] });
            setConfirmModalData({ isOpen: false, user: null });
            showAlert('Estado Actualizado', `El usuario ha sido ${user.is_active ? 'suspendido' : 'activado'} correctamente.`, 'success');
        },
        onError: () => {
            setConfirmModalData({ isOpen: false, user: null });
            showAlert('Error', 'No se pudo cambiar el estado del usuario.', 'error');
        }
    });

    // 3. LÓGICA DE FILTRADO Y PAGINACIÓN (Estructurado y en memoria)
    const filteredOwners = useMemo(() => {
        if (!searchTerm) return owners;
        const lowerSearch = searchTerm.toLowerCase();
        return owners.filter(owner =>
            owner.full_name.toLowerCase().includes(lowerSearch) ||
            owner.username.toLowerCase().includes(lowerSearch)
        );
    }, [owners, searchTerm]);

    const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentOwners = filteredOwners.slice(startIndex, startIndex + itemsPerPage);

    // Reiniciar a la página 1 cuando se busca algo nuevo
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-atlas-navy w-10 h-10" /></div>;

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-8 relative animate-in fade-in duration-300 max-w-7xl mx-auto">

            {/* ENCABEZADO Y CONTROLES SUPERIORES */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-atlas-navy tracking-tight">Gestión de Franquicias</h2>
                    <p className="text-slate-500 text-sm mt-1">Administración global de dueños del sistema.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Buscador */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar dueño o usuario..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-atlas-navy focus:ring-1 focus:ring-atlas-navy transition-all text-sm font-medium text-atlas-navy"
                        />
                    </div>
                    {/* Botón de Registro */}
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center justify-center gap-2 bg-atlas-yellow text-atlas-navy px-6 py-3 rounded-xl font-bold shadow-lg shadow-atlas-yellow/20 hover:bg-[#e5ba2b] transition-all active:scale-95 text-sm shrink-0"
                    >
                        <UserPlus className="w-5 h-5" />
                        Registrar Nuevo Dueño
                    </button>
                </div>
            </div>

            {/* ESTADO DE CERO RESULTADOS */}
            {filteredOwners.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-atlas-navy">No se encontraron resultados</h3>
                    <p className="text-slate-500 text-sm mt-1">No hay dueños que coincidan con "{searchTerm}".</p>
                </div>
            ) : (
                <>
                    {/* =========================================
                        VISTA MÓVIL: TARJETAS
                    ========================================= */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {currentOwners.map((owner) => (
                            <div key={owner.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <h3 className="font-bold text-atlas-navy text-base leading-tight">{owner.full_name}</h3>
                                        <p className="text-slate-500 text-xs mt-0.5">{owner.username}</p>
                                    </div>
                                    <span className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${owner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {owner.is_active ? 'Activo' : 'Suspendido'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                    <button onClick={() => impersonate(owner)} title="Ver Panel del Dueño" className="flex-1 flex justify-center items-center py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setResetModalData({ isOpen: true, userId: owner.id })} className="flex-1 flex justify-center items-center py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-all">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setConfirmModalData({ isOpen: true, user: owner })} disabled={toggleStatusMutation.isPending} className={`flex-1 flex justify-center items-center py-2 rounded-xl transition-all disabled:opacity-50 ${owner.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                        {owner.is_active ? <Trash2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* =========================================
                        VISTA DESKTOP: TABLA
                    ========================================= */}
                    <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="py-5 px-8 font-bold text-atlas-navy text-xs uppercase tracking-widest">Dueño / Empresa</th>
                                        <th className="py-5 px-8 font-bold text-atlas-navy text-xs uppercase tracking-widest">Usuario</th>
                                        <th className="py-5 px-8 font-bold text-atlas-navy text-xs uppercase tracking-widest text-center">Estado</th>
                                        <th className="py-5 px-8 font-bold text-atlas-navy text-xs uppercase tracking-widest text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {currentOwners.map((owner) => (
                                        <tr key={owner.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-5 px-8 font-bold text-slate-700">{owner.full_name}</td>
                                            <td className="py-5 px-8 text-slate-500 text-sm">{owner.username}</td>
                                            <td className="py-5 px-8 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${owner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {owner.is_active ? 'Activo' : 'Suspendido'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button onClick={() => impersonate(owner)} title="Ver Panel del Dueño" className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all">
                                                        <ExternalLink className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => setResetModalData({ isOpen: true, userId: owner.id })} className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-all">
                                                        <Settings className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => setConfirmModalData({ isOpen: true, user: owner })} className={`p-2 rounded-lg transition-all ${owner.is_active ? 'hover:bg-red-50 text-slate-400 hover:text-red-600' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`} disabled={toggleStatusMutation.isPending}>
                                                        {owner.is_active ? <Trash2 className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* =========================================
                        CONTROLES DE PAGINACIÓN
                    ========================================= */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-sm text-slate-500 font-medium">
                                Mostrando <span className="font-bold text-atlas-navy">{startIndex + 1}</span> a <span className="font-bold text-atlas-navy">{Math.min(startIndex + itemsPerPage, filteredOwners.length)}</span> de <span className="font-bold text-atlas-navy">{filteredOwners.length}</span> resultados
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="text-sm font-bold text-atlas-navy px-2">
                                    {currentPage} / {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Inyección de Modales */}
            <CreateOwnerModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['ownersList'] });
                    setIsCreateOpen(false);
                    showAlert('Registro Exitoso', 'El nuevo dueño ha sido integrado al sistema Atlas.', 'success');
                }}
                onError={(msg) => showAlert('Error de Registro', msg, 'error')}
            />

            <ResetPasswordModal
                isOpen={resetModalData.isOpen}
                userId={resetModalData.userId}
                onClose={() => setResetModalData({ isOpen: false, userId: null })}
                onSuccess={() => {
                    setResetModalData({ isOpen: false, userId: null });
                    showAlert('Seguridad Actualizada', 'La contraseña se ha reseteado con éxito.', 'success');
                }}
                onError={(msg) => showAlert('Error de Seguridad', msg, 'error')}
            />

            <ConfirmActionModal
                isOpen={confirmModalData.isOpen}
                onClose={() => setConfirmModalData({ isOpen: false, user: null })}
                onConfirm={() => toggleStatusMutation.mutate(confirmModalData.user)}
                title={confirmModalData.user?.is_active ? "Suspender Dueño" : "Activar Dueño"}
                message={`¿Estás seguro de que deseas ${confirmModalData.user?.is_active ? 'suspender el acceso al ERP de' : 'reactivar los accesos de'} ${confirmModalData.user?.full_name}?`}
                confirmText={confirmModalData.user?.is_active ? "Suspender Acceso" : "Permitir Acceso"}
                isDanger={confirmModalData.user?.is_active}
            />

            <AlertModal
                isOpen={alertData.isOpen}
                onClose={() => setAlertData({ ...alertData, isOpen: false })}
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
            />
        </div>
    );
}