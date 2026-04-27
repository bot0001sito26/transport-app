import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { Route, Filter, CheckCircle, Download, Loader2, X, Search, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateTripSummaryPDF } from '../../../../utils/pdfGenerator';

function TripHistoryCard({ trip, formatDateTime, handleOpenPreview, onOpenLiquidation }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const kms = (trip.end_odometer && trip.start_odometer) ? (trip.end_odometer - trip.start_odometer).toFixed(1) : '0.0';

    const { data: expenses } = useQuery({
        queryKey: ['tripExpensesHistory', trip.id],
        queryFn: async () => (await api.get(`/finances/expenses/travel/${trip.id}`)).data,
        enabled: !!trip.id,
        staleTime: Infinity
    });

    const totalGastos = expenses ? expenses.reduce((acc, e) => acc + e.amount, 0).toFixed(2) : '0.00';

    const destinationName = trip.destinations?.length > 0
        ? trip.destinations.map(d => d.client_name).join(' / ')
        : (trip.destination_client || 'DESTINO NO REGISTRADO');

    const gallery = useMemo(() => {
        const items = [];
        if (trip.start_odometer_photo_url) items.push({ url: trip.start_odometer_photo_url, label: 'KM INI' });
        if (trip.end_odometer_photo_url) items.push({ url: trip.end_odometer_photo_url, label: 'KM FIN' });

        trip.destinations?.forEach(dest => {
            dest.guides?.forEach(g => items.push({ url: g.photo_url, label: g.guide_type === 'carga' ? 'GUÍA' : 'SELLO' }));
            if (dest.packing_list_url) items.push({ url: dest.packing_list_url, label: 'LISTA EMB.' });
            if (dest.stowage_photo_url) items.push({ url: dest.stowage_photo_url, label: 'ESTIBAS' });
        });

        expenses?.forEach(exp => {
            if (exp.photo_url) items.push({ url: exp.photo_url, label: 'GASTO' });
        });
        return items;
    }, [trip, expenses]);

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            const safeFormatDate = (d) => d ? formatDateTime(d) : 'N/D';
            await generateTripSummaryPDF(trip, expenses || [], kms, totalGastos, safeFormatDate);
        } catch (error) { console.error(error); }
        finally { setIsDownloading(false); }
    };

    return (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-3 shrink-0 animate-in slide-in-from-right-2">
            <div className="flex justify-between items-start mb-3 gap-3">
                <div className="flex-1 min-w-0">
                    <h5 className="text-sm md:text-base font-black text-atlas-navy leading-tight uppercase tracking-tight line-clamp-2 pr-2">{destinationName}</h5>
                    <div className="flex items-center gap-1.5 mt-1">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{trip.status}</span>
                    </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shrink-0">VIAJE #{trip.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-3 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">SALIDA / LLEGADA</p>
                    <p className="text-xs font-bold text-slate-700">{formatDateTime(trip.start_time || trip.loaded_at)}</p>
                    <p className="text-xs font-bold text-slate-700">{formatDateTime(trip.end_time)}</p>
                </div>
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">RECORRIDO / GASTO</p>
                    <p className="text-xs font-bold text-slate-700">{kms} KM</p>
                    <p className="text-xs font-black text-rose-600">${totalGastos}</p>
                </div>
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center justify-between mt-3 pt-3 border-t border-slate-100 gap-3">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto">
                    {gallery.map((img, idx) => (
                        <div key={idx} onClick={() => handleOpenPreview && handleOpenPreview(img.url, img.label)} className="relative shrink-0 w-10 h-10 rounded-md overflow-hidden border border-slate-200 cursor-pointer group">
                            <img src={img.url.startsWith('http') ? img.url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`.replace(/\/api.*$/, '') + img.url} alt={img.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] text-white font-bold text-center leading-tight px-1">{img.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="text-[10px] md:text-xs font-black text-white bg-atlas-navy border border-transparent hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 w-full md:w-auto">
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
                    </button>
                    {onOpenLiquidation && (
                        <button onClick={() => onOpenLiquidation(trip.id)} className="bg-atlas-yellow text-atlas-navy px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-[#eab308] transition-colors flex items-center justify-center gap-1.5 w-full md:w-auto">
                            <ShieldCheck className="w-4 h-4" /> AUDITAR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HistoryTab({ truckId, formatDateTime, handleOpenPreview, onOpenLiquidation }) {
    // Filtros vacíos por defecto
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTripId, setSearchTripId] = useState('');

    // Paginación (5 items para no asfixiar la vista móvil)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Reiniciar página si cambian los filtros
    useEffect(() => { setCurrentPage(1); }, [startDate, endDate, searchTripId]);

    const { data: tripHistory, isLoading } = useQuery({
        queryKey: ['tripHistory', truckId],
        queryFn: async () => {
            try { return (await api.get(`/travels/history/${truckId}?limit=1000&skip=0`)).data; } catch { return []; }
        },
        enabled: !!truckId
    });

    const getEcuadorDateString = (dateString) => {
        if (!dateString) return '';
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(dateString.replace(' ', 'T')));
    };

    const filteredHistory = useMemo(() => {
        if (!tripHistory) return [];
        let result = tripHistory;
        if (searchTripId) result = tripHistory.filter(trip => trip.id.toString() === searchTripId);
        else if (startDate && endDate) result = tripHistory.filter(t => getEcuadorDateString(t.end_time || t.created_at) >= startDate && getEcuadorDateString(t.end_time || t.created_at) <= endDate);
        else if (startDate) result = tripHistory.filter(t => getEcuadorDateString(t.end_time || t.created_at) === startDate);
        else if (endDate) result = tripHistory.filter(t => getEcuadorDateString(t.end_time || t.created_at) <= endDate);

        return [...result].sort((a, b) => b.id - a.id);
    }, [tripHistory, startDate, endDate, searchTripId]);

    // Calcular datos de paginación
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
    const paginatedHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredHistory, currentPage]);

    const clearFilters = () => { setStartDate(''); setEndDate(''); setSearchTripId(''); };
    const hasActiveFilters = startDate || endDate || searchTripId;

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-atlas-yellow" /></div>;
    }

    if (!tripHistory || tripHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-80 animate-in fade-in">
                <Route className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">SIN VIAJES REGISTRADOS</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-[75vh] md:h-[65vh] flex flex-col animate-in fade-in duration-300">
            <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-slate-100 shrink-0">
                <div className="flex justify-between items-center">
                    <h4 className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Route className="w-4 h-4" /> HISTORIAL OPERATIVO</h4>
                    {hasActiveFilters && <button onClick={clearFilters} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><X className="w-4 h-4" /></button>}
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

            <div className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {paginatedHistory.length > 0 ? paginatedHistory.map((trip) => (
                    <TripHistoryCard key={trip.id} trip={trip} formatDateTime={formatDateTime} handleOpenPreview={handleOpenPreview} onOpenLiquidation={onOpenLiquidation} />
                )) : (
                    <div className="text-center py-12">
                        <Filter className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">NO HAY RESULTADOS</p>
                    </div>
                )}
            </div>

            {/* Controles de Paginación Fijos al fondo */}
            {totalPages > 1 && (
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-atlas-navy" />
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline">Página</span>
                        <div className="bg-slate-50 px-3 py-1 rounded-md border border-slate-200">
                            <span className="text-xs font-black text-atlas-navy">{currentPage}</span>
                            <span className="text-[10px] font-bold text-slate-400 mx-1">/</span>
                            <span className="text-[10px] font-bold text-slate-400">{totalPages}</span>
                        </div>
                    </div>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-atlas-navy" />
                    </button>
                </div>
            )}
        </div>
    );
}