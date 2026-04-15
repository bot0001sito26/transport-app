import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { Box, Route, WalletCards, Truck, AlertTriangle, Loader2, Receipt } from 'lucide-react';

import AlertModal from '../../modals/AlertModal';
import ImagePreviewModal from '../../modals/ImagePreviewModal';
import ReportExpenseModal from '../../modals/ReportExpenseModal';

import OperationTab from './tabs/OperationTab';
import HistoryTab from './tabs/HistoryTab';
import PaymentsTab from './tabs/PaymentsTab';
import ExpensesTab from './tabs/ExpensesTab';

export default function CrewView({ user }) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('operation');
    const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'success' });
    const [previewData, setPreviewData] = useState({ isOpen: false, url: '', title: '' });
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);

    const { data: truck, isLoading: isLoadingTruck } = useQuery({
        queryKey: ['assignedTruck', user.assigned_truck_id],
        queryFn: async () => (await api.get(`/trucks/${user.assigned_truck_id}`)).data,
        enabled: !!user.assigned_truck_id
    });

    const { data: activeTrip, isLoading: isLoadingTrip, refetch: refetchActiveTrip } = useQuery({
        queryKey: ['activeTrip', user.assigned_truck_id],
        queryFn: async () => (await api.get(`/travels/active/${user.assigned_truck_id}`)).data,
        enabled: !!user.assigned_truck_id
    });

    const showAlert = (title, message, type = 'success') => setAlertData({ isOpen: true, title, message, type });

    const formatDateTime = (dateString) => {
        if (!dateString) return '---';
        const safeDateString = dateString.replace(' ', 'T');
        const d = new Date(safeDateString);
        return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) + ', ' +
            d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
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

    if (!user.assigned_truck_id) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center antialiased">
                <div className="bg-atlas-yellow/20 p-6 rounded-full mb-4"><AlertTriangle className="w-12 h-12 text-atlas-yellow" /></div>
                <h3 className="text-xl font-black tracking-tight text-atlas-navy uppercase">Sin Unidad Asignada</h3>
                <p className="text-slate-500 text-xs max-w-xs mt-2 leading-relaxed font-bold">Contacte a jefatura para la asignación en sistema.</p>
            </div>
        );
    }

    if (isLoadingTruck || isLoadingTrip) {
        return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-atlas-yellow w-8 h-8" /></div>;
    }

    const statusInfo = !activeTrip ? { color: 'bg-slate-400', text: 'DISPONIBLE EN BASE', bg: 'bg-slate-800 border-slate-700' }
        : activeTrip.status === 'cargado' ? { color: 'bg-atlas-yellow', text: 'CARGADO EN PATIO', bg: 'bg-atlas-yellow/20 border-atlas-yellow/30 text-atlas-yellow' }
            : activeTrip.status === 'en_curso' ? { color: 'bg-emerald-400', text: 'EN TRÁNSITO', bg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' }
                : { color: 'bg-blue-400', text: 'RETORNANDO', bg: 'bg-blue-500/20 border-blue-500/30 text-blue-400' };

    return (
        <div className="p-3 md:p-6 space-y-3 bg-slate-50 min-h-screen pb-24 antialiased max-w-5xl mx-auto">
            {/* Cabecera Ultra Compacta y Premium */}
            <div className="bg-atlas-navy rounded-2xl p-3 md:p-4 shadow-lg flex flex-col border border-slate-800">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                            <Truck className="w-5 h-5 text-atlas-yellow" />
                        </div>
                        <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5">UNIDAD ASIGNADA</p>
                            <h2 className="text-xl font-black tracking-tight leading-none uppercase text-white">{truck?.plate}</h2>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${statusInfo.bg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusInfo.color}`}></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">{statusInfo.text}</span>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800">
                    <button
                        onClick={() => setExpenseModalOpen(true)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-atlas-yellow text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    >
                        <Receipt className="w-3.5 h-3.5" /> Registrar Gasto Libre (Patio)
                    </button>
                </div>
            </div>

            {/* Tabs compactadas con texto ligeramente más pequeño */}
            <div className="flex p-1 bg-slate-200/60 rounded-xl overflow-x-auto hide-scrollbar">
                <button onClick={() => setActiveTab('operation')} className={`flex-1 min-w-[70px] py-2 text-[10px] font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'operation' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <Box className="w-3.5 h-3.5" /> OPERACIÓN
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 min-w-[70px] py-2 text-[10px] font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'history' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <Route className="w-3.5 h-3.5" /> VIAJES
                </button>
                <button onClick={() => setActiveTab('expenses')} className={`flex-1 min-w-[70px] py-2 text-[10px] font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'expenses' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <Receipt className="w-3.5 h-3.5" /> GASTOS
                </button>
                <button onClick={() => setActiveTab('payments')} className={`flex-1 min-w-[70px] py-2 text-[10px] font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'payments' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <WalletCards className="w-3.5 h-3.5" /> PAGOS
                </button>
            </div>

            {activeTab === 'operation' && <OperationTab user={user} truck={truck} activeTrip={activeTrip} refetchActiveTrip={refetchActiveTrip} formatDateTime={formatDateTime} handleOpenPreview={handleOpenPreview} showAlert={showAlert} />}
            {activeTab === 'history' && <HistoryTab truckId={truck?.id} formatDateTime={formatDateTime} handleOpenPreview={handleOpenPreview} />}
            {activeTab === 'expenses' && <ExpensesTab truck={truck} handleOpenPreview={handleOpenPreview} formatDateTime={formatDateTime} />}
            {activeTab === 'payments' && <PaymentsTab user={user} formatDateTime={formatDateTime} handleOpenPreview={handleOpenPreview} />}

            <AlertModal isOpen={alertData.isOpen} onClose={() => setAlertData({ ...alertData, isOpen: false })} title={alertData.title} message={alertData.message} type={alertData.type} />
            <ImagePreviewModal isOpen={previewData.isOpen} onClose={() => setPreviewData({ isOpen: false, url: '', title: '' })} imageUrl={previewData.url} title={previewData.title} />
            <ReportExpenseModal
                isOpen={expenseModalOpen}
                onClose={() => setExpenseModalOpen(false)}
                truckId={truck?.id}
                travelId={activeTrip?.id || null}
                user={user}
                onSuccess={() => {
                    showAlert('Gasto Registrado', 'Actualizado correctamente.');
                    setExpenseModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['assignedTruck'] });
                    queryClient.invalidateQueries({ queryKey: ['truckExpenses'] });
                    if (activeTrip) queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
                }}
                onError={(msg) => showAlert('Error', msg, 'error')}
            />
        </div>
    );
}