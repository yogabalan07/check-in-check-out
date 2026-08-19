import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { qrApi, hallApi } from '../services/reportApi';
import { settingsApi } from '../services/settingsApi';
import { Hall } from '../types';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';
import { FiDownload, FiPrinter } from 'react-icons/fi';

interface QRData {
  type: string;
  url: string;
  qr: string;
}

const QRPage = () => {
  const [checkIn, setCheckIn] = useState<QRData | null>(null);
  const [checkOut, setCheckOut] = useState<QRData | null>(null);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [hall, setHall] = useState('');
  const [hackathonName, setHackathonName] = useState('Hackathon 2026');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    settingsApi
      .get()
      .then((res) => setHackathonName(res.data.data?.hackathonName || 'Hackathon 2026'))
      .catch(() => {});
  }, []);

  const loadQRs = async () => {
    setLoading(true);
    setError('');
    try {
      const [inRes, outRes] = await Promise.all([
        qrApi.generate('check-in', hall || undefined),
        qrApi.generate('check-out', hall || undefined),
      ]);
      setCheckIn(inRes.data.data);
      setCheckOut(outRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQRs();
  }, []);

  useEffect(() => {
    hallApi
      .getAll()
      .then((res) => setHalls(res.data.data || []))
      .catch(() => {});
  }, []);

  const downloadPNG = (qr: QRData | null, name: string) => {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr.qr;
    a.download = name;
    a.click();
    toast.success(`${name} downloaded`);
  };

  const printCard = (title: string, qr: QRData | null, filename: string) => {
    if (!qr) return;
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${title} QR</title>
<style>
  body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
  h1 { font-size: 28px; margin-bottom: 8px; }
  h2 { font-size: 24px; letter-spacing: 4px; margin-bottom: 24px; }
  img { width: 320px; height: 320px; border: 2px solid #eee; border-radius: 8px; }
  p { font-size: 16px; color: #333; }
  .url { font-size: 12px; color: #888; margin-top: 16px; word-break: break-all; }
</style>
</head>
<body>
  <h1>${hackathonName.toUpperCase()}</h1>
  <h2>${title.toUpperCase()}</h2>
  <img src="${qr.qr}" alt="${title} QR" />
  <p>Scan to ${title.toLowerCase()}</p>
  <p class="url">${qr.url}</p>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    printWindow.document.close();
    toast.success(`Printing ${title} QR`);
  };

  const QRCard = ({
    title,
    subtitle,
    qr,
    filename,
  }: {
    title: string;
    subtitle: string;
    qr: QRData | null;
    filename: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center">
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
      {qr ? (
        <>
          <img src={qr.qr} alt={title} className="w-72 h-72 rounded-lg border-2 border-gray-100" />
          <p className="mt-4 text-xs text-gray-500 break-all max-w-full">{qr.url}</p>
        </>
      ) : (
        <div className="w-72 h-72 flex items-center justify-center text-gray-400">Unavailable</div>
      )}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => downloadPNG(qr, filename)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
        >
          <FiDownload className="w-4 h-4" />
          Download PNG
        </button>
        <button
          onClick={() => printCard(title, qr, filename)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
        >
          <FiPrinter className="w-4 h-4" />
          Print
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">QR Codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Print and display these at the event halls. Participants scan to check in/out.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={hall}
            onChange={(e) => setHall(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">General QR</option>
            {halls.map((h) => (
              <option key={h.id} value={h.name}>
                {h.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setCheckIn(null);
              setCheckOut(null);
              loadQRs();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Regenerate
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
          >
            <FiPrinter className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {hall && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 mb-6 text-sm">
          QRs below are hall-specific: scanning appends <code>?hall={hall}</code> so check-ins are
          recorded for <strong>{hall}</strong>.
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={loadQRs} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QRCard
            title="Check-In"
            subtitle={hall ? `Scan to check in at ${hall}` : 'Scan to check in'}
            qr={checkIn}
            filename="check-in-qr.png"
          />
          <QRCard
            title="Check-Out"
            subtitle={hall ? `Scan to check out at ${hall}` : 'Scan to check out'}
            qr={checkOut}
            filename="check-out-qr.png"
          />
        </div>
      )}
    </div>
  );
};

export default QRPage;