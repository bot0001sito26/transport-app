import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { WalletCards, Banknote, Coins, Clock, Eye, ChevronDown, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function PaymentsTab({ user, formatDateTime, handleOpenPreview }) {
    const [paymentsLimit, setPaymentsLimit] = useState(20);

    const { data: userAdvances } = useQuery({
        queryKey: ['userAdvances', user.id, paymentsLimit],
        queryFn: async () => { try { return (await api.get(`/finances/advances/user/${user.id}?limit=${paymentsLimit}&skip=0`)).data; } catch { return []; } },
        enabled: !!user.id,
        refetchOnWindowFocus: true
    });

    const { data: userSalaries } = useQuery({
        queryKey: ['userSalaries', user.id, paymentsLimit],
        queryFn: async () => { try { return (await api.get(`/finances/salaries/user/${user.id}?limit=${paymentsLimit}&skip=0`)).data; } catch { return []; } },
        enabled: !!user.id,
        refetchOnWindowFocus: true
    });

    const myPayments = [
        ...(userAdvances || []).map(a => ({ ...a, displayType: 'Viático', date: a.date_given })),
        ...(userSalaries || []).map(s => ({ ...s, displayType: 'Sueldo', date: s.date_paid }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Historial de Ingresos y Viáticos', 14, 20);
        doc.setFontSize(10);
        doc.text(`Colaborador: ${user?.full_name || 'Desconocido'}`, 14, 28);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-EC')}`, 14, 34);

        const tableColumn = ["Fecha", "Tipo", "Descripción", "Monto"];
        const tableRows = [];

        myPayments.forEach(payment => {
            tableRows.push([
                formatDateTime(payment.date),
                payment.displayType,
                payment.description || 'N/A',
                `$${payment.amount.toFixed(2)}`
            ]);
        });

        doc.autoTable({
            head: [tableColumn], body: tableRows, startY: 40, theme: 'grid',
            headStyles: { fillColor: [12, 39, 60] }, // atlas-navy aprox
            styles: { fontSize: 10 }
        });

        const safeName = (user?.full_name || 'Personal').replace(/\s+/g, '_');
        doc.save(`Ingresos_${safeName}.pdf`);
    };

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-300 min-h-[350px] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h4 className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><WalletCards className="w-4 h-4" /> HISTORIAL DE PAGOS</h4>
                <button
                    onClick={handleExportPDF}
                    disabled={myPayments.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-atlas-navy text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    <Download className="w-4 h-4" /> PDF
                </button>
            </div>

            <div className="space-y-3 flex-1">
                {myPayments.length > 0 ? myPayments.map((payment, idx) => {
                    const paymentImgUrl = payment.photo_url || payment.receipt_url || payment.voucher_url;
                    return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
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
                        <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">AÚN NO HAY PAGOS REGISTRADOS</p>
                    </div>
                )}
            </div>

            {myPayments.length >= paymentsLimit && (
                <button onClick={() => setPaymentsLimit(prev => prev + 20)} className="mt-4 w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] md:text-xs font-black text-atlas-navy uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100">
                    <ChevronDown className="w-4 h-4" /> CARGAR MÁS PAGOS
                </button>
            )}
        </div>
    );
}