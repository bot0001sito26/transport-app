import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-atlas-navy/60 backdrop-blur-sm z-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 md:p-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-red-100 text-red-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-extrabold text-atlas-navy mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-8">{message}</p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all active:scale-95"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}