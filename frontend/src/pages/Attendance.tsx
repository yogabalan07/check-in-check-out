import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi } from '../services/attendanceApi';
import { hallApi } from '../services/reportApi';
import { Attendance, Hall } from '../types';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { StatusBadge, FlagBadges } from '../components/ui/StatusBadge';
import { FiEye } from 'react-icons/fi';

const fmtDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : '-';

const AttendancePage = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [hall, setHall] = useState('');
  const [date, setDate] = useState('');
  const [late, setLate] = useState('');
  const [early, setEarly] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Attendance | null>(null);

  const buildParams = (p: number) => {
    const params: Record<string, any> = { page: p, limit: 10, sortBy, sortOrder };
    if (status) params.status = status;
    if (hall) params.hall = hall;
    if (date) params.date = date;
    if (late) params.late = late;
    if (early) params.early = early;
    if (search) params.search = search;
    return params;
  };

  const loadData = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const res = await attendanceApi.getAll(buildParams(p));
        setAttendances(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    },
    [status, hall, date, late, early, search, sortBy, sortOrder]
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  useEffect(() => {
    hallApi
      .getAll()
      .then((res) => setHalls(res.data.data || []))
      .catch(() => {});
  }, []);

  const selectCls =
    'px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Attendance</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Register no or name..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              className={`${selectCls} w-full`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
            </select>
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
                <option key={h.id} value={h.name}>{h.name}</option>
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Flags</label>
            <div className="flex gap-2">
              <select
                className={`${selectCls} w-full`}
                value={late}
                onChange={(e) => setLate(e.target.value)}
              >
                <option value="">Late: Any</option>
                <option value="true">Late</option>
                <option value="false">On Time</option>
              </select>
              <select
                className={`${selectCls} w-full`}
                value={early}
                onChange={(e) => setEarly(e.target.value)}
              >
                <option value="">Early Out: Any</option>
                <option value="true">Early Out</option>
                <option value="false">Not Early</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 mt-3">
          <label className="text-xs font-medium text-gray-500">Sort by:</label>
          <select
            className={selectCls}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Check-in Date</option>
            <option value="checkInTime">Check-in Time</option>
            <option value="checkOutTime">Check-out Time</option>
          </select>
          <select
            className={selectCls}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : attendances.length === 0 ? (
          <EmptyState message="No attendance records found" />
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
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{a.participant?.registerNumber}</td>
                  <td className="py-3 px-4">{a.participant?.name}</td>
                  <td className="py-3 px-4">
                    {a.checkInTime ? fmtDateTime(a.checkInTime) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {a.checkOutTime ? fmtDateTime(a.checkOutTime) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="py-3 px-4">{a.checkInHall || '-'}</td>
                  <td className="py-3 px-4">
                    <FlagBadges isLate={a.isLate} isEarlyCheckout={a.isEarlyCheckout} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDetail(a)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View"
                      >
                        <FiEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={Math.ceil(total / 10)}
        total={total}
        onPageChange={(p) => {
          setPage(p);
          loadData(p);
        }}
      />

      <Modal
        open={!!detail}
        title="Attendance Details"
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Register Number</p>
              <p className="font-semibold font-mono">{detail.participant?.registerNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-semibold">{detail.participant?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p>{detail.participant?.department || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Year</p>
              <p>{detail.participant?.year || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Check-In Time</p>
              <p>{fmtDateTime(detail.checkInTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Check-Out Time</p>
              <p>{fmtDateTime(detail.checkOutTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Check-In Hall</p>
              <p>{detail.checkInHall || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Check-Out Hall</p>
              <p>{detail.checkOutHall || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <StatusBadge status={detail.status} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Late / Early</p>
              <FlagBadges isLate={detail.isLate} isEarlyCheckout={detail.isEarlyCheckout} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttendancePage;