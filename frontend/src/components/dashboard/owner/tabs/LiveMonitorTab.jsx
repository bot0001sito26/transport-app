import { useQuery } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { Loader2, Activity, MapPin, Clock } from 'lucide-react';

function ActiveTruckMonitorCard({ truck }) {
    const { data: activeTrip } = useQuery({
        queryKey: ['activeTrip', truck.id],
        queryFn: async () => { try { return (await api.get(`/travels/active/${truck.id}`)).data; } catch { return null; } },
        enabled: !!truck.id,
        refetchInterval: 60000
    });

    const { data: expenses } = useQuery({
        queryKey: ['activeTripExpenses', activeTrip?.id],
        queryFn: async () => (await api.get(`/finances/expenses/travel/${activeTrip.id}`)).data,
        enabled: !!activeTrip?.id,
        refetchInterval: 180000
    });

    if (!activeTrip) return null;

    const totalGastos = expenses ? expenses.reduce((acc, e) => acc + e.amount, 0).toFixed(2) : '0.00';
    const destinationName = activeTrip.destinations?.length > 0
        ? activeTrip.destinations.map(d => d.client_name).join(' / ')
        : (activeTrip.destination_client || 'DESTINO EN PROCESO');

    let statusColor = "text-amber-500 bg-amber-50 border-amber-200";
    let pulseColor = "bg-amber-500";
    if (activeTrip.status === 'en_curso') {
        statusColor = "text-blue-500 bg-blue-50 border-blue-200";
        pulseColor = "bg-blue-500";
    } else if (activeTrip.status === 'retornando') {
        statusColor = "text-purple-500 bg-purple-50 border-purple-200";
        pulseColor = "bg-purple-500";
    }

    const formatTime = (d) => {
        if (!d) return '--';
        return new Date(d.replace(' ', 'T')).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
            <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-atlas-navy tracking-wider">{truck.plate}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">• {truck.driver?.full_name || 'Sin Chofer'}</span>
                </div>
                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${statusColor}`}>
                    <span className="relative flex h-1.5 w-1.5"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span><span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseColor}`}></span></span>
                    {activeTrip.status.replace('_', ' ')}
                </span>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Destino</p>
                        <h5 className="text-sm md:text-base font-black text-slate-800 leading-tight uppercase line-clamp-2">{destinationName}</h5>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gastos Ruta</p>
                        <p className="text-lg font-black text-rose-600">${totalGastos}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Salida</p>
                        <p className={`text-xs font-bold mt-0.5 ${activeTrip.status === 'cargado' ? 'text-amber-500' : 'text-slate-700'}`}>
                            {activeTrip.status === 'cargado' ? 'Pendiente' : (activeTrip.start_time ? formatTime(activeTrip.start_time) : '--:--')}
                        </p>
                    </div>
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Carga</p>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{activeTrip.weight_kg} KG</p>
                    </div>
                    <div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Fondo Caja</p>
                        <p className="text-xs font-black text-emerald-600 mt-0.5">
                            ${truck.current_balance?.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </p>                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LiveMonitorTab({ user }) {
    const { data: trucks = [], isLoading } = useQuery({
        queryKey: ['ownerTrucks', user?.id],
        queryFn: async () => (await api.get('/trucks/')).data,
    });

    const activeTrucks = trucks.filter(t => !!t.current_travel_id || t.status === 'activo');

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-atlas-yellow w-8 h-8" /></div>;

    if (activeTrucks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
                <Activity className="w-12 h-12 text-slate-200 mb-4" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Torre de Control Despejada</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">No hay unidades en ruta en este momento.</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-4 flex items-center justify-between px-1">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> Monitoreando {activeTrucks.length} Unidades
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeTrucks.map(truck => (
                    <ActiveTruckMonitorCard key={truck.id} truck={truck} />
                ))}
            </div>
        </div>
    );
}