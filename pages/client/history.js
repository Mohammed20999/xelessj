import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { supabase, getUser } from '../../lib/supabase';

export default function HistoryPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRoom, setUserRoom] = useState(null);
  const [cleaningHistory, setCleaningHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndLoadHistory();
  }, []);

  const checkUserAndLoadHistory = async () => {
    try {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, assigned_room_id')
        .eq('id', currentUser.id)
        .single();

      if (userError || userData.role !== 'client') {
        router.push('/dashboard');
        return;
      }

      if (userData.assigned_room_id) {
        // Get room details
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select(`
            *,
            locations (building_name)
          `)
          .eq('id', userData.assigned_room_id)
          .single();

        if (!roomError) {
          setUserRoom(roomData);

          // Get cleaning history for this room
          const { data: historyData, error: historyError } = await supabase
            .from('cleaning_logs')
            .select(`
              *,
              users (name, email)
            `)
            .eq('room_id', userData.assigned_room_id)
            .order('timestamp', { ascending: false });

          if (!historyError) {
            setCleaningHistory(historyData);
          }
        }
      }

      setUser(currentUser);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('cleaning_history')}</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          {t('back')}
        </button>
      </div>

      {userRoom && (
        <div className="card">
          <div className="text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-xl font-semibold mb-2">
              {userRoom.locations?.building_name}
            </h2>
            <p className="text-gray-600">
              {t('room')} {userRoom.room_number}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('cleaning_history')}</h2>
        
        {cleaningHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-600">No cleaning history available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cleaningHistory.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-600">✅</span>
                      <span className="font-medium">{t('cleaned')}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('staff')}: {log.users?.email || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={() => router.push('/client/report')}
          className="btn-primary"
        >
          {t('submit_report')}
        </button>
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}