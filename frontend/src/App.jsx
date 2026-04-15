import { lazy, Suspense, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';

// Vistas Estáticas (Carga inmediata)
import Login from './pages/Login';
import Layout from './components/Layout';

// Vistas Dinámicas (Lazy Loading)
const OwnerView = lazy(() => import('./components/dashboard/owner/OwnerView'));
const CrewView = lazy(() => import('./components/dashboard/crew/CrewView'));
const AdminView = lazy(() => import('./components/dashboard/AdminView'));

// Configuración de caché (React Query)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000,
    },
  },
});

const ModuleLoader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 border-t-slate-800"></div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Cargando módulo...</p>
    </div>
  </div>
);

function AppRouter() {
  const { user, impersonatedUser, stopImpersonation, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Iniciando Atlas ERP...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  // PRIORIDAD: Si hay un usuario simulado, usamos ese. Si no, usamos el logueado.
  const activeUser = impersonatedUser || user;

  return (
    <div className="relative">
      {/* BANNER FLOTANTE DE IMPERSONACIÓN */}
      {impersonatedUser && (
        <div className="bg-amber-500 text-white px-6 py-2 flex justify-between items-center text-[10px] font-black uppercase tracking-widest sticky top-0 z-[200] shadow-md animate-in slide-in-from-top-4">
          <span>MODO VISUALIZACIÓN: PANEL DE {impersonatedUser.full_name}</span>
          <button
            onClick={stopImpersonation}
            className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" /> Volver a Panel Admin
          </button>
        </div>
      )}

      <Layout>
        <Suspense fallback={<ModuleLoader />}>
          {activeUser.role === 'owner' && <OwnerView user={activeUser} />}

          {(activeUser.role === 'driver' || activeUser.role === 'official') && (
            <CrewView user={activeUser} />
          )}

          {activeUser.role === 'admin' && <AdminView user={activeUser} />}
        </Suspense>
      </Layout>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}