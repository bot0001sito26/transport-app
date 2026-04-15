import { AlertTriangle } from 'lucide-react';

export default function ConfirmActionModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", isDanger = true }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-atlas-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
                <div className="p-6 md:p-8 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-atlas-navy/10 text-atlas-navy'}`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-atlas-navy mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-8">{message}</p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 font-bold rounded-xl shadow-lg transition-all active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-atlas-navy hover:bg-slate-800 text-atlas-yellow'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}