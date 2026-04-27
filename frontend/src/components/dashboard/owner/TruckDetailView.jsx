import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import {
    ArrowLeft, UserCircle2, HardHat, ShieldCheck, Loader2, Gauge,
    Fuel, Activity, Settings2, Route, Receipt, Wallet, LayoutDashboard, RefreshCcw
} from 'lucide-react';

import CreateStaffModal from '../../modals/CreateStaffModal';
import EditStaffModal from '../../modals/EditStaffModal';
import PayCrewModal from '../../modals/PayCrewModal';
import AlertModal from '../../modals/AlertModal';
import TripLiquidationModal from '../../modals/TripLiquidationModal';
import AddFundModal from '../../modals/AddFundModal';
import ImagePreviewModal from '../../modals/ImagePreviewModal';
import StaffLedgerModal from '../../modals/StaffLedgerModal'; // <-- NUEVO COMPONENTE

import HistoryTab from '../crew/tabs/HistoryTab';
import ExpensesTab from '../crew/tabs/ExpensesTab';

export default function TruckDetailView({ truckId, onBack }) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');

    const [staffModal, setStaffModal] = useState({ isOpen: false, type: 'driver' });
    const [editModal, setEditModal] = useState({ isOpen: false, staffData: null });
    const [payModal, setPayModal] = useState({ isOpen: false, staffData: null });
    const [ledgerModal, setLedgerModal] = useState({ isOpen: false, staffData: null }); // <-- NUEVO ESTADO

    const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'success' });
    const [liquidationModal, setLiquidationModal] = useState({ isOpen: false, travelId: null });
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState({ isOpen: false, url: '', title: '' });

    const showAlert = (title, message, type = 'success') => setAlertData({ isOpen: true, title, message, type });

    const formatDateTime = (dateString) => {
        if (!dateString) return '---';
        const d = new Date(dateString.replace(' ', 'T'));
        return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const getFullImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        return `${apiUrl.replace(/\/api.*$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const handleOpenPreview = (path, title) => {
        if (!path) return;
        setPreviewData({ isOpen: true, url: getFullImageUrl(path), title });
    };

    const { data: truck, isLoading, refetch } = useQuery({ queryKey: ['truckDetail', truckId], queryFn: async () => (await api.get(`/trucks/${truckId}`)).data });
    const { data: activeTrip } = useQuery({ queryKey: ['activeTrip', truckId], queryFn: async () => (await api.get(`/travels/active/${truckId}`)).data, enabled: !!truckId });
    const { data: stats } = useQuery({ queryKey: ['truckStats', truckId], queryFn: async () => (await api.get(`/trucks/${truckId}/stats`)).data, enabled: !!truckId });

    if (isLoading || !truck) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-atlas-yellow w-8 h-8" /></div>;

    const isEnRuta = !!truck.current_travel_id || truck.status === 'activo' || truck.status === 'ACTIVE' || !!activeTrip;
    const totalKm = stats?.total_km || 0;
    const totalTrips = stats?.total_trips || 0;
    const totalFuelExpenses = stats?.total_fuel_expenses || 0;

    return (
        <div className="animate-in fade-in duration-300 max-w-6xl mx-auto pb-12 bg-slate-50 min-h-screen">
            {/* Header Fijo (Sticky) */}
            <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md px-3 pt-3 pb-2 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-atlas-navy transition-colors shadow-sm active:scale-95">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-atlas-navy tracking-tight leading-none">{truck.plate}</h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isEnRuta ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{isEnRuta ? 'En Ruta' : 'Base'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsFundModalOpen(true)} className="p-2 md:px-3 md:py-2 bg-atlas-yellow text-atlas-navy rounded-lg font-black uppercase shadow-sm active:scale-95 flex items-center gap-1.5 hover:bg-[#eab308]">
                        <Wallet className="w-4 h-4 md:w-4 md:h-4" /> <span className="hidden md:inline text-[10px] tracking-wider">Caja Chica</span>
                    </button>
                </div>

                <div className="flex gap-1 overflow-x-auto hide-scrollbar bg-slate-200/50 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('overview')} className={`flex-1 min-w-20 md:min-w-25 py-1.5 px-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                        <LayoutDashboard className="w-3 h-3 inline mr-1" /> Resumen
                    </button>
                    <button onClick={() => setActiveTab('routes')} className={`flex-1 min-w-20 md:min-w-25 py-1.5 px-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'routes' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                        <Route className="w-3 h-3 inline mr-1" /> Viajes
                    </button>
                    <button onClick={() => setActiveTab('expenses')} className={`flex-1 min-w-20 md:min-w-25 py-1.5 px-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'expenses' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                        <Receipt className="w-3 h-3 inline mr-1" /> Gastos
                    </button>
                </div>
            </div>

            <div className="p-3 mt-2">
                {activeTab === 'overview' && (
                    <div className="space-y-3 animate-in fade-in">
                        {/* MÉTRICAS CAJA Y OPERACIÓN... (Igual que antes) */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-3 bg-atlas-navy border border-slate-800 p-3.5 rounded-xl shadow-md flex justify-between items-center">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Caja Chica Disponible</p>
                                    <p className="text-3xl font-black text-atlas-yellow">
                                        ${truck.current_balance?.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                    </p>
                                </div>
                                <Wallet className="w-8 h-8 text-slate-700 opacity-50" />
                            </div>

                            {[
                                { label: 'Km Total', val: `${totalKm}`, icon: Gauge },
                                {
                                    label: 'Combustible',
                                    val: `$${totalFuelExpenses.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                    icon: Fuel
                                },
                                { label: 'Viajes', val: `${totalTrips}`, icon: Activity }
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                                    <item.icon className="w-3.5 h-3.5 text-slate-400 mb-1" />
                                    <h3 className="text-sm font-black text-atlas-navy">{item.val}</h3>
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{item.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* TRIPULACIÓN */}
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-atlas-navy" /> Tripulación de Unidad
                            </h3>

                            <div className="space-y-2 max-h-45 overflow-y-auto pr-1 hide-scrollbar">
                                {[
                                    { role: 'Operador', data: truck.driver, type: 'driver', icon: UserCircle2 },
                                    { role: 'Oficial', data: truck.official, type: 'official', icon: HardHat },
                                    { role: 'Oficial Extra', data: truck.extra_official, type: 'extra_official', icon: HardHat }
                                ].map((staff, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                <staff.icon className="w-4 h-4 text-atlas-navy" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">{staff.role}</p>
                                                {staff.data ? (
                                                    <p className="text-xs font-black text-atlas-navy truncate max-w-37.5">{staff.data.full_name}</p>
                                                ) : (
                                                    <p className="text-xs font-bold text-rose-500">Sin Asignar</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-1.5 self-end sm:self-auto">
                                            {staff.data ? (
                                                <>
                                                    {/* BOTÓN DE HISTORIAL (NUEVO) */}
                                                    <button onClick={() => setLedgerModal({ isOpen: true, staffData: staff.data })} className="bg-white border border-slate-200 text-emerald-600 px-2.5 py-1.5 rounded-md hover:bg-emerald-50 transition-colors shadow-sm" title="Ver Historial de Pagos">
                                                        <Receipt className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setPayModal({ isOpen: true, staffData: staff.data })} className="bg-atlas-navy text-white px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm">
                                                        Pago
                                                    </button>
                                                    <button onClick={() => setEditModal({ isOpen: true, staffData: staff.data })} className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors shadow-sm">
                                                        <Settings2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setStaffModal({ isOpen: true, type: staff.type })} className="bg-white border border-slate-200 text-blue-500 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors shadow-sm">
                                                        <RefreshCcw className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => setStaffModal({ isOpen: true, type: staff.type })} className="w-full bg-slate-200 text-slate-600 border border-slate-300 border-dashed px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                    + Asignar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FICHA TÉCNICA... (Igual) */}
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Settings2 className="w-4 h-4 text-atlas-navy" /> Ficha Técnica
                            </h3>
                            <div className="grid grid-cols-3 gap-y-3 gap-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Marca</span><span className="text-xs font-black text-atlas-navy">{truck.brand || '--'}</span></div>
                                <div><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Modelo</span><span className="text-xs font-black text-atlas-navy">{truck.model || '--'}</span></div>
                                <div><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Capacidad</span><span className="text-xs font-black text-atlas-navy">{truck.capacity_tons} TON</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'routes' && (
                    <div className="bg-white rounded-2xl p-2 md:p-3 border border-slate-200 shadow-sm h-[60vh] overflow-y-auto hide-scrollbar animate-in fade-in">
                        <HistoryTab truckId={truckId} formatDateTime={formatDateTime} handleOpenPreview={handleOpenPreview} onOpenLiquidation={(id) => setLiquidationModal({ isOpen: true, travelId: id })} />
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="bg-white rounded-2xl p-2 md:p-3 border border-slate-200 shadow-sm h-[60vh] overflow-y-auto hide-scrollbar animate-in fade-in">
                        <ExpensesTab truck={truck} formatDateTime={formatDateTime} handleOpenPreview={handleOpenPreview} />
                    </div>
                )}
            </div>

            <CreateStaffModal isOpen={staffModal.isOpen} staffType={staffModal.type} truckId={truckId} onClose={() => setStaffModal({ ...staffModal, isOpen: false })} onSuccess={() => { refetch(); setStaffModal({ ...staffModal, isOpen: false }); showAlert('Personal Asignado', 'Empleado registrado correctamente.'); }} />
            <EditStaffModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, staffData: null })} staff={editModal.staffData} onSuccess={() => { refetch(); setEditModal({ isOpen: false, staffData: null }); showAlert('Sincronizado', 'Perfil actualizado.'); }} />
            <PayCrewModal isOpen={payModal.isOpen} onClose={() => setPayModal({ isOpen: false, staffData: null })} staffData={payModal.staffData} travelId={null} onSuccess={() => { refetch(); setPayModal({ isOpen: false, staffData: null }); showAlert('Pago Registrado', 'La transacción se ha guardado en el historial.'); }} onError={(msg) => showAlert('Error', msg, 'error')} />

            {/* NUEVO MODAL DE ESTADO DE CUENTA */}
            <StaffLedgerModal
                isOpen={ledgerModal.isOpen}
                onClose={() => setLedgerModal({ isOpen: false, staffData: null })}
                staffData={ledgerModal.staffData}
                onOpenPreview={handleOpenPreview}
            />
            <TripLiquidationModal isOpen={liquidationModal.isOpen} travelId={liquidationModal.travelId} onClose={() => setLiquidationModal({ isOpen: false, travelId: null })} />
            <AlertModal isOpen={alertData.isOpen} onClose={() => setAlertData({ ...alertData, isOpen: false })} title={alertData.title} message={alertData.message} type={alertData.type} />
            <AddFundModal isOpen={isFundModalOpen} onClose={() => setIsFundModalOpen(false)} truckId={truckId} onSuccess={() => { setIsFundModalOpen(false); queryClient.invalidateQueries({ queryKey: ['truckDetail', truckId] }); queryClient.invalidateQueries({ queryKey: ['truckFundsHistory', truckId] }); showAlert('Fondo Actualizado', 'Caja chica recargada.'); }} />
            <ImagePreviewModal isOpen={previewData.isOpen} imageUrl={previewData.url} title={previewData.title} onClose={() => setPreviewData({ isOpen: false, url: '', title: '' })} />
        </div>
    );
}