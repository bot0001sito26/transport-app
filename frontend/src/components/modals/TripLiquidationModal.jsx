import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { X, MapPin, Loader2, CheckCircle2, Receipt } from 'lucide-react';

export default function TripLiquidationModal({ isOpen, onClose, travelId }) {

    const { data: liquidation, isLoading } = useQuery({
        queryKey: ['liquidation', travelId],
        queryFn: async () => {
            const response = await api.get(`/finances/liquidation/${travelId}`);
            return response.data;
        },
        enabled: !!travelId && isOpen
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* CABECERA */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-6 bg-atlas-yellow rounded-full"></div>
                            <h3 className="text-xl font-black text-atlas-navy tracking-tighter uppercase italic">Auditoría de Viaje</h3>
                        </div>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest ml-3">Ruta de Control: #{travelId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8">
                    {isLoading || !liquidation ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-slate-300 mb-4" />
                            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Cruzando datos operativos...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* SECCIÓN 1: RENDIMIENTO DE RUTA */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Rendimiento de Ruta
                                </h4>
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-slate-400">Destino</p>
                                        <p className="font-bold text-atlas-navy text-sm mt-1 uppercase tracking-tight">{liquidation.destination}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold text-slate-400">Tipo de Carga</p>
                                        <p className="font-bold text-atlas-navy text-sm mt-1 uppercase tracking-tight">{liquidation.material}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-4 border-t border-slate-200">
                                    <div className="text-center">
                                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Odómetro</p>
                                        <p className="font-mono font-black text-atlas-navy text-lg">{liquidation.odometer_km?.toFixed(1) || '0.0'}<span className="text-[10px] ml-0.5">KM</span></p>
                                    </div>
                                    <div className="text-center border-x border-slate-200 px-2">
                                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Rastreo GPS</p>
                                        <p className="font-mono font-black text-atlas-navy text-lg">{liquidation.gps_km?.toFixed(1) || '0.0'}<span className="text-[10px] ml-0.5">KM</span></p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Desviación</p>
                                        <p className={`font-mono font-black text-lg ${liquidation.km_difference > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {liquidation.km_difference?.toFixed(1) || '0.0'}<span className="text-[10px] ml-0.5">KM</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: GASTOS CARGADOS A LA RUTA */}
                            <div className="p-6 rounded-[2rem] bg-atlas-navy text-white flex items-center justify-between shadow-lg">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                        <Receipt className="w-3 h-3 text-atlas-yellow" /> Gastos Registrados en Ruta
                                    </h4>
                                    <p className="text-[10px] font-medium text-slate-300 max-w-[200px] mt-1 leading-tight">
                                        Total descontado de la Caja Chica durante este viaje.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-black tracking-tighter text-emerald-400">
                                        ${liquidation.total_expenses?.toFixed(2) || '0.00'}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PIE DEL MODAL CON BOTÓN DE CIERRE */}
                <div className="p-8 pt-4 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-atlas-navy text-atlas-yellow py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-atlas-navy/20 flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Finalizar Revisión
                    </button>
                </div>
            </div>
        </div>
    );
}