import { X, UserCircle2, MapPin, FileText, Camera, Scale, ChevronDown } from 'lucide-react';

export default function ClientDestinationCard({
    client,
    index,
    canRemove,
    isExpanded,
    onToggle,
    onRemoveClient,
    onUpdateField,
    onPackingListChange,
    onRemovePackingList,
    onGuideChange,
    onRemoveGuide,
    onWeightChange
}) {
    return (
        <div className={`bg-white border-2 rounded-2xl shadow-sm transition-all overflow-hidden ${isExpanded ? 'border-atlas-navy/30' : 'border-slate-100 hover:border-slate-200'}`}>

            <div
                className="flex items-center justify-between p-3 sm:p-4 cursor-pointer select-none bg-slate-50/50"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${isExpanded ? 'bg-atlas-navy text-atlas-yellow' : 'bg-slate-200 text-slate-500'}`}>
                        {index + 1}
                    </div>
                    <div>
                        <h4 className="text-xs md:text-sm font-black text-atlas-navy uppercase tracking-wide">
                            {client.name || 'Nuevo Cliente'}
                        </h4>
                        {client.reference && <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-37.5 sm:max-w-xs">{client.reference}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {client.guidePreview && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md uppercase tracking-widest hidden sm:block">
                            Guía Lista
                        </span>
                    )}

                    {canRemove && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRemoveClient(client.id); }}
                            className="bg-red-50 text-red-400 p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="flex gap-2">
                            <div className="bg-atlas-navy/5 p-2.5 rounded-xl border border-atlas-navy/10 flex items-center justify-center shrink-0">
                                <UserCircle2 className="w-5 h-5 text-atlas-navy" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="text-[8px] font-bold text-slate-400 uppercase absolute left-3 top-1.5 z-10">Nombre del Cliente</label>
                                <input
                                    type="text" list="client-history" required
                                    value={client.name} onChange={(e) => onUpdateField(client.id, 'name', e.target.value)}
                                    placeholder="Ej. Const. Roldos"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pt-5 pb-1.5 px-3 font-bold text-atlas-navy focus:border-atlas-navy focus:ring-2 focus:ring-atlas-navy/20 focus:bg-white text-sm transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="bg-atlas-navy/5 p-2.5 rounded-xl border border-atlas-navy/10 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-atlas-navy" />
                            </div>
                            <div className="flex-1 relative">
                                <label className="text-[8px] font-bold text-slate-400 uppercase absolute left-3 top-1.5 z-10">Lugar (Opcional)</label>
                                <input
                                    type="text"
                                    value={client.reference} onChange={(e) => onUpdateField(client.id, 'reference', e.target.value)}
                                    placeholder="Ej. Bodega km 13"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pt-5 pb-1.5 px-3 font-bold text-atlas-navy focus:border-atlas-navy focus:ring-2 focus:ring-atlas-navy/20 focus:bg-white text-sm transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Lista de Embarque */}
                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200 flex flex-col">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">1. Lista de Embarque</label>
                            <div className="flex-1">
                                {client.packingListPreview ? (
                                    <div className="relative w-full h-28 border-2 border-slate-200 rounded-xl overflow-hidden">
                                        <img src={client.packingListPreview} className="w-full h-full object-cover" alt="Lista" />
                                        <button
                                            type="button" onClick={() => onRemovePackingList(client.id)}
                                            className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 active:scale-95 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-atlas-navy/40 cursor-pointer transition-all group/upload">
                                        <FileText className="w-6 h-6 text-slate-400 group-hover/upload:text-atlas-navy mb-1.5 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/upload:text-atlas-navy transition-colors">Subir Lista</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onPackingListChange(client.id, e)} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* 2. ÚNICA Guía de Remisión */}
                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200 flex flex-col">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">2. Guía Física</label>
                            <div className="flex-1 flex flex-col gap-2">
                                {client.guidePreview ? (
                                    <div className="relative w-full h-28 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <img src={client.guidePreview} className="w-full h-full object-cover" alt="Guía" />
                                        <button
                                            type="button" onClick={() => onRemoveGuide(client.id)}
                                            className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 active:scale-95 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-atlas-navy/40 cursor-pointer transition-all group/upload">
                                        <Camera className="w-6 h-6 text-slate-400 group-hover/upload:text-atlas-navy mb-1.5 transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover/upload:text-atlas-navy transition-colors">Subir Guía</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onGuideChange(client.id, e)} />
                                    </label>
                                )}

                                {/* Input de Peso solo si hay guía */}
                                {client.guidePreview && (
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus-within:border-atlas-navy transition-all">
                                        <Scale className="w-4 h-4 text-slate-400 shrink-0" />
                                        <input
                                            type="text" inputMode="decimal" required
                                            value={client.guideWeight}
                                            onChange={(e) => onWeightChange(client.id, e.target.value)}
                                            placeholder="Peso en Kg"
                                            className="w-full text-xs font-black text-atlas-navy border-none bg-transparent p-0 outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}