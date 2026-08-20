import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../services/reportApi';
import { DashboardStats, Attendance } from '../types';
import StatCard from '../components/ui/StatCard';
import { StatusBadge, FlagBadges } from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { FiRefreshCw } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecent(10),
      ]);
      setStats(statsRes.data.data);
      setRecent(recentRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <Spinner />;

  const statCards = [
    { label: 'Total Participants', value: stats?.totalParticipants || 0, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Checked In', value: stats?.checkedIn || 0, color: 'bg-green-500', textColor: 'text-green-600' },
    { label: 'Checked Out', value: stats?.checkedOut || 0, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { label: 'Currently Inside', value: stats?.currentlyInside || 0, color: 'bg-cyan-500', textColor: 'text-cyan-600' },
    { label: 'Absent', value: stats?.absent || 0, color: 'bg-red-500', textColor: 'text-red-600' },
    { label: 'Late Check-Ins', value: stats?.lateCheckIns || 0, color: 'bg-orange-500', textColor: 'text-orange-600' },
    { label: 'Early Check-Outs', value: stats?.earlyCheckOuts || 0, color: 'bg-amber-500', textColor: 'text-amber-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Attendance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Register No</th>
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">Check-In</th>
                <th className="text-left py-3 px-2">Check-Out</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Hall</th>
                <th className="text-left py-3 px-2">Late / Early</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((att) => (
                <tr key={att.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 font-mono">{att.participant?.registerNumber}</td>
                  <td className="py-3 px-2">{att.participant?.name}</td>
                  <td className="py-3 px-2">
                    {att.checkInTime ? new Date(att.checkInTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                  </td>
                  <td className="py-3 px-2">
                    {att.checkOutTime ? new Date(att.checkOutTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={att.status} />
                  </td>
                  <td className="py-3 px-2">{att.checkInHall || '-'}</td>
                  <td className="py-3 px-2">
                    <FlagBadges isLate={att.isLate} isEarlyCheckout={att.isEarlyCheckout} />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message="No attendance records yet" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;