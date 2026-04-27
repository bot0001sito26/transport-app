import { useState, Suspense, lazy } from 'react';
import { Loader2, LayoutDashboard, Truck, Activity, BookOpen, Wallet } from 'lucide-react';
import AlertModal from "../../modals/AlertModal";
import TruckDetailView from "./TruckDetailView";

const DashboardTab = lazy(() => import('./tabs/DashboardTab'));
const FleetTab = lazy(() => import('./tabs/FleetTab'));
const LiveMonitorTab = lazy(() => import('./tabs/LiveMonitorTab'));
const BitacoraTab = lazy(() => import('./tabs/BitacoraTab'));
// CONSISTENCIA TOTAL: Variable y archivo se llaman exactamente igual
const FinanzasTab = lazy(() => import('./tabs/FinanzasTab'));

export default function OwnerView({ user }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedTruckId, setSelectedTruckId] = useState(null);
    const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    const showAlert = (title, message, type = 'success') => {
        setAlertData({ isOpen: true, title, message, type });
    };

    if (selectedTruckId) {
        return <TruckDetailView truckId={selectedTruckId} onBack={() => setSelectedTruckId(null)} />;
    }

    return (
        <div className="p-3 md:p-6 space-y-4 bg-slate-50 min-h-screen pb-24 antialiased max-w-7xl mx-auto">

            <div className="bg-atlas-navy rounded-2xl p-4 md:p-5 shadow-lg border border-slate-800 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Panel Gerencial</h2>
                    <p className="text-atlas-yellow text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">
                        Resumen Operativo • {new Date().toLocaleString('es-EC', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="hidden sm:flex bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <Activity className="w-6 h-6 text-atlas-yellow" />
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-200/60 rounded-xl animate-in zoom-in-95 duration-300">
                <button onClick={() => setActiveTab('dashboard')} className={`flex-1 min-w-[30%] sm:min-w-20 py-2.5 text-[10px] md:text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'dashboard' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <LayoutDashboard className="w-4 h-4" /> MÉTRICAS
                </button>
                <button onClick={() => setActiveTab('fleet')} className={`flex-1 min-w-[30%] sm:min-w-20 py-2.5 text-[10px] md:text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'fleet' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <Truck className="w-4 h-4" /> FLOTA
                </button>
                <button onClick={() => setActiveTab('live')} className={`flex-1 min-w-[30%] sm:min-w-20 py-2.5 text-[10px] md:text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'live' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <Activity className="w-4 h-4" /> EN VIVO
                </button>
                <button onClick={() => setActiveTab('billing')} className={`flex-1 min-w-[30%] sm:min-w-20 py-2.5 text-[10px] md:text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'billing' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <Wallet className="w-4 h-4" /> FINANZAS
                </button>
                <button onClick={() => setActiveTab('notes')} className={`flex-1 min-w-[30%] sm:min-w-20 py-2.5 text-[10px] md:text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all tracking-wider ${activeTab === 'notes' ? 'bg-white text-atlas-navy shadow-sm' : 'text-slate-500 hover:text-atlas-navy'}`}>
                    <BookOpen className="w-4 h-4" /> BITÁCORA
                </button>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-atlas-yellow w-8 h-8" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando Módulo...</p>
                </div>
            }>
                <div className="mt-2">
                    {activeTab === 'dashboard' && <DashboardTab user={user} showAlert={showAlert} />}
                    {activeTab === 'fleet' && <FleetTab user={user} setSelectedTruckId={setSelectedTruckId} showAlert={showAlert} />}
                    {activeTab === 'live' && <LiveMonitorTab user={user} />}
                    {/* ETIQUETA ACTUALIZADA */}
                    {activeTab === 'billing' && <FinanzasTab user={user} showAlert={showAlert} />}
                    {activeTab === 'notes' && <BitacoraTab user={user} showAlert={showAlert} />}
                </div>
            </Suspense>

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