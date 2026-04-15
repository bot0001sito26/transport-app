import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { Receipt, Loader2, Download, Image as ImageIcon, X, Filter, Wallet, ArrowDownLeft, ArrowUpRight, Search, User } from 'lucide-react';
import { generateTruckExpensesPDF } from '../../../../utils/pdfGenerator';

export default function ExpensesTab({ truck, handleOpenPreview, formatDateTime }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [searchTripId, setSearchTripId] = useState('');

    const [startDate, setStartDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
    const [endDate, setEndDate] = useState('');

    const { data: expenses, isLoading: loadingExpenses } = useQuery({
        queryKey: ['truckExpenses', truck.id],
        queryFn: async () => { try { return (await api.get(`/finances/expenses/truck/${truck.id}`)).data; } catch { return []; } },
        enabled: !!truck?.id
    });

    const { data: truckFunds, isLoading: loadingFunds } = useQuery({
        queryKey: ['truckFundsHistory', truck.id],
        queryFn: async () => { try { return (await api.get(`/finances/truck-funds/${truck.id}`)).data; } catch { return []; } },
        enabled: !!truck?.id
    });

    const getEcuadorDateString = (dateString) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(dateString.replace(' ', 'T')));

    const ledger = useMemo(() => {
        const expList = (expenses || []).map(e => ({ ...e, type: 'expense', dateObj: e.created_at }));
        const fndList = (truckFunds || []).map(f => ({ ...f, type: 'fund', dateObj: f.created_at, category: 'Abono Caja Chica' }));

        let allTransactions = [...expList, ...fndList].sort((a, b) => new Date(b.dateObj) - new Date(a.dateObj));

        if (searchTripId) return allTransactions.filter(item => item.type === 'expense' && item.travel_id?.toString() === searchTripId);

        if (startDate && endDate) allTransactions = allTransactions.filter(item => getEcuadorDateString(item.dateObj) >= startDate && getEcuadorDateString(item.dateObj) <= endDate);
        else if (startDate) allTransactions = allTransactions.filter(item => getEcuadorDateString(item.dateObj) === startDate);

        return allTransactions;
    }, [expenses, truckFunds, startDate, endDate, searchTripId]);

    const totalGastos = ledger.filter(i => i.type === 'expense').reduce((acc, exp) => acc + exp.amount, 0) || 0;
    const clearFilters = () => { setStartDate(''); setEndDate(''); setSearchTripId(''); };

    const handleDownloadReport = async () => {
        setIsDownloading(true);
        try {
            let dateLabel = '';
            if (startDate && endDate) dateLabel = `${startDate} al ${endDate}`;
            else if (startDate) dateLabel = startDate;
            await generateTruckExpensesPDF(truck, ledger, dateLabel, searchTripId, formatDateTime);
        } catch (error) { console.error(error); }
        finally { setIsDownloading(false); }
    };

    // Función para obtener el nombre exacto del tripulante o administrador
    const getSpenderName = (userId, nestedUser) => {
        if (nestedUser?.full_name) return nestedUser.full_name;
        if (truck?.driver?.id === userId) return truck.driver.full_name || 'CHOFER';
        if (truck?.official?.id === userId) return truck.official.full_name || 'OFICIAL';
        return 'ADMINISTRACIÓN';
    };

    if (loadingExpenses || loadingFunds) return <div className="flex h-[300px] items-center justify-center"><Loader2 className="animate-spin text-atlas-yellow w-10 h-10" /></div>;
    const hasActiveFilters = startDate || endDate || searchTripId;

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-atlas-navy rounded-2xl p-5 shadow-md border border-slate-800 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-atlas-yellow" /> CAJA CHICA</p>
                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">${truck?.current_balance?.toFixed(2) || '0.00'}</h3>
                </div>
                <div className="bg-atlas-yellow/10 border border-atlas-yellow/20 px-3 py-2 rounded-xl text-right">
                    <p className="text-[10px] font-black text-atlas-yellow uppercase tracking-widest mb-0.5">GASTOS FILTRADOS</p>
                    <p className="text-base font-black text-rose-400">${totalGastos.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col">
                <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Receipt className="w-4 h-4" /> ESTADO DE CUENTA</h4>
                        <div className="flex gap-2">
                            {hasActiveFilters && <button onClick={clearFilters} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><X className="w-4 h-4" /></button>}
                            <button onClick={handleDownloadReport} disabled={isDownloading || ledger.length === 0} className="bg-atlas-navy text-white px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-50">
                                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative w-full sm:w-28 shrink-0">
                            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                            <input type="number" placeholder="# Viaje" value={searchTripId} onChange={(e) => setSearchTripId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg py-1.5 pl-8 pr-2 focus:outline-none focus:border-atlas-navy" />
                        </div>
                        <div className="flex flex-1 items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setSearchTripId(''); }} className="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 focus:outline-none w-full" />
                            <span className="text-[10px] font-black text-slate-400">AL</span>
                            <input type="date" value={endDate} min={startDate} onChange={(e) => { setEndDate(e.target.value); setSearchTripId(''); }} className="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 focus:outline-none w-full" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3 flex-1">
                    {ledger?.length > 0 ? ledger.map((item, idx) => (
                        <div key={`${item.type}-${item.id}-${idx}`} className={`p-3 rounded-xl border flex flex-col ${item.type === 'fund' ? 'bg-atlas-yellow/10 border-atlas-yellow/30' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`text-[10px] md:text-xs font-black uppercase flex items-center gap-1 ${item.type === 'fund' ? 'text-atlas-navy' : 'text-slate-800'}`}>
                                            {item.type === 'fund' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
                                            {item.category}
                                        </span>
                                        {item.type === 'expense' && (
                                            item.travel_id ? <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded tracking-widest uppercase">Viaje #{item.travel_id}</span> : <span className="text-[9px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded tracking-widest uppercase">Patio</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 font-bold truncate uppercase">
                                        {item.type === 'fund' ? 'INYECCIÓN DE FONDO' : (item.description || 'SIN DETALLES')}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-1">
                                        {formatDateTime(item.dateObj)}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className={`text-sm md:text-base font-black ${item.type === 'fund' ? 'text-atlas-navy' : 'text-slate-800'}`}>
                                        {item.type === 'fund' ? '+' : ''}{item.amount.toFixed(2)}
                                    </span>
                                    {item.photo_url && (
                                        <button onClick={() => handleOpenPreview(item.photo_url, `${item.type === 'fund' ? 'Abono' : 'Gasto'} - ${item.category}`)} className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md hover:text-atlas-navy transition-colors shadow-sm">
                                            <ImageIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* AQUÍ ESTÁ EL AJUSTE: Función getSpenderName para mostrar el nombre exacto */}
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 border-t border-slate-200/80 pt-2 font-black uppercase tracking-widest mt-2">
                                <User className="w-3 h-3" /> REGISTRADO POR: {getSpenderName(item.user_id, item.user)}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12">
                            <Filter className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                {hasActiveFilters ? 'Sin transacciones para tu búsqueda' : 'No hay historial de movimientos'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}