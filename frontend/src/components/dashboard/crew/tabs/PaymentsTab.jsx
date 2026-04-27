import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { WalletCards, Banknote, Coins, Clock, Eye, Download, X, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function PaymentsTab({ user, formatDateTime, handleOpenPreview }) {
    if (!user) {
        return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-[75vh] md:h-[65vh] flex flex-col items-center justify-center animate-in fade-in">
                <WalletCards className="w-10 h-10 text-slate-200 mb-3" />
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin Tripulación</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">Asigna un operador al camión para ver su nómina.</p>
            </div>
        );
    }

    // Filtros vacíos por defecto
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Paginación (5 items)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => { setCurrentPage(1); }, [startDate, endDate]);

    const { data: userAdvances, isLoading: loadingAdvances } = useQuery({
        queryKey: ['userAdvances', user.id],
        queryFn: async () => { try { return (await api.get(`/finances/advances/user/${user.id}?limit=1000&skip=0`)).data; } catch { return []; } },
        enabled: !!user.id,
        refetchOnWindowFocus: true
    });

    const { data: userSalaries, isLoading: loadingSalaries } = useQuery({
        queryKey: ['userSalaries', user.id],
        queryFn: async () => { try { return (await api.get(`/finances/salaries/user/${user.id}?limit=1000&skip=0`)).data; } catch { return []; } },
        enabled: !!user.id,
        refetchOnWindowFocus: true
    });

    const getEcuadorDateString = (dateString) => {
        if (!dateString) return '';
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(dateString.replace(' ', 'T')));
    };

    const myPayments = useMemo(() => {
        const combined = [
            ...(userAdvances || []).map(a => ({ ...a, displayType: 'Viático', date: a.date_given })),
            ...(userSalaries || []).map(s => ({ ...s, displayType: 'Sueldo', date: s.date_paid }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (!startDate && !endDate) return combined;

        return combined.filter(payment => {
            const paymentDate = getEcuadorDateString(payment.date);
            if (startDate && endDate) return paymentDate >= startDate && paymentDate <= endDate;
            if (startDate) return paymentDate >= startDate;
            if (endDate) return paymentDate <= endDate;
            return true;
        });
    }, [userAdvances, userSalaries, startDate, endDate]);

    // Calcular datos de paginación
    const totalPages = Math.ceil(myPayments.length / itemsPerPage) || 1;
    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return myPayments.slice(startIndex, startIndex + itemsPerPage);
    }, [myPayments, currentPage]);

    const clearFilters = () => { setStartDate(''); setEndDate(''); };
    const hasActiveFilters = startDate || endDate;

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Historial de Ingresos y Viáticos', 14, 20);
        doc.setFontSize(10);
        doc.text(`Colaborador: ${user?.full_name || 'Desconocido'}`, 14, 28);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-EC')}`, 14, 34);

        const tableColumn = ["Fecha", "Tipo", "Descripción", "Monto"];
        const tableRows = [];

        myPayments.forEach(payment => { // Exporta todo lo filtrado, no solo la página actual
            tableRows.push([
                formatDateTime(payment.date),
                payment.displayType,
                payment.description || 'N/A',
                `$${payment.amount.toFixed(2)}`
            ]);
        });

        doc.autoTable({
            head: [tableColumn], body: tableRows, startY: 40, theme: 'grid',
            headStyles: { fillColor: [12, 39, 60] },
            styles: { fontSize: 10 }
        });

        const safeName = (user?.full_name || 'Personal').replace(/\s+/g, '_');
        doc.save(`Ingresos_${safeName}.pdf`);
    };

    if (loadingAdvances || loadingSalaries) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-atlas-yellow" /></div>;
    }

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-[75vh] md:h-[65vh] flex flex-col animate-in fade-in duration-300">
            <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-slate-100 shrink-0">
                <div className="flex justify-between items-center">
                    <h4 className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <WalletCards className="w-4 h-4" /> HISTORIAL DE PAGOS
                    </h4>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && <button onClick={clearFilters} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><X className="w-4 h-4" /></button>}
                        <button
                            onClick={handleExportPDF}
                            disabled={myPayments.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-atlas-navy text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 focus:outline-none w-full" />
                    <span className="text-[10px] font-black text-slate-400">AL</span>
                    <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] md:text-xs font-bold text-slate-600 focus:outline-none w-full" />
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {paginatedPayments.length > 0 ? paginatedPayments.map((payment, idx) => {
                    const paymentImgUrl = payment.photo_url || payment.receipt_url || payment.voucher_url;
                    return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0 animate-in slide-in-from-right-2">
                            <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`p-1.5 rounded-lg ${payment.displayType === 'Sueldo' ? 'bg-atlas-navy text-white' : 'bg-atlas-yellow text-atlas-navy'}`}>
                                        {payment.displayType === 'Sueldo' ? <Banknote className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                                    </div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-wide">{payment.displayType}</p>
                                </div>
                                {payment.description && <p className="text-[11px] text-slate-600 font-bold truncate uppercase mb-1">{payment.description}</p>}
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">
                                    <Clock className="w-3 h-3" /> {formatDateTime(payment.date)}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="text-sm md:text-base font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                                    +${payment.amount.toFixed(2)}
                                </span>
                                {paymentImgUrl && (
                                    <button onClick={() => handleOpenPreview(paymentImgUrl, `COMPROBANTE DE ${payment.displayType}`)} className="text-slate-500 bg-white p-1.5 rounded-md border border-slate-200 hover:text-atlas-navy transition-colors shadow-sm">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-12">
                        <WalletCards className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">NO HAY RESULTADOS</p>
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