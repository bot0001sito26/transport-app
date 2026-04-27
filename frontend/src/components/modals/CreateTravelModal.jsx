import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { X, CheckCircle2, Plus } from 'lucide-react';
import ClientDestinationCard from './components/ClientDestinationCard';
import ConfirmDialog from './ConfirmDialog';

const QUICK_MATERIALS = ["Varios"];

const parseLocalNumber = (val) => {
    if (!val) return 0;
    const cleanStr = String(val).replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
};

export default function CreateTravelModal({ isOpen, onClose, onSuccess, onError, truck }) {
    const [loading, setLoading] = useState(false);
    const [savedClients, setSavedClients] = useState([]);
    const [formData, setFormData] = useState({ material_type: 'Varios', custom_material: '' });

    const [clients, setClients] = useState([]);
    const [expandedClientId, setExpandedClientId] = useState(null);
    const [clientToDelete, setClientToDelete] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const history = JSON.parse(localStorage.getItem('client_history') || '[]');
            setSavedClients(history);
            setFormData({ material_type: 'Varios', custom_material: '' });

            const initialId = Date.now();
            setClients([{ id: initialId, name: '', reference: '', packingListFile: null, packingListPreview: '', guideFile: null, guidePreview: '', guideWeight: '' }]);
            setExpandedClientId(initialId);
            setClientToDelete(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const addClient = () => {
        const newId = Date.now();
        setClients(prev => [...prev, { id: newId, name: '', reference: '', packingListFile: null, packingListPreview: '', guideFile: null, guidePreview: '', guideWeight: '' }]);
        setExpandedClientId(newId);
    };

    const confirmRemoveClient = (id) => {
        if (clients.length === 1) return;
        setClientToDelete(id);
    };

    const executeRemoveClient = () => {
        if (!clientToDelete) return;
        setClients(prev => prev.filter(c => c.id !== clientToDelete));
        if (expandedClientId === clientToDelete) setExpandedClientId(null);
        setClientToDelete(null);
    };

    const toggleExpand = (id) => setExpandedClientId(expandedClientId === id ? null : id);

    const updateClientField = (id, field, value) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handlePackingListChange = (clientId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, packingListFile: file, packingListPreview: URL.createObjectURL(file) } : c));
        e.target.value = null;
    };

    const handleRemovePackingList = (clientId) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, packingListFile: null, packingListPreview: '' } : c));
    };

    const handleGuideChange = (clientId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, guideFile: file, guidePreview: URL.createObjectURL(file), guideWeight: '' } : c));
        e.target.value = null;
    };

    const handleRemoveGuide = (clientId) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, guideFile: null, guidePreview: '', guideWeight: '' } : c));
    };

    const handleWeightChange = (clientId, rawValue) => {
        let cleanValue = rawValue.replace(/[^\d,]/g, '');
        const parts = cleanValue.split(',');
        if (parts.length > 2) cleanValue = parts[0] + ',' + parts.slice(1).join('');
        if (parts[0].length > 3) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        const formattedValue = parts.join(',');

        setClients(prev => prev.map(c => c.id === clientId ? { ...c, guideWeight: formattedValue } : c));
    };

    const totalWeight = clients.reduce((sum, c) => sum + parseLocalNumber(c.guideWeight), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const driverId = parseInt(truck?.driver?.id);
        const officialId = parseInt(truck?.official?.id);
        const extraOfficialId = truck?.extra_official?.id ? parseInt(truck.extra_official.id) : null;

        if (!driverId || isNaN(driverId)) return onError("El camión debe tener un CHOFER asignado.");
        if (!officialId || isNaN(officialId)) return onError("El camión debe tener un OFICIAL asignado.");

        const finalMaterial = formData.material_type === 'Otro' ? formData.custom_material.trim() : formData.material_type;
        if (!finalMaterial) return onError("Indica el tipo de material.");

        const hasEmptyClients = clients.some(c => !c.name.trim() || !c.guideFile);
        if (hasEmptyClients) return onError("Cada destino debe tener un Cliente y su respectiva guía.");

        const hasMissingWeights = clients.some(c => parseLocalNumber(c.guideWeight) <= 0);
        if (hasMissingWeights) return onError("Debes registrar el peso impreso en todas las guías.");

        const hasMissingPackingLists = clients.some(c => !c.packingListFile);
        if (hasMissingPackingLists) return onError("Falta subir la Lista de Embarque en al menos un cliente.");

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

                    // Subir Listas
                    const packPromises = clients.map(client => {
                        const form = new FormData();
                        form.append('file', client.packingListFile);
                        return api.post('/upload/lista_embarque', form, { headers: { 'Content-Type': 'multipart/form-data' } })
                            .then(res => ({ clientId: client.id, url: res.data.url }));
                    });
                    const uploadedPacks = await Promise.all(packPromises);

                    // Subir Guías Únicas
                    const uploadPromises = clients.map(client => {
                        const formData = new FormData();
                        formData.append('file', client.guideFile);
                        return api.post('/upload/guias_emision', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                            .then(res => ({ clientId: client.id, url: res.data.url }));
                    });
                    const uploadedGuides = await Promise.all(uploadPromises);

                    const destinationsPayload = clients.map(client => {
                        const packUrl = uploadedPacks.find(p => p.clientId === client.id).url;
                        const guideUrl = uploadedGuides.find(g => g.clientId === client.id).url;
                        const finalClientName = client.reference.trim() ? `${client.name.trim()} - ${client.reference.trim()}` : client.name.trim();

                        return {
                            client_name: finalClientName,
                            packing_list_url: packUrl,
                            load_photos: [{ photo_url: guideUrl, weight_kg: parseLocalNumber(client.guideWeight) }]
                        };
                    });

                    const payload = {
                        truck_id: parseInt(truck.id), driver_id: driverId, official_id: officialId,
                        extra_official_id: extraOfficialId, material_type: finalMaterial, weight_kg: totalWeight,
                        destinations: destinationsPayload
                    };

                    const travelResponse = await api.post('/travels/', payload);

                    await api.post('/tracking/', {
                        truck_id: parseInt(truck.id), travel_id: travelResponse.data.id, latitude, longitude, speed: 0,
                        device_time: new Date().toISOString(), source: "web_load"
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
        <>
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-100 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
                <div className="bg-white w-full max-w-2xl rounded-4xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 overflow-hidden border border-slate-100">

                    <div className="flex justify-between items-center p-5 sm:px-7 sm:py-5 border-b border-slate-100 bg-white z-20 shrink-0 shadow-sm">
                        <h3 className="text-xl sm:text-2xl font-black text-atlas-navy tracking-tight uppercase italic">Ruta Multipunto</h3>
                        <button type="button" onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-200 hover:text-atlas-navy transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-5 sm:p-7 overflow-y-auto scrollbar-hide flex-1">
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

                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Entregas y Documentos</h4>
                                    <button type="button" onClick={addClient} className="text-[10px] sm:text-xs font-bold text-atlas-navy bg-atlas-navy/5 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all hover:bg-atlas-navy/10 border border-atlas-navy/20 shadow-sm">
                                        <Plus className="w-3 h-3" /> Añadir Cliente
                                    </button>
                                </div>

                                <datalist id="client-history">
                                    {savedClients.map(c => <option key={c} value={c} />)}
                                </datalist>

                                {clients.map((client, cIndex) => (
                                    <ClientDestinationCard
                                        key={client.id}
                                        client={client}
                                        index={cIndex}
                                        canRemove={clients.length > 1}
                                        isExpanded={expandedClientId === client.id}
                                        onToggle={() => toggleExpand(client.id)}
                                        onRemoveClient={confirmRemoveClient}
                                        onUpdateField={updateClientField}
                                        onPackingListChange={handlePackingListChange}
                                        onRemovePackingList={handleRemovePackingList}
                                        onGuideChange={handleGuideChange}
                                        onRemoveGuide={handleRemoveGuide}
                                        onWeightChange={handleWeightChange}
                                    />
                                ))}
                            </div>

                            <button disabled={loading} type="submit" className="w-full bg-atlas-navy hover:bg-slate-800 text-atlas-yellow py-4 rounded-2xl font-black text-[15px] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6">
                                {loading ? "PROCESANDO..." : <><CheckCircle2 className="w-5 h-5" /> REGISTRAR ({totalWeight.toLocaleString('es-ES', { maximumFractionDigits: 3 })} KG)</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!clientToDelete}
                title="¿Eliminar Cliente?"
                message="Esta acción descartará las guías y la lista de embarque de este destino."
                onClose={() => setClientToDelete(null)}
                onConfirm={executeRemoveClient}
            />
        </>
    );
}