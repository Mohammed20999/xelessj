import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { supabase, getUser } from '../../lib/supabase';

export default function RoomPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      checkUserAndLoadRoom();
    }
  }, [id]);

  const checkUserAndLoadRoom = async () => {
    try {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (userError || userData.role !== 'staff') {
        router.push('/dashboard');
        return;
      }

      // Get room details
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          locations (building_name)
        `)
        .eq('id', id)
        .single();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        return;
      }

      setUser(currentUser);
      setRoom(roomData);
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const markAsCleaned = async () => {
    if (!user || !room) return;

    setMarking(true);
    try {
      const { error } = await supabase
        .from('cleaning_logs')
        .insert([
          {
            room_id: room.id,
            user_id: user.id,
            status: 'cleaned',
            timestamp: new Date().toISOString(),
          }
        ]);

      if (error) {
        console.error('Error marking room as cleaned:', error);
        alert(t('error'));
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('error'));
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-xl">{t('loading')}</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-xl">{t('room_not_found')}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-primary mt-4"
        >
          {t('back')}
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-success mb-4">
          {t('room_cleaned_success')}
        </h2>
        <p className="text-gray-600">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="card text-center">
        <div className="text-4xl mb-4">🏢</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('room')} {room.room_number}
        </h1>
        <p className="text-gray-600 mb-6">
          {room.locations?.building_name}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">
            {t('staff')}: {user?.email}
          </p>
          <p className="text-sm text-gray-600">
            {t('time')}: {new Date().toLocaleString()}
          </p>
        </div>

        <button
          onClick={markAsCleaned}
          disabled={marking}
          className="btn-success w-full text-xl py-6"
        >
          {marking ? t('loading') : t('mark_cleaned')}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          {t('back')}
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