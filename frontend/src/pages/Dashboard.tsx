import { useState, useEffect } from 'react';
import { dashboardApi } from '../services/reportApi';
import { DashboardStats, Attendance } from '../types';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <span className="text-white font-bold text-sm">{card.value}</span>
            </div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      att.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {att.status === 'CHECKED_IN' ? 'CHECKED IN' : 'CHECKED OUT'}
                    </span>
                  </td>
                  <td className="py-3 px-2">{att.checkInHall || '-'}</td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {att.isLate && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          LATE
                        </span>
                      )}
                      {att.isEarlyCheckout && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          EARLY OUT
                        </span>
                      )}
                      {!att.isLate && !att.isEarlyCheckout && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          ON TIME
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">No attendance records yet</td>
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
