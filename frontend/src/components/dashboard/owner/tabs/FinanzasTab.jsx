import { useState, useEffect, useMemo } from 'react';
import api from '../../../../api/axios';
import {
    Loader2, DollarSign, CheckCircle, FileText, PackageOpen,
    Receipt, FileSignature, Filter, X, UploadCloud, FileCheck,
    Download, ChevronDown, TrendingUp, TrendingDown, Wallet, Wrench, Users, Truck
} from 'lucide-react';
import ImagePreviewModal from '../../../modals/ImagePreviewModal';
import { generateFinanzasPDF } from '../../../../utils/pdfGenerator';

export default function FinanzasTab({ user, showAlert }) {
    const [travels, setTravels] = useState([]);
    const [allExpenses, setAllExpenses] = useState([]);
    const [salaries, setSalaries] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [trucks, setTrucks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [expandedTravelId, setExpandedTravelId] = useState(null);
    const [payingTravelId, setPayingTravelId] = useState(null);
    const [amountStr, setAmountStr] = useState('');
    const [invoiceFile, setInvoiceFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState({ isOpen: false, url: '', title: '' });

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

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

    const loadData = async () => {
        setLoading(true);
        try {
            // Promesa múltiple con las rutas corregidas
            const [travelsRes, expensesRes, salariesRes, advancesRes, trucksRes] = await Promise.all([
                api.get('/travels/'),
                api.get('/finances/'),
                api.get('/finances/salaries/').catch(() => ({ data: [] })),
                api.get('/finances/advances/').catch(() => ({ data: [] })),
                api.get('/trucks/')
            ]);

            const finished = travelsRes.data.filter(t => t.status === 'finalizado');
            finished.sort((a, b) => new Date(b.end_time) - new Date(a.end_time));

            setTravels(finished);
            setAllExpenses(expensesRes.data);
            setSalaries(salariesRes.data || []);
            setAdvances(advancesRes.data || []);
            setTrucks(trucksRes.data || []);
        } catch (error) {
            showAlert('Error', 'No se pudieron cargar todos los datos financieros.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const metrics = useMemo(() => {
        const fTravels = travels.filter(t => t.end_time?.split('T')[0] >= startDate && t.end_time?.split('T')[0] <= endDate);
        const fExpenses = allExpenses.filter(e => e.created_at?.split('T')[0] >= startDate && e.created_at?.split('T')[0] <= endDate);
        const fSalaries = salaries.filter(s => s.date_paid?.split('T')[0] >= startDate && s.date_paid?.split('T')[0] <= endDate);
        const fAdvances = advances.filter(a => a.date_given?.split('T')[0] >= startDate && a.date_given?.split('T')[0] <= endDate);

        let ingresos = 0;
        let egresosRuta = 0;
        let egresosPatio = 0;
        let nomina = 0;

        fTravels.forEach(t => { if (t.billing_status === 'pagado') ingresos += (t.amount_paid || 0); });
        fExpenses.forEach(e => { if (e.travel_id) egresosRuta += e.amount; else egresosPatio += e.amount; });
        fSalaries.forEach(s => nomina += s.amount);
        fAdvances.forEach(a => nomina += a.amount);

        const cajaChica = trucks.reduce((sum, t) => sum + (t.current_balance || 0), 0);

        return {
            travels: fTravels,
            ingresos,
            egresosRuta,
            egresosPatio,
            nomina,
            cajaChica,
            trucksData: trucks,
            balance: ingresos - (egresosRuta + egresosPatio + nomina)
        };
    }, [travels, allExpenses, salaries, advances, trucks, startDate, endDate]);

    const handlePay = async (travelId) => {
        if (!amountStr || isNaN(amountStr) || !invoiceFile) return showAlert('Error', 'Monto y factura obligatorios.', 'error');
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', invoiceFile);
            const uploadRes = await api.post('/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            await api.patch(`/travels/${travelId}/pay`, { amount_paid: parseFloat(amountStr), invoice_url: uploadRes.data.url || uploadRes.data.file_url });
            showAlert('Éxito', 'Pago registrado.', 'success');
            setPayingTravelId(null); setAmountStr(''); setInvoiceFile(null);
            loadData();
        } catch (e) { showAlert('Error', 'Fallo al cobrar.', 'error'); }
        finally { setIsProcessing(false); }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const blob = await generateFinanzasPDF(metrics, startDate, endDate);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Atlas_Auditoria_Caja_${startDate}_al_${endDate}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            showAlert('Error', 'No se pudo generar el reporte PDF', 'error');
            console.error("Error al generar PDF:", error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-atlas-yellow" /></div>;

    return (
        <div className="space-y-3 animate-in fade-in mt-2 pb-10">

            {/* GRID 2x3 DE MÉTRICAS GLOBALES */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ingresos (Facturado)</p>
                    <p className="text-sm font-black text-emerald-700">${metrics.ingresos.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1"><TrendingDown className="w-3 h-3 text-rose-400" /> Gastos Ruta</p>
                    <p className="text-sm font-black text-rose-500">${metrics.egresosRuta.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1"><Wrench className="w-3 h-3 text-slate-400" /> Gastos Patio</p>
                    <p className="text-sm font-black text-rose-500">${metrics.egresosPatio.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> Nómina (Sueldos+Ant)</p>
                    <p className="text-sm font-black text-rose-500">${metrics.nomina.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1"><Truck className="w-3 h-3 text-atlas-yellow" /> Activo (Cajas Chicas)</p>
                    <p className="text-sm font-black text-slate-700">${metrics.cajaChica.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className={`${metrics.balance >= 0 ? 'bg-atlas-navy' : 'bg-rose-900'} p-2.5 rounded-xl shadow-md flex flex-col justify-between transition-colors`}>
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-tighter flex items-center gap-1"><Wallet className="w-3 h-3" /> Balance Neto</p>
                    <p className="text-sm font-black text-white">${metrics.balance.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* FILTROS Y PDF */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-atlas-navy outline-none w-21.25" />
                    <span className="text-[8px] font-black text-slate-300">/</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-atlas-navy outline-none w-21.25" />
                </div>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 bg-atlas-navy text-atlas-yellow px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                >
                    {isGeneratingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    Auditoría
                </button>
            </div>

            {/* LISTADO DE ACORDEONES DE COBRANZA */}
            <div className="space-y-1.5">
                {metrics.travels.map((t) => {
                    const isExpanded = expandedTravelId === t.id;
                    const isPaid = t.billing_status === 'pagado';
                    return (
                        <div key={t.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? 'border-atlas-navy ring-1 ring-atlas-navy/10' : 'border-slate-200'}`}>
                            <div className="p-2.5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedTravelId(isExpanded ? null : t.id)}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                                    <div>
                                        <p className="text-[10px] font-black text-atlas-navy uppercase">OP #{t.id} • {t.material_type}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(t.end_time).toLocaleDateString('es-EC')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className={`text-[10px] font-black ${isPaid ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {isPaid ? `$${t.amount_paid.toLocaleString('es-EC', { minimumFractionDigits: 2 })}` : 'PENDIENTE'}
                                    </p>
                                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-3 pb-3 border-t border-slate-50 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-1 gap-1.5 mt-3">
                                        {t.destinations.map(d => (
                                            <div key={d.id} className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                                                <span className="text-[9px] font-black text-atlas-navy uppercase truncate max-w-[60%]">{d.client_name}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleOpenPreview(d.guides?.find(g => g.guide_type === 'entrega')?.photo_url, 'Guía')} className="p-1.5 bg-white border border-slate-200 rounded hover:text-atlas-navy transition-colors"><FileSignature className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleOpenPreview(d.packing_list_url, 'Packing List')} className="p-1.5 bg-white border border-slate-200 rounded hover:text-atlas-navy transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleOpenPreview(d.stowage_photo_url, 'Estiba')} className="p-1.5 bg-white border border-slate-200 rounded hover:text-atlas-navy transition-colors"><PackageOpen className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        {isPaid ? (
                                            <button onClick={() => handleOpenPreview(t.invoice_url, 'Factura')} className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2 rounded-lg text-[9px] font-black uppercase border border-emerald-100 transition-colors">
                                                <Download className="w-3.5 h-3.5" /> Ver Factura Digital
                                            </button>
                                        ) : (
                                            payingTravelId === t.id ? (
                                                <div className="flex gap-2 animate-in slide-in-from-right-2">
                                                    <input type="number" step="0.01" value={amountStr} onChange={e => setAmountStr(e.target.value)} className="flex-1 px-3 py-1.5 bg-slate-50 border border-atlas-navy rounded-lg text-[10px] font-black outline-none" placeholder="Monto $" />
                                                    <input type="file" id={`f-${t.id}`} className="hidden" onChange={e => setInvoiceFile(e.target.files[0])} />
                                                    <label htmlFor={`f-${t.id}`} className={`p-1.5 rounded-lg border cursor-pointer ${invoiceFile ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                                        <UploadCloud className="w-4 h-4" />
                                                    </label>
                                                    <button onClick={() => handlePay(t.id)} disabled={isProcessing} className="bg-atlas-navy text-atlas-yellow px-3 rounded-lg"><CheckCircle className="w-4 h-4" /></button>
                                                    <button onClick={() => setPayingTravelId(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setPayingTravelId(t.id)} className="w-full bg-atlas-navy text-atlas-yellow py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all">Facturar y Cobrar</button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <ImagePreviewModal isOpen={previewData.isOpen} imageUrl={previewData.url} title={previewData.title} onClose={() => setPreviewData({ isOpen: false, url: '', title: '' })} />
        </div>
    );
}