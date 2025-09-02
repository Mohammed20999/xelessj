import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { supabase, getUser } from '../lib/supabase';

export default function Dashboard() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndRole();
  }, []);

  const checkUserAndRole = async () => {
    try {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Get user role from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        router.push('/login');
        return;
      }

      setUser(currentUser);
      setUserRole(userData.role);
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-xl">{t('loading')}</div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'staff':
        return <StaffDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-red-600">{t('access_denied')}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('welcome')}, {user?.email}
        </h1>
        <p className="text-gray-600">
          {t('role')}: {t(userRole)}
        </p>
      </div>
      
      {renderDashboard()}
    </div>
  );
}

function AdminDashboard() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const adminActions = [
    { title: t('users'), description: 'Manage users and roles', href: '/admin/users', icon: '👥' },
    { title: t('rooms'), description: 'Manage rooms and buildings', href: '/admin/rooms', icon: '🏢' },
    { title: t('reports'), description: 'View cleaning logs and reports', href: '/admin/reports', icon: '📊' },
    { title: t('generate_qr'), description: 'Generate QR codes for rooms', href: '/admin/qr-codes', icon: '📱' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {adminActions.map((action, index) => (
        <div
          key={index}
          onClick={() => router.push(action.href)}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{action.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
              <p className="text-gray-600">{action.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffDashboard() {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <div className="text-center space-y-8">
      <div className="card max-w-md mx-auto">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-xl font-semibold mb-4">{t('scan_qr')}</h2>
        <p className="text-gray-600 mb-6">
          Scan the QR code on the room to mark it as cleaned
        </p>
        <button
          onClick={() => router.push('/scan')}
          className="btn-success w-full"
        >
          {t('scan_qr')}
        </button>
      </div>
    </div>
  );
}

function ClientDashboard() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const clientActions = [
    { title: t('cleaning_history'), description: 'View your room cleaning history', href: '/client/history', icon: '📋' },
    { title: t('problem_report'), description: 'Report a cleaning issue', href: '/client/report', icon: '⚠️' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {clientActions.map((action, index) => (
        <div
          key={index}
          onClick={() => router.push(action.href)}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{action.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
              <p className="text-gray-600">{action.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}