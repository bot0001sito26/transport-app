import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import { Camera, X, Scale, MapPin, Plus, UserCircle2, CheckCircle2 } from 'lucide-react';

const QUICK_MATERIALS = ["Varios", "Acero", "Cemento", "Piedra/Arena", "Asfalto", "Maquinaria"];

const parseLocalNumber = (val) => {
    if (!val) return 0;
    const cleanStr = String(val).replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
};

export default function CreateTravelModal({ isOpen, onClose, onSuccess, onError, truck }) {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const [savedClients, setSavedClients] = useState([]);

    const [formData, setFormData] = useState({
        material_type: 'Varios',
        custom_material: ''
    });

    const [clients, setClients] = useState([
        { id: Date.now(), name: '', reference: '', guides: [] }
    ]);
    const [activeClientForUpload, setActiveClientForUpload] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const history = JSON.parse(localStorage.getItem('client_history') || '[]');
            setSavedClients(history);
            setFormData({ material_type: 'Varios', custom_material: '' });
            setClients([{ id: Date.now(), name: '', reference: '', guides: [] }]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const addClient = () => setClients(prev => [...prev, { id: Date.now(), name: '', reference: '', guides: [] }]);

    const removeClient = (id) => {
        if (clients.length === 1) return;
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const updateClientField = (id, field, value) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const triggerPhotoUpload = (clientId) => {
        setActiveClientForUpload(clientId);
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (!activeClientForUpload) return;
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newGuides = files.map(file => ({ file, preview: URL.createObjectURL(file), weight_kg: '' }));
            setClients(prev => prev.map(c =>
                c.id === activeClientForUpload ? { ...c, guides: [...c.guides, ...newGuides] } : c
            ));
        }
        e.target.value = null;
        setActiveClientForUpload(null);
    };

    const handleWeightChange = (clientId, guideIndex, rawValue) => {
        let cleanValue = rawValue.replace(/[^\d,]/g, '');
        const parts = cleanValue.split(',');
        if (parts.length > 2) {
            cleanValue = parts[0] + ',' + parts.slice(1).join('');
        }
        if (parts[0].length > 3) {
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        const formattedValue = parts.join(',');

        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                const newGuides = [...c.guides];
                newGuides[guideIndex].weight_kg = formattedValue;
                return { ...c, guides: newGuides };
            }
            return c;
        }));
    };

    const removeClientGuide = (clientId, guideIndex) => {
        setClients(prev => prev.map(c => c.id === clientId
            ? { ...c, guides: c.guides.filter((_, index) => index !== guideIndex) }
            : c
        ));
    };

    const totalWeight = clients.reduce((sum, c) =>
        sum + c.guides.reduce((gSum, g) => gSum + parseLocalNumber(g.weight_kg), 0)
        , 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const driverId = parseInt(truck?.driver?.id);
        const officialId = parseInt(truck?.official?.id);

        if (!driverId || isNaN(driverId)) {
            return onError("El camión debe tener un CHOFER asignado en el sistema antes de salir.");
        }
        if (!officialId || isNaN(officialId)) {
            return onError("El camión debe tener un OFICIAL asignado en el sistema antes de salir.");
        }

        const finalMaterial = formData.material_type === 'Otro'
            ? formData.custom_material.trim()
            : formData.material_type;

        if (!finalMaterial) return onError("Indica el tipo de material.");

        const hasEmptyClients = clients.some(c => !c.name.trim() || c.guides.length === 0);
        if (hasEmptyClients) return onError("Cada destino debe tener un Cliente y al menos una guía adjunta.");

        const hasMissingWeights = clients.some(c => c.guides.some(g => parseLocalNumber(g.weight_kg) <= 0));
        if (hasMissingWeights) return onError("Debes registrar el peso impreso en cada guía. Ej: 5.607,49");

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    const newHistory = [...savedClients];
                    let historyUpdated = false;
                    clients.forEach(c => {
                        const clientName = c.name.trim();
                        if (!newHistory.includes(clientName)) {
                            newHistory.push(clientName);
                            historyUpdated = true;
                        }
                    });
                    if (historyUpdated) localStorage.setItem('client_history', JSON.stringify(newHistory));

                    const uploadPromises = [];
                    clients.forEach(client => {
                        client.guides.forEach((guideObj, gIndex) => {
                            const uploadFormData = new FormData();
                            uploadFormData.append('file', guideObj.file);
                            uploadPromises.push(
                                api.post('/upload/guias_emision', uploadFormData, { headers: { 'Content-Type': 'multipart/form-data' } })
                                    .then(res => ({ clientId: client.id, gIndex, url: res.data.url }))
                            );
                        });
                    });

                    const uploadedResults = await Promise.all(uploadPromises);

                    const destinationsPayload = clients.map(client => {
                        const photosForClient = uploadedResults
                            .filter(r => r.clientId === client.id)
                            .map(r => {
                                const originalGuide = client.guides[r.gIndex];
                                return { photo_url: r.url, weight_kg: parseLocalNumber(originalGuide.weight_kg) };
                            });

                        const finalClientName = client.reference.trim()
                            ? `${client.name.trim()} - ${client.reference.trim()}`
                            : client.name.trim();

                        return {
                            client_name: finalClientName,
                            load_photos: photosForClient
                        };
                    });

                    const payload = {
                        truck_id: parseInt(truck.id),
                        driver_id: driverId,
                        official_id: officialId,
                        material_type: finalMaterial,
                        weight_kg: totalWeight,
                        destinations: destinationsPayload
                    };

                    const travelResponse = await api.post('/travels/', payload);

                    await api.post('/tracking/', {
                        truck_id: parseInt(truck.id),
                        travel_id: travelResponse.data.id,
                        latitude, longitude, speed: 0,
                        device_time: new Date().toISOString(),
                        source: "web_load"
                    });

                    onSuccess();
                } catch (error) {
                    console.error("Detalle del Error:", error);
                    onError("Error al conectar con el servidor para registrar la carga.");
                } finally {
                    setLoading(false);
                }
            },
            () => { setLoading(false); onError("Se requiere acceso al GPS."); },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 overflow-hidden border border-slate-100">
                <div className="p-5 sm:p-7 overflow-y-auto scrollbar-hide">
                    <div className="flex justify-between items-center mb-5 sticky top-0 bg-white z-20 pb-3 border-b border-slate-100">
                        <h3 className="text-xl sm:text-2xl font-black text-atlas-navy tracking-tight uppercase italic">Ruta Multipunto</h3>
                        <button type="button" onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-200 hover:text-atlas-navy transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Carga</label>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_MATERIALS.map(m => (
                                        <button
                                            key={m} type="button" onClick={() => setFormData({ ...formData, material_type: m })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.material_type === m ? 'bg-atlas-navy text-atlas-yellow shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                        >
                                            {formData.material_type === m && <CheckCircle2 className="w-3 h-3 inline-block mr-1 mb-0.5" />} {m}
                                        </button>
                                    ))}
                                    <button
                                        type="button" onClick={() => setFormData({ ...formData, material_type: 'Otro' })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.material_type === 'Otro' ? 'bg-atlas-navy text-atlas-yellow shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        Otro
                                    </button>
                                </div>
                                {formData.material_type === 'Otro' && (
                                    <input
                                        type="text" placeholder="Especificar material..." required
                                        value={formData.custom_material} onChange={e => setFormData({ ...formData, custom_material: e.target.value })}
                                        className="mt-3 w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-atlas-navy focus:ring-2 focus:ring-atlas-navy/20 focus:border-atlas-navy outline-none transition-all"
                                    />
                                )}
                            </div>

                            <div className="shrink-0 md:w-36 flex flex-col justify-center items-center bg-atlas-navy/5 rounded-xl p-3 border border-atlas-navy/10">
                                <span className="text-[9px] font-bold text-atlas-navy uppercase text-center mb-1">Peso Total</span>
                                <span className="text-xl sm:text-2xl font-black text-atlas-navy">
                                    {totalWeight.toLocaleString('es-ES', { maximumFractionDigits: 3 })} <span className="text-sm font-bold">KG</span>
                                </span>
                            </div>
                        </div>

                        <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />

                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Entregas y Guías</h4>
                                <button type="button" onClick={addClient} className="text-[10px] sm:text-xs font-bold text-atlas-navy bg-atlas-navy/5 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all hover:bg-atlas-navy/10 border border-atlas-navy/20 shadow-sm">
                                    <Plus className="w-3 h-3" /> Añadir Cliente
                                </button>
                            </div>

                            <datalist id="client-history">
                                {savedClients.map(c => <option key={c} value={c} />)}
                            </datalist>

                            {clients.map((client, cIndex) => (
                                <div key={client.id} className="bg-white border-2 border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm relative group/client">
                                    {clients.length > 1 && (
                                        <button type="button" onClick={() => removeClient(client.id)} className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10 opacity-0 group-hover/client:opacity-100">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        <div className="flex gap-2">
                                            <div className="bg-atlas-navy/5 p-2.5 rounded-xl border border-atlas-navy/10 flex items-center justify-center shrink-0">
                                                <UserCircle2 className="w-5 h-5 text-atlas-navy" />
                                            </div>
                                            <div className="flex-1 relative">
                                                <label className="text-[8px] font-bold text-slate-400 uppercase absolute left-3 top-1.5 z-10">Cliente {cIndex + 1}</label>
                                                <input
                                                    type="text" list="client-history" required
                                                    value={client.name} onChange={(e) => updateClientField(client.id, 'name', e.target.value)}
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
                                                    value={client.reference} onChange={(e) => updateClientField(client.id, 'reference', e.target.value)}
                                                    placeholder="Ej. Bodega km 13"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pt-5 pb-1.5 px-3 font-bold text-atlas-navy focus:border-atlas-navy focus:ring-2 focus:ring-atlas-navy/20 focus:bg-white text-sm transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Guías del Cliente</label>
                                            <button type="button" onClick={() => triggerPhotoUpload(client.id)} className="text-[10px] font-bold text-atlas-yellow bg-atlas-navy px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 shadow-sm hover:bg-slate-800 transition-colors">
                                                <Camera className="w-3 h-3" /> Subir Guía
                                            </button>
                                        </div>

                                        {client.guides.length === 0 ? (
                                            <div className="text-center py-5 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Sin guías registradas</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {client.guides.map((g, gIndex) => (
                                                    <div key={gIndex} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative flex flex-col group/guide">
                                                        <button type="button" onClick={() => removeClientGuide(client.id, gIndex)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full z-10 shadow-md scale-90 opacity-0 group-hover/guide:opacity-100 transition-opacity">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        <div className="aspect-[4/3] w-full relative bg-atlas-navy">
                                                            <img src={g.preview} className="w-full h-full object-cover opacity-90" alt="Guía" />
                                                        </div>
                                                        <div className="p-1.5 bg-white">
                                                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-atlas-navy/20 focus-within:border-atlas-navy transition-all">
                                                                <Scale className="w-3 h-3 text-slate-400 shrink-0" />
                                                                <input
                                                                    type="text" inputMode="decimal" required
                                                                    value={g.weight_kg}
                                                                    onChange={(e) => handleWeightChange(client.id, gIndex, e.target.value)}
                                                                    placeholder="Ej: 5.607,49"
                                                                    className="w-full text-[11px] sm:text-xs font-black text-atlas-navy border-none bg-transparent p-0 focus:ring-0 text-right outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button disabled={loading} type="submit" className="w-full bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-4 rounded-2xl font-black text-[15px] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                            {loading ? "PROCESANDO..." : <><CheckCircle2 className="w-5 h-5" /> REGISTRAR ({totalWeight.toLocaleString('es-ES', { maximumFractionDigits: 3 })} KG)</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}