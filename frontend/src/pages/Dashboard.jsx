import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import AdminView from '../components/dashboard/AdminView';
import OwnerView from '../components/dashboard/OwnerView';

export default function Dashboard() {
    const { user } = useContext(AuthContext);

    return (
        <Layout>
            {user?.role === 'admin' ? (
                <AdminView />
            ) : user?.role === 'owner' ? (
                <OwnerView user={user} />
            ) : (
                <div className="text-center py-20 text-slate-500">
                    <h2 className="text-2xl font-bold mb-2">Panel de Personal</h2>
                    <p>La vista para Choferes y Oficiales está en construcción.</p>
                </div>
            )}
        </Layout>
    );
}