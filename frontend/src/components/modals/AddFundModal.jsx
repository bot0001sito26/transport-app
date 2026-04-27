import { useState, useRef } from 'react';
import api from '../../api/axios';
import { Camera, X, CheckCircle2, DollarSign, Wallet } from 'lucide-react';

export default function AddFundModal({ isOpen, onClose, truckId, onSuccess, onError }) {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [amount, setAmount] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleAddFund = async (e) => {
        e.preventDefault();

        if (!amount || amount <= 0) return onError("Ingrese un monto válido a depositar.");
        if (!photoFile) return onError("Debe subir el comprobante de transferencia o recibo.");

        setLoading(true);

        try {
            // 1. Subir la foto
            const uploadFormData = new FormData();
            uploadFormData.append('file', photoFile);
            const uploadRes = await api.post('/upload/fondos', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Registrar el fondo
            await api.post('/finances/truck-funds/', {
                truck_id: truckId,
                amount: parseFloat(amount),
                photo_url: uploadRes.data.url
            });

            onSuccess();
            setAmount('');
            setPhotoPreview(null);
            setPhotoFile(null);
        } catch (error) {
            const msg = error.response?.data?.detail || "Error al recargar el fondo.";
            if (typeof onError === 'function') {
                onError(Array.isArray(msg) ? msg[0].msg : msg);
            } else {
                console.error("Error:", msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-110 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-atlas-yellow rounded-full"></div>
                        <h3 className="text-xl font-black text-atlas-navy tracking-tighter uppercase italic">Abonar Fondo</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-atlas-navy transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-atlas-navy/5 border border-atlas-navy/10 p-3 rounded-xl mb-6 flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-atlas-navy shrink-0 mt-0.5" />
                    <p className="text-[11px] text-atlas-navy font-bold">Este dinero se sumará a la caja chica del camión para peajes y gastos en ruta.</p>
                </div>

                <form onSubmit={handleAddFund} className="space-y-5">
                    <div className="relative group">
                        <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-atlas-navy">Monto del Abono (USD)</label>
                        <DollarSign className="absolute right-5 top-7 text-atlas-yellow w-5 h-5 pointer-events-none" />
                        <input
                            type="number" step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-5 pt-8 pb-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-atlas-navy focus:bg-white transition-all font-black text-2xl text-atlas-navy"
                            placeholder="0.00"
                        />
                    </div>

                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    <div
                        onClick={() => fileInputRef.current.click()}
                        className={`group relative overflow-hidden rounded-3xl border-2 border-dashed transition-all cursor-pointer ${photoPreview ? 'border-atlas-navy bg-atlas-navy/5' : 'border-slate-200 bg-slate-50 hover:border-atlas-navy/50'}`}
                    >
                        {photoPreview ? (
                            <div className="relative h-32 w-full">
                                <img src={photoPreview} className="h-full w-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-atlas-navy/40 flex items-center justify-center backdrop-blur-[2px]">
                                    <CheckCircle2 className="text-atlas-yellow w-10 h-10 drop-shadow-lg" />
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center gap-2">
                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera className="w-6 h-6 text-slate-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center leading-tight">Subir<br />Comprobante</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-atlas-navy/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? "PROCESANDO..." : "CONFIRMAR ABONO"}
                    </button>
                </form>
            </div>
        </div>
    );
}