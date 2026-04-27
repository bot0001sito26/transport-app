import { AlertCircle, CheckCircle2, Users } from 'lucide-react';

export default function StaffExistingList({ availableStaff, isLoadingUsers, truckId, handleAssignExisting, loading }) {
    return (
        <div className="space-y-3 animate-in fade-in">
            {isLoadingUsers ? (
                <div className="py-12 text-center text-slate-400"><p className="text-xs font-bold uppercase animate-pulse">Cargando base de datos...</p></div>
            ) : availableStaff.length > 0 ? (
                availableStaff.map((user) => (
                    <div key={user.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-atlas-navy/30 transition-colors">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-atlas-navy">{user.full_name}</h4>
                                {!user.is_active ? (
                                    <span className="flex items-center gap-1 bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"><AlertCircle className="w-3 h-3" /> Inactivo</span>
                                ) : (
                                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Activo</span>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">DNI: {user.dni}</p>

                            {user.assigned_truck_id === parseInt(truckId) ? (
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Ya asignado a esta unidad</span>
                            ) : user.assigned_truck_id ? (
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold uppercase tracking-widest">En otro camión</span>
                            ) : (
                                <span className="text-[9px] bg-atlas-navy/10 text-atlas-navy border border-atlas-navy/20 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Libre de asignación</span>
                            )}
                        </div>

                        {user.assigned_truck_id !== parseInt(truckId) && (
                            <button
                                onClick={() => handleAssignExisting(user)}
                                disabled={loading}
                                className="shrink-0 bg-atlas-navy text-atlas-yellow px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? '...' : (user.is_active ? 'Reasignar' : 'Reactivar')}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No hay historial de personal<br />con este rol.</p>
                </div>
            )}
        </div>
    );
}