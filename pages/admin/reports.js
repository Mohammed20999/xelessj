import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { supabase, getUser } from '../../lib/supabase';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cleaningLogs, setCleaningLogs] = useState([]);
  const [problemReports, setProblemReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (userError || userData.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      await loadReportsData();
      setUser(currentUser);
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadReportsData = async () => {
    // Load cleaning logs
    const { data: logsData, error: logsError } = await supabase
      .from('cleaning_logs')
      .select(`
        *,
        rooms (room_number, locations (building_name)),
        users (name, email)
      `)
      .order('timestamp', { ascending: false });

    if (logsError) {
      console.error('Error fetching cleaning logs:', logsError);
    } else {
      setCleaningLogs(logsData);
    }

    // Load problem reports
    const { data: reportsData, error: reportsError } = await supabase
      .from('problem_reports')
      .select(`
        *,
        rooms (room_number, locations (building_name)),
        users (name, email)
      `)
      .order('timestamp', { ascending: false });

    if (reportsError) {
      console.error('Error fetching problem reports:', reportsError);
    } else {
      setProblemReports(reportsData);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Cleaning logs sheet
    const logsData = cleaningLogs.map(log => ({
      'Date': new Date(log.timestamp).toLocaleDateString(),
      'Time': new Date(log.timestamp).toLocaleTimeString(),
      'Building': log.rooms?.locations?.building_name || '',
      'Room': log.rooms?.room_number || '',
      'Staff': log.users?.email || '',
      'Status': log.status,
    }));
    const logsSheet = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, logsSheet, 'Cleaning Logs');

    // Problem reports sheet
    const reportsData = problemReports.map(report => ({
      'Date': new Date(report.timestamp).toLocaleDateString(),
      'Time': new Date(report.timestamp).toLocaleTimeString(),
      'Building': report.rooms?.locations?.building_name || '',
      'Room': report.rooms?.room_number || '',
      'Client': report.users?.email || '',
      'Description': report.description,
      'Status': report.status,
    }));
    const reportsSheet = XLSX.utils.json_to_sheet(reportsData);
    XLSX.utils.book_append_sheet(wb, reportsSheet, 'Problem Reports');

    XLSX.writeFile(wb, `xeless-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getFilteredLogs = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (filter) {
      case 'today':
        return cleaningLogs.filter(log => new Date(log.timestamp) >= today);
      case 'week':
        return cleaningLogs.filter(log => new Date(log.timestamp) >= thisWeek);
      case 'month':
        return cleaningLogs.filter(log => new Date(log.timestamp) >= thisMonth);
      default:
        return cleaningLogs;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-xl">{t('loading')}</div>
      </div>
    );
  }

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports')}</h1>
        <div className="flex space-x-4">
          <button
            onClick={exportToExcel}
            className="btn-primary"
          >
            {t('export')} Excel
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
          >
            {t('back')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl mb-2">📋</div>
          <div className="text-2xl font-bold text-primary-600">{cleaningLogs.length}</div>
          <div className="text-gray-600">Total Cleanings</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-2xl font-bold text-warning">{problemReports.length}</div>
          <div className="text-gray-600">Problem Reports</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-success">
            {problemReports.filter(r => r.status === 'resolved').length}
          </div>
          <div className="text-gray-600">Resolved Issues</div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('cleaning_history')}</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">{t('all')}</option>
            <option value="today">{t('today')}</option>
            <option value="week">{t('this_week')}</option>
            <option value="month">{t('this_month')}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('building')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('room')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('staff')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleDateString()}
                    <br />
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.rooms?.locations?.building_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.rooms?.room_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.users?.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {t('cleaned')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('problem_report')}</h2>
        <div className="space-y-4">
          {problemReports.map((report) => (
            <div key={report.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium">
                    {report.rooms?.locations?.building_name} - Room {report.rooms?.room_number}
                  </span>
                  <span className="text-gray-500 ml-2">
                    by {report.users?.email}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  report.status === 'resolved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {t(report.status)}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{report.description}</p>
              <p className="text-sm text-gray-500">
                {new Date(report.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
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