import { useEffect, useState, useMemo } from 'react';
import {
    X, Loader2, ArrowUpRight, ArrowDownLeft, Wallet,
    FileImage, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../api/axios';

export default function StaffLedgerModal({ isOpen, onClose, staffData, onOpenPreview }) {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    // Estados de Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (isOpen && staffData?.id) {
            loadLedger();
        } else {
            setHistory([]);
            setCurrentPage(1);
        }
    }, [isOpen, staffData]);

    const loadLedger = async () => {
        setLoading(true);
        try {
            const [advancesRes, salariesRes] = await Promise.all([
                api.get(`/finances/advances/user/${staffData.id}`),
                api.get(`/finances/salaries/user/${staffData.id}`)
            ]);

            const formattedAdvances = (advancesRes.data || []).map(a => ({
                id: `adv-${a.id}`,
                type: 'anticipo',
                amount: a.amount,
                date: new Date(a.date_given),
                concept: a.description,
                photo_url: a.photo_url || null,
            }));

            const formattedSalaries = (salariesRes.data || []).map(s => ({
                id: `sal-${s.id}`,
                type: 'sueldo',
                amount: s.amount,
                date: new Date(s.date_paid),
                concept: s.description,
                photo_url: s.photo_url || null,
            }));

            const combined = [...formattedAdvances, ...formattedSalaries].sort((a, b) => b.date - a.date);
            setHistory(combined);
        } catch (error) {
            console.error("Error en auditoría:", error);
        } finally {
            setLoading(false);
        }
    };

    // Lógica de Paginación
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage;
        const firstIndex = lastIndex - itemsPerPage;
        return history.slice(firstIndex, lastIndex);
    }, [history, currentPage]);

    const totalPagado = useMemo(() => history.reduce((sum, item) => sum + item.amount, 0), [history]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-atlas-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-50 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col h-150 border border-slate-200">

                {/* Cabecera */}
                <div className="flex justify-between items-center p-4 bg-white border-b border-slate-200 shrink-0">
                    <div>
                        <h3 className="text-sm font-black text-atlas-navy uppercase tracking-widest flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-emerald-600" /> Libro de Pagos
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{staffData?.full_name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Status Bar */}
                <div className="bg-atlas-navy p-4 shrink-0 flex justify-between items-center shadow-lg">
                    <div>
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-0.5">Total Transferido</p>
                        <p className="text-xl font-black text-white">${totalPagado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-right">
                        <p className="text-[10px] font-black text-atlas-yellow uppercase">{history.length} Entradas</p>
                        <p className="text-[8px] font-bold text-white/40 uppercase">Registro Completo</p>
                    </div>
                </div>

                {/* Lista Paginada */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50 hide-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-atlas-yellow" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-30">
                            <Wallet className="w-12 h-12 mb-2" />
                            <p className="text-xs font-black uppercase">Sin historial</p>
                        </div>
                    ) : (
                        currentItems.map((item) => (
                            <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3 animate-in slide-in-from-right-2">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${item.type === 'sueldo' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                        {item.type === 'sueldo' ? (
                                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${item.type === 'sueldo' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">{item.date.toLocaleDateString('es-EC')}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-600 leading-tight italic">
                                            "{item.concept || 'Sin descripción'}"
                                        </p>
                                        {item.photo_url && (
                                            <button
                                                onClick={() => onOpenPreview && onOpenPreview(item.photo_url, `Comprobante - ${item.concept}`)}
                                                className="mt-2.5 flex items-center gap-1.5 text-[9px] font-black text-slate-500 hover:text-atlas-navy transition-colors"
                                            >
                                                <FileImage className="w-3 h-3" /> Ver Adjunto
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className={`text-xs font-black shrink-0 ${item.type === 'sueldo' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    ${item.amount.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer con Controles de Paginación */}
                {totalPages > 1 && (
                    <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-atlas-navy" />
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página</span>
                            <div className="bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                                <span className="text-xs font-black text-atlas-navy">{currentPage}</span>
                                <span className="text-[10px] font-bold text-slate-400 mx-1">/</span>
                                <span className="text-[10px] font-bold text-slate-400">{totalPages}</span>
                            </div>
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-atlas-navy" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}