import { useState, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import AlertModal from "../../modals/AlertModal";
import TruckDetailView from "./TruckDetailView";

// Carga perezosa (lazy) de los módulos
const DashboardTab = lazy(() => import('./tabs/DashboardTab'));
const FleetTab = lazy(() => import('./tabs/FleetTab'));

export default function OwnerView({ user }) {
    // Estados principales
    const [selectedTruckId, setSelectedTruckId] = useState(null);
    const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    // Función para invocar alertas globales
    const showAlert = (title, message, type = 'success') => {
        setAlertData({ isOpen: true, title, message, type });
    };

    // --- INTERCEPTOR DE VISTA (Drill-down a detalle del camión) ---
    if (selectedTruckId) {
        return <TruckDetailView truckId={selectedTruckId} onBack={() => setSelectedTruckId(null)} />;
    }

    return (
        <div className="p-4 md:p-8 animate-in fade-in duration-300 bg-slate-50/50 min-h-screen max-w-7xl mx-auto space-y-8">

            {/* Cabecera Ultra-Limpia */}
            <div>
                <h2 className="text-2xl font-light text-slate-800 tracking-tight">Panel Gerencial</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Resumen Operativo • {new Date().toLocaleString('es-EC', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Contenedor Unificado: Resumen arriba, Flota abajo */}
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-slate-300 w-8 h-8" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando Módulos...</p>
                </div>
            }>
                <div className="space-y-8">
                    {/* 1. Métricas Globales */}
                    <DashboardTab user={user} showAlert={showAlert} />

                    {/* 2. Flota Activa */}
                    <div className="pt-2">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-3 flex items-center gap-2">
                            Estado de Flota
                        </h3>
                        <FleetTab user={user} setSelectedTruckId={setSelectedTruckId} showAlert={showAlert} />
                    </div>
                </div>
            </Suspense>

            {/* Modal Global de Alertas */}
            <AlertModal
                isOpen={alertData.isOpen}
                onClose={() => setAlertData({ ...alertData, isOpen: false })}
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
            />
        </div>
    );
}