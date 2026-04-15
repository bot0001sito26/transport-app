import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { Map, FileText, Route, Loader2, Fuel, Wallet, CalendarDays } from 'lucide-react';

export default function DashboardTab({ user, showAlert }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const { data: summary, isLoading: isLoadingSummary } = useQuery({
        queryKey: ['monthlySummary', user?.id, selectedMonth, selectedYear],
        queryFn: async () => (await api.get('/reports/monthly-summary', { params: { month: selectedMonth, year: selectedYear } })).data,
        refetchInterval: 30000,
    });

    const { data: trucks = [], isLoading: isLoadingTrucks } = useQuery({
        queryKey: ['ownerTrucks', user?.id],
        queryFn: async () => (await api.get('/trucks/')).data,
    });

    const totalCajaChica = useMemo(() => trucks.reduce((acc, truck) => acc + (truck.current_balance || 0), 0), [trucks]);

    if (isLoadingSummary || isLoadingTrucks) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-atlas-yellow w-6 h-6" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculando...</p>
            </div>
        );
    }

    const stats = [
        { id: 1, name: 'Caja Chica Flota', value: `$${totalCajaChica.toFixed(2)}`, suffix: 'Actual', icon: Wallet },
        { id: 2, name: 'Recorrido', value: `${summary?.grand_total_km || 0}`, suffix: 'KM', icon: Map },
        { id: 3, name: 'Viajes', value: `${summary?.total_trips || 0}`, suffix: 'Rutas', icon: Route },
        { id: 4, name: 'Combustible', value: `$${summary?.fuel_expenses?.toFixed(2) || '0.00'}`, icon: Fuel },
        { id: 5, name: 'Gasto Operativo', value: `$${summary?.grand_total_expenses?.toFixed(2) || '0.00'}`, icon: FileText },
    ];

    const months = [
        { val: 1, name: 'Ene' }, { val: 2, name: 'Feb' }, { val: 3, name: 'Mar' },
        { val: 4, name: 'Abr' }, { val: 5, name: 'May' }, { val: 6, name: 'Jun' },
        { val: 7, name: 'Jul' }, { val: 8, name: 'Ago' }, { val: 9, name: 'Sep' },
        { val: 10, name: 'Oct' }, { val: 11, name: 'Nov' }, { val: 12, name: 'Dic' }
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm px-3">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-atlas-navy" />
                    <span className="hidden sm:inline text-[10px] font-black text-atlas-navy uppercase tracking-widest">Filtro:</span>
                </div>
                <div className="flex items-center gap-1">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-slate-50 text-xs font-bold text-atlas-navy py-1.5 px-2 rounded-lg outline-none border border-slate-200 focus:border-atlas-yellow cursor-pointer">
                        {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                    </select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-slate-50 text-xs font-bold text-atlas-navy py-1.5 px-2 rounded-lg outline-none border border-slate-200 focus:border-atlas-yellow cursor-pointer">
                        {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3">
                {stats.map((item, idx) => {
                    const isMain = idx === 0;
                    return (
                        <div key={item.id} className={`p-3 md:p-4 rounded-xl border flex flex-col justify-between ${isMain ? 'col-span-2 lg:col-span-1 bg-atlas-navy border-atlas-navy shadow-md' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <p className={`text-[9px] font-bold uppercase tracking-widest leading-tight ${isMain ? 'text-slate-300' : 'text-slate-400'}`}>{item.name}</p>
                                <item.icon className={`w-3.5 h-3.5 ${isMain ? 'text-atlas-yellow' : 'text-slate-400'}`} strokeWidth={2.5} />
                            </div>
                            <div className="flex items-baseline gap-1 mt-auto">
                                <h3 className={`text-xl md:text-2xl tracking-tight truncate ${isMain ? 'text-atlas-yellow font-black' : 'text-atlas-navy font-bold'}`}>
                                    {item.value}
                                </h3>
                                {item.suffix && <span className={`text-[9px] font-bold uppercase ${isMain ? 'text-slate-400' : 'text-slate-400'}`}>{item.suffix}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}