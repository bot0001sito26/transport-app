import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Lock } from 'lucide-react';
import logoAtlas from '../assets/logo_atlas.svg';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [fieldErrors, setFieldErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const { login } = useContext(AuthContext);

    const validateForm = () => {
        const errors = {};
        if (!username.trim()) errors.username = "El usuario es obligatorio";
        if (!password) errors.password = "La contraseña es obligatoria";

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        if (!validateForm()) return;

        try {
            await login(username, password);
        } catch (err) {
            console.error("Error detallado:", err);
            setServerError(err.response?.data?.detail || 'Credenciales incorrectas. Verifica tu usuario y contraseña.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 font-sans px-4 py-8 relative overflow-hidden">

            {/* Decoración de fondo opcional para que se vea más premium */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-atlas-yellow/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-atlas-navy/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md p-8 sm:p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 transition-all z-10 animate-in zoom-in-95 duration-300">

                <div className="text-center mb-10">
                    <div className="mx-auto h-28 mb-6 flex justify-center items-center">
                        <img
                            src={logoAtlas}
                            alt="Atlas Logo"
                            className="h-full w-auto object-contain drop-shadow-sm scale-110"
                        />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Atlas</h2>
                    <p className="text-slate-400 mt-2 text-[10px] font-bold uppercase tracking-[0.2em]">Logistics ERP</p>
                </div>

                {serverError && (
                    <div className="mb-6 p-4 text-xs text-red-700 bg-red-50 border-2 border-red-100 rounded-2xl font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                    {/* Input: Usuario */}
                    <div className="relative group">
                        <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-slate-800">
                            Usuario
                        </label>
                        <User className="absolute right-5 top-7 text-slate-300 w-5 h-5" />
                        <input
                            type="text"
                            className={`w-full px-5 pt-8 pb-3 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all font-bold text-slate-800 ${fieldErrors.username
                                ? 'border-red-100 bg-red-50/30 focus:border-red-300'
                                : 'border-transparent focus:border-slate-200 focus:bg-white'
                                }`}
                            placeholder="admin o empresa123"
                            value={username}
                            onChange={(e) => {
                                // Convertimos directamente a minúsculas todo lo que el usuario escriba
                                setUsername(e.target.value.toLowerCase());
                                if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: null });
                            }}
                        />
                        {fieldErrors.username && (
                            <p className="text-red-500 text-[10px] font-black mt-1.5 ml-2 uppercase animate-in slide-in-from-top-1">
                                {fieldErrors.username}
                            </p>
                        )}
                    </div>

                    {/* Input: Contraseña */}
                    <div className="relative group">
                        <label className="text-[10px] font-black text-slate-400 uppercase absolute left-5 top-3 z-10 transition-colors group-focus-within:text-slate-800">
                            Contraseña
                        </label>
                        <Lock className="absolute right-5 top-7 text-slate-300 w-5 h-5" />
                        <input
                            type="password"
                            className={`w-full px-5 pt-8 pb-3 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all font-bold text-slate-800 ${fieldErrors.password
                                ? 'border-red-100 bg-red-50/30 focus:border-red-300'
                                : 'border-transparent focus:border-slate-200 focus:bg-white'
                                }`}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                            }}
                        />
                        {fieldErrors.password && (
                            <p className="text-red-500 text-[10px] font-black mt-1.5 ml-2 uppercase animate-in slide-in-from-top-1">
                                {fieldErrors.password}
                            </p>
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full px-5 py-4 text-white bg-slate-900 rounded-2xl hover:bg-black active:scale-[0.98] font-black tracking-widest uppercase text-xs transition-all duration-200 shadow-xl shadow-slate-900/20"
                        >
                            Ingresar al Sistema
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}