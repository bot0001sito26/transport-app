import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { Search, Plus, ChevronRight, Activity, Truck, CheckCircle2, Loader2, Wallet } from 'lucide-react';
import CreateTruckModal from '../../../modals/CreateTruckModal';

export default function FleetTab({ user, setSelectedTruckId, showAlert }) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isCreateTruckOpen, setIsCreateTruckOpen] = useState(false);

    const { data: trucks = [], isLoading: isLoadingTrucks } = useQuery({
        queryKey: ['ownerTrucks', user?.id],
        queryFn: async () => (await api.get('/trucks/')).data,
        refetchInterval: 180000,
    });

    const filteredTrucks = useMemo(() => {
        return trucks.filter(truck => {
            const matchesSearch = truck.plate.toLowerCase().includes(searchTerm.toLowerCase());
            const isActivo = truck.status === 'activo' || truck.status === 'ACTIVE' || !!truck.current_travel_id;

            if (statusFilter === 'ACTIVE') return matchesSearch && isActivo;
            if (statusFilter === 'IDLE') return matchesSearch && !isActivo;
            return matchesSearch;
        });
    }, [trucks, searchTerm, statusFilter]);

    if (isLoadingTrucks) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-atlas-yellow w-6 h-6" /></div>;
    }

    return (
        <div className="space-y-3 animate-in fade-in duration-300">
            {/* CORRECCIÓN: Etiqueta de Total de Flota agregada */}
            <div className="flex justify-between items-center px-1 mb-1">
                <span className="inline-flex items-center gap-1.5 bg-atlas-yellow text-atlas-navy px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm">
                    <Truck className="w-3.5 h-3.5" /> Total Flota: {trucks.length} Unidades
                </span>
            </div>

            <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
                <div className="flex gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="search" placeholder="Buscar placa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-atlas-navy text-xs font-bold text-atlas-navy transition-all" />
                    </div>
                    <button
                        onClick={() => setIsCreateTruckOpen(true)}
                        className="shrink-0 flex items-center justify-center gap-1.5 bg-atlas-navy text-white px-3 py-1.5 rounded-lg font-black shadow-sm hover:bg-slate-800 transition-all active:scale-95 text-[10px] uppercase tracking-wider"
                    >
                        <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Añadir</span>
                    </button>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                    <button onClick={() => setStatusFilter('ALL')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${statusFilter === 'ALL' ? 'bg-atlas-yellow text-atlas-navy' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>Todas</button>
                    <button onClick={() => setStatusFilter('ACTIVE')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-1.5 ${statusFilter === 'ACTIVE' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}><Activity className="w-3 h-3" /> Activos</button>
                    <button onClick={() => setStatusFilter('IDLE')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-1.5 ${statusFilter === 'IDLE' ? 'bg-atlas-navy text-white' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}><CheckCircle2 className="w-3 h-3" /> Disponibles</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:hidden">
                {filteredTrucks.map(truck => {
                    const isActivo = truck.status === 'activo' || truck.status === 'ACTIVE' || !!truck.current_travel_id;
                    return (
                        <div key={truck.id} onClick={() => setSelectedTruckId(truck.id)} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${isActivo ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-black text-atlas-navy tracking-wider">{truck.plate}</span>
                                        {isActivo && <span className="w-1.5 h-1.5 rounded-full bg-atlas-yellow animate-pulse"></span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[80px]">{truck.brand}</p>
                                        <span className="text-slate-300">•</span>
                                        <div className="flex items-center text-emerald-600 gap-0.5">
                                            <Wallet className="w-2.5 h-2.5" />
                                            <span className="text-[10px] font-black">${truck.current_balance?.toFixed(0) || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                    );
                })}
            </div>

            <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left">
                    <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="py-3 px-4">Identificador</th>
                            <th className="py-3 px-4">Especificaciones</th>
                            <th className="py-3 px-4">Caja Chica</th>
                            <th className="py-3 px-4">Estado</th>
                            <th className="py-3 px-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredTrucks.map(truck => {
                            const isActivo = truck.status === 'activo' || truck.status === 'ACTIVE' || !!truck.current_travel_id;
                            return (
                                <tr key={truck.id} onClick={() => setSelectedTruckId(truck.id)} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isActivo ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <span className="font-mono font-black text-atlas-navy tracking-wider">{truck.plate}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                        {truck.brand} {truck.model ? `• ${truck.model}` : ''} • {truck.capacity_tons} TON
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                            <Wallet className="w-4 h-4" />
                                            <span className="text-[12px] font-black">${truck.current_balance?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {isActivo ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                                                <CheckCircle2 className="w-3 h-3" /> Disponible
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <ChevronRight className="w-5 h-5 inline text-slate-300 group-hover:text-atlas-navy transition-colors" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <CreateTruckModal
                isOpen={isCreateTruckOpen}
                onClose={() => setIsCreateTruckOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['ownerTrucks'] });
                    setIsCreateTruckOpen(false);
                    showAlert('Exitoso', 'Camión agregado a la flota.', 'success');
                }}
                onError={(msg) => showAlert('Error', msg, 'error')}
            />
        </div>
    );
}