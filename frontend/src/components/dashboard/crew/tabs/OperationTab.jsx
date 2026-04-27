import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { Box, Play, CheckCircle, MapPin, PackageCheck, Send, ReceiptText, User, Clock, Eye, Plus, Wallet } from 'lucide-react';

import CreateTravelModal from '../../../modals/CreateTravelModal';
import StartTripModal from '../../../modals/StartTripModal';
import DeliverTripModal from '../../../modals/DeliverTripModal';
import ReportExpenseModal from '../../../modals/ReportExpenseModal';
import FinishTripModal from '../../../modals/FinishTripModal';

export default function OperationTab({ user, truck, activeTrip, refetchActiveTrip, formatDateTime, handleOpenPreview, showAlert }) {
    const queryClient = useQueryClient();
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [isStartModalOpen, setIsStartModalOpen] = useState(false);
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

    const { data: tripExpenses, refetch: refetchExpenses } = useQuery({
        queryKey: ['tripExpenses', activeTrip?.id],
        queryFn: async () => (await api.get(`/finances/expenses/travel/${activeTrip.id}`)).data,
        enabled: !!activeTrip?.id
    });

    const getSpenderName = (expenseUserId, nestedUser) => {
        if (nestedUser?.full_name) return nestedUser.full_name;
        if (truck?.driver?.id === expenseUserId) return truck.driver.full_name || 'Chofer';
        if (truck?.official?.id === expenseUserId) return truck.official.full_name || 'Oficial';
        if (user?.id === expenseUserId) return user.full_name || 'Tú';
        return 'Tripulante';
    };

    const handleSuccessAction = (title, message) => {
        refetchActiveTrip();
        queryClient.invalidateQueries({ queryKey: ['tripHistory', user.assigned_truck_id] });
        queryClient.invalidateQueries({ queryKey: ['assignedTruck', truck?.id] });
        queryClient.invalidateQueries({ queryKey: ['ownerTrucks'] });
        showAlert(title, message, "success");
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {!activeTrip ? (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center md:text-left">
                    <Box className="w-8 h-8 text-slate-300 mx-auto md:mx-0 mb-3" />
                    <h3 className="text-base font-black text-atlas-navy tracking-tight uppercase">Base / Sin Carga</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Registre la guía para iniciar el ciclo logístico.</p>
                    <button
                        onClick={() => setIsLoadModalOpen(true)}
                        className="w-full mt-4 bg-atlas-yellow text-atlas-navy py-3.5 rounded-lg font-black uppercase shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-widest hover:bg-[#eab308]"
                    >
                        <Plus className="w-4 h-4" /> REGISTRAR CARGA INICIAL
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-base md:text-lg font-black text-atlas-navy leading-tight tracking-tight uppercase truncate max-w-55 sm:max-w-md">{activeTrip.destination_client}</h3>
                                <div className="flex items-center gap-1.5 text-slate-500 mt-1.5">
                                    <MapPin className="w-4 h-4 text-atlas-yellow" />
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">DESTINO ASIGNADO</span>
                                </div>
                            </div>
                            <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">Viaje #{activeTrip.id}</span>
                        </div>

                        {activeTrip.status === 'cargado' && (
                            <button onClick={() => setIsStartModalOpen(true)} className="w-full bg-atlas-navy text-white py-3.5 rounded-xl font-black uppercase shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-widest">
                                <Play className="w-4 h-4" fill="currentColor" /> INICIAR RUTA (GPS)
                            </button>
                        )}
                        {activeTrip.status === 'en_curso' && (
                            <button onClick={() => setIsDeliverModalOpen(true)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black uppercase shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-widest">
                                <PackageCheck className="w-5 h-5" /> REPORTAR DESCARGA
                            </button>
                        )}
                        {activeTrip.status === 'retornando' && (
                            <button onClick={() => setIsFinishModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black uppercase shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-widest">
                                <CheckCircle className="w-5 h-5" /> LLEGADA A BASE (FIN)
                            </button>
                        )}
                    </div>

                    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="mb-4 bg-atlas-navy border border-slate-800 p-4 rounded-xl flex justify-between items-center shadow-inner">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">EFECTIVO DISPONIBLE</h4>
                                <p className="text-2xl font-black text-atlas-yellow">${truck?.current_balance?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="bg-slate-800/80 p-3 rounded-lg">
                                <Wallet className="w-6 h-6 text-atlas-yellow" />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">GASTOS DEL VIAJE</h4>
                            <button onClick={() => setIsExpenseModalOpen(true)} className="text-[10px] md:text-xs font-black text-atlas-navy uppercase bg-slate-100 px-3 py-2 rounded-lg active:scale-95 transition-transform border border-slate-200 tracking-widest flex items-center gap-1.5 hover:bg-slate-200">
                                <Plus className="w-3 h-3" /> GASTO
                            </button>
                        </div>

                        <div className="space-y-3">
                            {tripExpenses?.length > 0 ? tripExpenses.map((exp) => (
                                <div key={exp.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-black text-atlas-navy uppercase rounded shadow-sm">{exp.category}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{formatDateTime(exp.created_at)}</span>
                                            </div>
                                            {exp.description && <p className="text-[11px] md:text-xs text-slate-600 font-bold truncate uppercase mt-1.5">{exp.description}</p>}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className="text-sm md:text-base font-black text-slate-800">${exp.amount.toFixed(2)}</span>
                                            {exp.photo_url && (
                                                <button onClick={() => handleOpenPreview(exp.photo_url, `Gasto: ${exp.category}`)} className="text-slate-500 bg-white p-1.5 rounded-md border border-slate-200 hover:text-atlas-navy transition-colors shadow-sm">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 border-t border-slate-200/80 pt-2 mt-1 font-black uppercase tracking-widest">
                                        <User className="w-3 h-3" /> POR: {getSpenderName(exp.user_id, exp.user)}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                                    <ReceiptText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                    <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest">SIN GASTOS REGISTRADOS</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {truck?.tracking_type?.toLowerCase() === 'telegram' && (
                        <a href="https://t.me/TransportEcuadorBot" target="_blank" rel="noopener noreferrer" className="w-full bg-[#2AABEE] text-white py-3.5 rounded-xl font-black uppercase shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-widest">
                            <Send className="w-4 h-4" /> RASTREO (TELEGRAM)
                        </a>
                    )}
                </>
            )}

            <CreateTravelModal isOpen={isLoadModalOpen} onClose={() => setIsLoadModalOpen(false)} truck={truck} user={user} onSuccess={() => { setIsLoadModalOpen(false); handleSuccessAction("Carga Registrada", "Listo para despacho.") }} onError={(m) => showAlert("Atención", m, "error")} />
            <StartTripModal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} travelId={activeTrip?.id} truckId={truck?.id} onSuccess={() => { setIsStartModalOpen(false); handleSuccessAction("Ruta Iniciada", "Protocolo GPS activado.") }} onError={(m) => showAlert("Error", m, "error")} />

            <DeliverTripModal
                isOpen={isDeliverModalOpen}
                onClose={() => setIsDeliverModalOpen(false)}
                travelId={activeTrip?.id}
                truckId={truck?.id}
                activeTrip={activeTrip}
                onSuccess={(title, message, isFinished) => {
                    refetchActiveTrip();
                    showAlert(title, message, "success");
                    if (isFinished) {
                        setIsDeliverModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['tripHistory', user.assigned_truck_id] });
                    }
                }}
                onError={(m) => showAlert("Error", m, "error")}
            />

            <ReportExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                travelId={activeTrip?.id}
                truckId={truck?.id}
                user={user}
                onSuccess={() => {
                    setIsExpenseModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['tripExpenses', activeTrip?.id] });
                    queryClient.invalidateQueries({ queryKey: ['assignedTruck'] });
                    queryClient.invalidateQueries({ queryKey: ['truckExpenses'] });
                    showAlert("Gasto Registrado", "El fondo ha sido actualizado.", "success");
                }}
                onError={(m) => showAlert("Error", m, "error")}
            />

            <FinishTripModal
                isOpen={isFinishModalOpen}
                onClose={() => setIsFinishModalOpen(false)}
                travelId={activeTrip?.id}
                truckId={truck?.id}
                truck={truck}
                destinations={activeTrip?.destinations || []} // <-- AQUÍ ESTÁ LA LÍNEA MÁGICA
                onSuccess={() => { setIsFinishModalOpen(false); handleSuccessAction("Ciclo Completado", "Unidad arribada en base.") }}
                onError={(m) => showAlert("Error", m, "error")}
            />
        </div>
    );
}