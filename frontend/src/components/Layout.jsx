import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import logoAtlas from '../assets/logo_atlas.svg';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Layout({ children }) {
    const { user, logout } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* --- HEADER PRINCIPAL --- */}
            <header className="bg-atlas-navy text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Izquierda: Logo y Marca */}
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-atlas-yellow rounded-full flex items-center justify-center p-1.5 shadow-sm border border-slate-700">
                                <img src={logoAtlas} alt="Atlas Logo" className="h-full w-full object-contain" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-sm font-bold text-white tracking-wide">ATLAS</h1>
                                <p className="text-[9px] text-atlas-yellow uppercase tracking-[0.2em] font-medium">Logistics ERP</p>
                            </div>
                        </div>

                        {/* Derecha: Usuario y Logout */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-right">
                                <p className="text-xs font-bold text-white max-w-30 sm:max-w-none truncate">
                                    {user?.full_name}
                                </p>
                                <p className="text-[9px] text-atlas-yellow uppercase tracking-widest font-bold">
                                    {user?.role === 'owner' ? 'Propietario' : user?.role === 'chofer' ? 'Operador' : user?.role}
                                </p>
                            </div>

                            {/* Avatar fallback visual */}
                            <div className="hidden sm:flex h-9 w-9 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
                                <UserIcon className="w-4 h-4 text-slate-300" />
                            </div>

                            <div className="w-px h-6 bg-slate-700 mx-1"></div>

                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 group"
                                title="Cerrar Sesión"
                            >
                                <LogOut className="w-5 h-5 group-active:scale-95 transition-transform" />
                                <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- CONTENIDO PRINCIPAL --- */}
            {/* Limitamos el ancho a 7xl para que en pantallas gigantes no se deforme */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}