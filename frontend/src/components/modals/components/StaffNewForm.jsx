import { User, Lock, CreditCard, Phone, Award } from 'lucide-react';

export default function StaffNewForm({ formData, fieldErrors, isDriver, loading, handleNameChange, handleUsernameChange, handleNumberChange, setFormData, handleSubmit }) {
    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Nombre Completo</label>
                    <User className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                    <input type="text" value={formData.full_name} onChange={handleNameChange} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.full_name ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="Nombre y Apellido" />
                </div>

                <div className="relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Usuario de Acceso</label>
                    <User className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                    <input type="text" value={formData.username} onChange={handleUsernameChange} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.username ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="usuario.apellido" />
                </div>

                <div className="relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Contraseña</label>
                    <Lock className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.password ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="••••••••" />
                </div>

                <div className="relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">DNI / Cédula</label>
                    <CreditCard className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                    <input type="text" inputMode="numeric" value={formData.dni} onChange={e => handleNumberChange('dni', e.target.value, 10)} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.dni ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="0999999999" />
                </div>

                <div className="relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Teléfono</label>
                    <Phone className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                    <input type="text" inputMode="numeric" value={formData.phone} onChange={e => handleNumberChange('phone', e.target.value, 10)} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy ${fieldErrors.phone ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`} placeholder="0912345678" />
                </div>

                {isDriver && (
                    <div className="md:col-span-2 relative group">
                        <label className="text-[9px] font-black text-slate-400 uppercase absolute left-4 top-2 z-10 transition-colors group-focus-within:text-atlas-navy">Licencia</label>
                        <Award className="absolute right-4 top-5 text-slate-300 w-4 h-4 group-focus-within:text-atlas-yellow transition-colors" />
                        <select value={formData.license_type} onChange={e => setFormData({ ...formData, license_type: e.target.value })} className={`w-full px-4 pt-6 pb-2 bg-slate-50 border-2 rounded-xl focus:outline-none transition-all font-bold text-sm text-atlas-navy appearance-none ${fieldErrors.license_type ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-atlas-navy focus:bg-white'}`}>
                            <option value="">Selecciona...</option>
                            <option value="Tipo E">Tipo E (Camiones Pesados)</option>
                            <option value="Tipo G">Tipo G (Maquinaria)</option>
                            <option value="Tipo C">Tipo C (Livianos)</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4 mt-2">
                <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-atlas-navy text-atlas-yellow font-black text-[10px] rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest">
                    {loading ? 'Procesando...' : 'Confirmar Ingreso'}
                </button>
            </div>
        </form>
    );
}