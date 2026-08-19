import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { reportApi, hallApi } from '../services/reportApi';
import { Attendance, Participant, Hall } from '../types';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { StatusBadge, FlagBadges } from '../components/ui/StatusBadge';
import { FiDownload, FiFileText } from 'react-icons/fi';

const REPORT_TYPES = [
  { value: '', label: 'All Attendance' },
  { value: 'currently-inside', label: 'Currently Inside' },
  { value: 'checked-out', label: 'Checked Out' },
  { value: 'absent', label: 'Absent Participants' },
  { value: 'late', label: 'Late Check-Ins' },
  { value: 'early-checkout', label: 'Early Check-Outs' },
];

const fmtDT = (value?: string) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '-';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [hall, setHall] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [halls, setHalls] = useState<Hall[]>([]);
  const [rows, setRows] = useState<(Attendance | Participant)[]>([]);
  const [loading, setLoading] = useState(false);

  const filters = () => {
    const params: Record<string, any> = {};
    if (type) params.type = type;
    if (date) params.date = date;
    if (hall) params.hall = hall;
    if (department) params.department = department;
    if (year) params.year = year;
    return params;
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportApi.getAttendance(filters());
      setRows(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load report');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [type, date, hall, department, year]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    hallApi
      .getAll()
      .then((res) => setHalls(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const res =
        format === 'csv'
          ? await reportApi.downloadCSV(filters())
          : await reportApi.downloadExcel(filters());
      const suffix = format === 'csv' ? 'csv' : 'xlsx';
      downloadBlob(res.data as Blob, `attendance-report.${suffix}`);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (err: any) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const isAbsent = type === 'absent';
  const absentRows = isAbsent ? (rows as Participant[]) : [];
  const attRows = !isAbsent ? (rows as Attendance[]) : [];

  const selectCls =
    'px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Report Type</label>
            <select
              className={`${selectCls} w-full`}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              className={`${selectCls} w-full`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hall</label>
            <select
              className={`${selectCls} w-full`}
              value={hall}
              onChange={(e) => setHall(e.target.value)}
            >
              <option value="">All Halls</option>
              {halls.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
            <input
              type="text"
              className={`${selectCls} w-full`}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. CSE"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select
              className={`${selectCls} w-full`}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">All Years</option>
              {['1st', '2nd', '3rd', '4th'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={loadReport}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          >
            <FiFileText className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : isAbsent ? (
          absentRows.length === 0 ? (
            <EmptyState message="No participants found for this report" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Register No</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-left py-3 px-4">Year</th>
                  <th className="text-left py-3 px-4">Team</th>
                  <th className="text-left py-3 px-4">Hall</th>
                </tr>
              </thead>
              <tbody>
                {absentRows.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono">{p.registerNumber}</td>
                    <td className="py-3 px-4">{p.name}</td>
                    <td className="py-3 px-4">{p.department || '-'}</td>
                    <td className="py-3 px-4">{p.year || '-'}</td>
                    <td className="py-3 px-4">{p.teamName || '-'}</td>
                    <td className="py-3 px-4">{p.hallName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : attRows.length === 0 ? (
          <EmptyState message="No records found for this report" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Register No</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Check-In</th>
                <th className="text-left py-3 px-4">Check-Out</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Hall</th>
                <th className="text-left py-3 px-4">Late / Early</th>
              </tr>
            </thead>
            <tbody>
              {attRows.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{a.participant?.registerNumber}</td>
                  <td className="py-3 px-4">{a.participant?.name}</td>
                  <td className="py-3 px-4">{a.checkInTime ? fmtDT(a.checkInTime) : '-'}</td>
                  <td className="py-3 px-4">{a.checkOutTime ? fmtDT(a.checkOutTime) : '-'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="py-3 px-4">{a.checkInHall || '-'}</td>
                  <td className="py-3 px-4">
                    <FlagBadges isLate={a.isLate} isEarlyCheckout={a.isEarlyCheckout} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;