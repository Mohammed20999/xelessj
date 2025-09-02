import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { supabase, getUser } from '../../lib/supabase';

export default function ReportPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRoom, setUserRoom] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkUserAndLoadRoom();
  }, []);

  const checkUserAndLoadRoom = async () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !userRoom) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('problem_reports')
        .insert([
          {
            client_id: user.id,
            room_id: userRoom.id,
            description: description.trim(),
            status: 'open',
            timestamp: new Date().toISOString(),
          }
        ]);

      if (error) {
        console.error('Error submitting report:', error);
        alert(t('error'));
      } else {
        setSuccess(true);
        setDescription('');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-xl">{t('loading')}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-success mb-4">
          {t('report_submitted')}
        </h2>
        <p className="text-gray-600">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('problem_report')}</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-secondary"
        >
          {t('back')}
        </button>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">{t('submit_report')}</h2>
          {userRoom && (
            <p className="text-gray-600">
              {userRoom.locations?.building_name} - {t('room')} {userRoom.room_number}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('description')}
            </label>
            <textarea
              id="description"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Describe the cleaning issue..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="btn-primary w-full"
          >
            {submitting ? t('loading') : t('submit_report')}
          </button>
        </form>
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