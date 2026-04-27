import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../../api/axios';
import { BookOpen, Plus, Loader2, Trash2, Calendar, Truck, Tag, Download, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { generateBitacoraPDF } from '../../../../utils/pdfGenerator';

export default function BitacoraTab({ user, showAlert }) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Estado para controlar si el formulario está abierto o cerrado
    const [isFormOpen, setIsFormOpen] = useState(false);

    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());

    const [newNote, setNewNote] = useState({ content: '', category: 'Operación', truck_id: '' });
    const [filterStartDate, setFilterStartDate] = useState(today);
    const [filterEndDate, setFilterEndDate] = useState(today);
    const [filterTruckId, setFilterTruckId] = useState('');

    const { data: trucks = [] } = useQuery({
        queryKey: ['ownerTrucks', user?.id],
        queryFn: async () => (await api.get('/trucks/')).data,
    });

    const { data: notes = [], isLoading: loadingNotes } = useQuery({
        queryKey: ['ownerNotes'],
        queryFn: async () => (await api.get('/notes/')).data,
    });

    const filteredNotes = useMemo(() => {
        let result = [...notes];

        if (filterTruckId) {
            result = result.filter(n => n.truck_id?.toString() === filterTruckId);
        }

        if (filterStartDate && filterEndDate) {
            result = result.filter(n => {
                const date = n.date_recorded.split('T')[0].split(' ')[0];
                return date >= filterStartDate && date <= filterEndDate;
            });
        } else if (filterStartDate) {
            result = result.filter(n => n.date_recorded.startsWith(filterStartDate));
        }

        return result;
    }, [notes, filterStartDate, filterEndDate, filterTruckId]);

    const hasActiveFilters = filterStartDate || filterEndDate || filterTruckId;

    const clearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterTruckId('');
    };

    const createNote = async (e) => {
        e.preventDefault();
        if (!newNote.content.trim()) return showAlert("Error", "La nota no puede estar vacía", "error");

        setIsSubmitting(true);
        try {
            const payload = {
                content: newNote.content,
                category: newNote.category,
                truck_id: newNote.truck_id ? parseInt(newNote.truck_id) : null
            };
            await api.post('/notes/', payload);
            showAlert("Éxito", "Nota guardada en la bitácora.");
            setNewNote({ content: '', category: 'Operación', truck_id: '' });
            setIsFormOpen(false); // Cierra el formulario tras guardar
            queryClient.invalidateQueries(['ownerNotes']);
        } catch (error) {
            showAlert("Error", "No se pudo guardar la nota", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteNote = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta nota?")) return;
        try {
            await api.delete(`/notes/${id}`);
            queryClient.invalidateQueries(['ownerNotes']);
        } catch (error) {
            showAlert("Error", "No se pudo eliminar la nota", "error");
        }
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            await generateBitacoraPDF(
                filteredNotes,
                trucks,
                hasActiveFilters,
                filterStartDate,
                filterEndDate,
                filterTruckId
            );
        } catch (error) {
            console.error("Error generando PDF:", error);
            showAlert("Error", "Ocurrió un problema al generar el documento.", "error");
        } finally {
            setIsDownloading(false);
        }
    };

    const categories = ['Operación', 'Mecánica', 'Administración', 'Incidencia'];
    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'Mecánica': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Incidencia': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Operación': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 mt-4">

            {/* Columna Izquierda: Formulario (Ahora colapsable) */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-24 overflow-hidden transition-all duration-300">

                    {/* Botón Cabecera para abrir/cerrar */}
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className={`w-full p-4 flex items-center justify-between text-xs font-black uppercase tracking-widest transition-colors ${isFormOpen ? 'bg-atlas-navy text-atlas-yellow' : 'bg-white text-atlas-navy hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center gap-2">
                            {isFormOpen ? <BookOpen className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isFormOpen ? 'Registrando Nota...' : 'Nueva Anotación'}
                        </div>
                        {isFormOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {/* Contenido del Formulario */}
                    {isFormOpen && (
                        <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                            <form onSubmit={createNote} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Categoría</label>
                                    <select value={newNote.category} onChange={(e) => setNewNote({ ...newNote, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-atlas-navy focus:outline-none focus:border-atlas-navy transition-colors">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Vincular Unidad (Opcional)</label>
                                    <select value={newNote.truck_id} onChange={(e) => setNewNote({ ...newNote, truck_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-atlas-navy focus:outline-none focus:border-atlas-navy transition-colors">
                                        <option value="">--- Nota General ---</option>
                                        {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} - {t.brand}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Detalle de la nota</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Escribe aquí los detalles..."
                                        value={newNote.content}
                                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-atlas-navy focus:outline-none focus:border-atlas-navy resize-none transition-colors"
                                    ></textarea>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                                        Cancelar
                                    </button>
                                    <button disabled={isSubmitting} type="submit" className="flex-1 bg-atlas-navy text-atlas-yellow py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Columna Derecha: Historial y Filtros */}
            <div className="lg:col-span-2 flex flex-col h-full">
                {/* Barra de Filtros (Fija arriba) */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between mb-3 shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <select value={filterTruckId} onChange={(e) => setFilterTruckId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-[10px] md:text-xs font-bold text-atlas-navy focus:outline-none focus:border-atlas-navy transition-colors">
                            <option value="">Todas las unidades</option>
                            {trucks.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}
                        </select>

                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                            <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="bg-transparent text-[10px] md:text-xs font-bold text-atlas-navy focus:outline-none" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">AL</span>
                            <input type="date" value={filterEndDate} min={filterStartDate} onChange={(e) => setFilterEndDate(e.target.value)} className="bg-transparent text-[10px] md:text-xs font-bold text-atlas-navy focus:outline-none" />
                        </div>

                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="p-1.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 flex items-center justify-center transition-colors" title="Limpiar filtros (Ver todo)">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <button onClick={handleDownloadPDF} disabled={filteredNotes.length === 0 || isDownloading} className="w-full sm:w-auto bg-atlas-navy text-atlas-yellow px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm">
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Descargar PDF
                    </button>
                </div>

                {/* Lista de Notas con Scroll Propio */}
                <div className="flex-1 overflow-y-auto max-h-[65vh] space-y-3 pr-1 hide-scrollbar pb-6">
                    {loadingNotes ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-atlas-yellow w-8 h-8" /></div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="bg-white p-10 rounded-2xl border border-slate-200 border-dashed text-center shadow-sm">
                            <Filter className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                {hasActiveFilters ? "No hay registros para este filtro" : "La bitácora está vacía"}
                            </p>
                        </div>
                    ) : (
                        filteredNotes.map(note => {
                            const linkedTruck = trucks.find(t => t.id === note.truck_id);
                            return (
                                <div key={note.id} className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:border-slate-300">
                                    <button onClick={() => deleteNote(note.id)} className="absolute top-3.5 right-3.5 p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="flex flex-wrap gap-2 mb-3.5">
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getCategoryColor(note.category)}`}>
                                            <Tag className="w-3 h-3" /> {note.category}
                                        </span>
                                        {linkedTruck && (
                                            <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1.5 shadow-sm">
                                                <Truck className="w-3 h-3 text-atlas-navy" /> OP {linkedTruck.plate}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-atlas-navy whitespace-pre-wrap leading-relaxed font-medium">{note.content}</p>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(note.date_recorded.replace(' ', 'T')).toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
}