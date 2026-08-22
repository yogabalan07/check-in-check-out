import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { attendanceApi } from '../services/attendanceApi';

const CheckOutPage = () => {
  const [searchParams] = useSearchParams();
  const hall = searchParams.get('hall') || '';
  const [registerNumber, setRegisterNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  // Ref guard: blocks double clicks / repeated Enter presses that fire before
  // the loading state re-renders. Only one POST can ever be in flight.
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!registerNumber.trim()) {
      toast.error('Please enter your register number');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await attendanceApi.checkOut(registerNumber.trim(), hall || undefined);
      setResult(response.data.data);
      toast.success('Check-Out Successful!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Check-out failed';
      setError(msg);
      toast.error(msg);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const reset = () => {
    setRegisterNumber('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">HACKATHON 2026</h1>
          {hall && <p className="text-purple-200 text-lg">{hall}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">CHECK-OUT</h2>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Register Number
                </label>
                <input
                  type="text"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  placeholder="Enter your register number"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-center font-mono tracking-wider"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !registerNumber.trim()}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-xl font-bold rounded-xl transition-colors duration-200 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking Out...
                  </span>
                ) : (
                  'CHECK OUT'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-4">Check-Out Successful</h3>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-semibold">{result.participant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Register No:</span>
                    <span className="font-semibold font-mono">{result.participant.registerNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-In:</span>
                    <span className="font-semibold">
                      {new Date(result.attendance.checkInTime).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-Out:</span>
                    <span className="font-semibold">
                      {new Date(result.attendance.checkOutTime).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-semibold ${result.attendance.isEarlyCheckout ? 'text-orange-600' : 'text-green-600'}`}>
                      {result.attendance.isEarlyCheckout ? 'EARLY CHECKOUT' : 'ON TIME'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors duration-200"
              >
                Check Another Participant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckOutPage;
