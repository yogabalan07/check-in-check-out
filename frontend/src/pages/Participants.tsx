import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { participantApi } from '../services/participantApi';
import { hallApi } from '../services/reportApi';
import { Participant, Hall, ImportResult, Attendance } from '../types';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { StatusBadge, FlagBadges } from '../components/ui/StatusBadge';
import { FiUpload, FiDownload, FiPlus, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

interface ParticipantForm {
  registerNumber: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  teamName: string;
  hallName: string;
}

const emptyForm: ParticipantForm = {
  registerNumber: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  year: '',
  teamName: '',
  hallName: '',
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Participants = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [form, setForm] = useState<ParticipantForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<Participant & { attendances?: Attendance[] } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadParticipants = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await participantApi.getAll({ page: p, limit: 10, search: s });
      setParticipants(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants(1, '');
  }, []);

  useEffect(() => {
    hallApi
      .getAll()
      .then((res) => setHalls(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadParticipants(1, search);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (p: Participant) => {
    setEditing(p);
    setForm({
      registerNumber: p.registerNumber,
      name: p.name,
      email: p.email || '',
      phone: p.phone || '',
      department: p.department || '',
      year: p.year || '',
      teamName: p.teamName || '',
      hallName: p.hallName || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.registerNumber.trim() || !form.name.trim()) {
      toast.error('Register number and name are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await participantApi.update(editing.id, form);
        toast.success('Participant updated');
      } else {
        await participantApi.create(form);
        toast.success('Participant added');
      }
      setFormOpen(false);
      loadParticipants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save participant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await participantApi.delete(deleteTarget.id);
      toast.success('Participant deleted');
      setDeleteTarget(null);
      loadParticipants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete participant');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await participantApi.exportCSV(search ? { search } : {});
      downloadBlob(res.data as Blob, 'participants.csv');
      toast.success('CSV downloaded');
    } catch (err: any) {
      toast.error('Failed to export participants');
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const res = await participantApi.import(file);
      const result: ImportResult = res.data.data;
      toast.success(
        `Imported ${result.imported} of ${result.total}. ${result.failed} failed.`
      );
      setImportResult(result);
      loadParticipants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const inputCls =
    'w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Participants</h1>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
          >
            <FiUpload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            <FiPlus className="w-4 h-4" />
            Add Participant
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by register no, name, email or team..."
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : participants.length === 0 ? (
          <EmptyState message="No participants found" />
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
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{p.registerNumber}</td>
                  <td className="py-3 px-4">{p.name}</td>
                  <td className="py-3 px-4">{p.department || '-'}</td>
                  <td className="py-3 px-4">{p.year || '-'}</td>
                  <td className="py-3 px-4">{p.teamName || '-'}</td>
                  <td className="py-3 px-4">{p.hallName || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setDetail(p as any)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View"
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <FiTrash2 />
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
          loadParticipants(p);
        }}
      />

      <Modal
        open={formOpen}
        title={editing ? 'Edit Participant' : 'Add Participant'}
        onClose={() => setFormOpen(false)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Register Number *</label>
            <input
              className={inputCls}
              value={form.registerNumber}
              onChange={(e) => setForm({ ...form, registerNumber: e.target.value })}
              disabled={!!editing}
              placeholder="e.g. 23CS101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              className={inputCls}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. CSE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              className={inputCls}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            >
              <option value="">Select year</option>
              {['1st', '2nd', '3rd', '4th'].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <input
              className={inputCls}
              value={form.teamName}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
              placeholder="Team name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hall</label>
            <select
              className={inputCls}
              value={form.hallName}
              onChange={(e) => setForm({ ...form, hallName: e.target.value })}
            >
              <option value="">No hall</option>
              {halls.map((h) => (
                <option key={h.id} value={h.name}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setFormOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!detail}
        title="Participant Details"
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">Register Number</p>
                <p className="font-semibold font-mono">{detail.registerNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-semibold">{detail.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p>{detail.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p>{detail.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p>{detail.department || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Year</p>
                <p>{detail.year || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Team</p>
                <p>{detail.teamName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hall</p>
                <p>{detail.hallName || '-'}</p>
              </div>
            </div>

            <h4 className="font-semibold mb-3">Attendance History</h4>
            {(detail.attendances || []).length === 0 ? (
              <EmptyState message="No attendance records" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Check-In</th>
                      <th className="text-left py-2 px-2">Check-Out</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 px-2">Hall</th>
                      <th className="text-left py-2 px-2">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.attendances || []).map((a) => (
                      <tr key={a.id} className="border-b">
                        <td className="py-2 px-2">
                          {a.checkInTime
                            ? new Date(a.checkInTime).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                            : '-'}
                        </td>
                        <td className="py-2 px-2">
                          {a.checkOutTime
                            ? new Date(a.checkOutTime).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                            : '-'}
                        </td>
                        <td className="py-2 px-2">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="py-2 px-2">{a.checkInHall || '-'}</td>
                        <td className="py-2 px-2">
                          <FlagBadges isLate={a.isLate} isEarlyCheckout={a.isEarlyCheckout} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!importResult}
        title="CSV Import Results"
        onClose={() => setImportResult(null)}
      >
        {importResult && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold">{importResult.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-xs text-gray-500">Imported</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>

            {importResult.errors.length === 0 ? (
              <EmptyState message="All rows imported successfully" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Row</th>
                      <th className="text-left py-2 px-2">Register Number</th>
                      <th className="text-left py-2 px-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.errors.map((err) => (
                      <tr key={err.row} className="border-b">
                        <td className="py-2 px-2">{err.row}</td>
                        <td className="py-2 px-2 font-mono">{err.registerNumber || '-'}</td>
                        <td className="py-2 px-2 text-red-600">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Participant"
        message={`Are you sure you want to delete ${deleteTarget?.name || ''}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Participants;