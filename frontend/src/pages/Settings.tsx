import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsApi } from '../services/settingsApi';
import { hallApi } from '../services/reportApi';
import { HackathonSettings, Hall } from '../types';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const emptySettings: HackathonSettings = {
  hackathonName: '',
  startTime: '09:00',
  endTime: '17:00',
  timezone: 'Asia/Kolkata',
};

const Settings = () => {
  const [settings, setSettings] = useState<HackathonSettings>(emptySettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [halls, setHalls] = useState<Hall[]>([]);
  const [hallsLoading, setHallsLoading] = useState(true);

  const [hallFormOpen, setHallFormOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [hallForm, setHallForm] = useState({ name: '', location: '' });
  const [hallSaving, setHallSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Hall | null>(null);

  useEffect(() => {
    settingsApi
      .get()
      .then((res) => setSettings(res.data.data))
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to load settings'))
      .finally(() => setSettingsLoading(false));

    hallApi
      .getAll()
      .then((res) => setHalls(res.data.data || []))
      .catch(() => {})
      .finally(() => setHallsLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    if (!settings.hackathonName.trim()) {
      toast.error('Hackathon name is required');
      return;
    }
    setSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const openCreateHall = () => {
    setEditingHall(null);
    setHallForm({ name: '', location: '' });
    setHallFormOpen(true);
  };

  const openEditHall = (h: Hall) => {
    setEditingHall(h);
    setHallForm({ name: h.name, location: h.location || '' });
    setHallFormOpen(true);
  };

  const handleSaveHall = async () => {
    if (!hallForm.name.trim()) {
      toast.error('Hall name is required');
      return;
    }
    setHallSaving(true);
    try {
      if (editingHall) {
        await hallApi.update(editingHall.id, hallForm);
        toast.success('Hall updated');
      } else {
        await hallApi.create(hallForm);
        toast.success('Hall added');
      }
      setHallFormOpen(false);
      const res = await hallApi.getAll();
      setHalls(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save hall');
    } finally {
      setHallSaving(false);
    }
  };

  const handleDeleteHall = async () => {
    if (!deleteTarget) return;
    try {
      await hallApi.delete(deleteTarget.id);
      toast.success('Hall deleted');
      setDeleteTarget(null);
      const res = await hallApi.getAll();
      setHalls(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete hall');
    }
  };

  const inputCls =
    'w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none';

  if (settingsLoading || hallsLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Hackathon Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hackathon Name
              </label>
              <input
                className={inputCls}
                value={settings.hackathonName}
                onChange={(e) =>
                  setSettings({ ...settings, hackathonName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  className={inputCls}
                  value={settings.startTime}
                  onChange={(e) =>
                    setSettings({ ...settings, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  className={inputCls}
                  value={settings.endTime}
                  onChange={(e) =>
                    setSettings({ ...settings, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <input
                className={inputCls}
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
                placeholder="e.g. Asia/Kolkata"
              />
            </div>
            <p className="text-xs text-gray-500">
              Check-ins after the start time are marked LATE. Check-outs before the end
              time are marked EARLY OUT. Late/early detection uses the timezone above.
            </p>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Halls</h2>
            <button
              onClick={openCreateHall}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Add Hall
            </button>
          </div>
          {halls.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No halls configured yet</p>
          ) : (
            <div className="space-y-2">
              {halls.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{h.name}</p>
                    {h.location && (
                      <p className="text-sm text-gray-500">{h.location}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditHall(h)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(h)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={hallFormOpen}
        title={editingHall ? 'Edit Hall' : 'Add Hall'}
        onClose={() => setHallFormOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hall Name *
            </label>
            <input
              className={inputCls}
              value={hallForm.name}
              onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
              placeholder="e.g. Hall A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              className={inputCls}
              value={hallForm.location}
              onChange={(e) => setHallForm({ ...hallForm, location: e.target.value })}
              placeholder="e.g. Ground Floor"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setHallFormOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveHall}
            disabled={hallSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {hallSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Hall"
        message={`Are you sure you want to delete ${deleteTarget?.name || ''}?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteHall}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Settings;