import { CheckCircle2, XCircle, Info } from 'lucide-react';

export default function AlertModal({ isOpen, onClose, title, message, type = 'success' }) {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const isError = type === 'error';
    const isInfo = type === 'info';

    return (
        <div className="fixed inset-0 bg-atlas-navy/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 md:p-8 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-100 text-emerald-600' :
                        isError ? 'bg-red-100 text-red-600' :
                            'bg-atlas-yellow/20 text-atlas-yellow'
                        }`}>
                        {isSuccess && <CheckCircle2 className="w-8 h-8" />}
                        {isError && <XCircle className="w-8 h-8" />}
                        {isInfo && <Info className="w-8 h-8" />}
                    </div>

                    <h3 className="text-xl font-extrabold text-atlas-navy mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-8">{message}</p>

                    <button
                        onClick={onClose}
                        className={`w-full px-4 py-3 font-bold rounded-xl shadow-lg transition-all active:scale-95 ${isSuccess ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                            isError ? 'bg-red-600 hover:bg-red-700 text-white' :
                                'bg-atlas-navy hover:bg-slate-800 text-atlas-yellow'
                            }`}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}