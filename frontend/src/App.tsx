import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CheckInPage from './pages/CheckInPage';
import CheckOutPage from './pages/CheckOutPage';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import Attendance from './pages/Attendance';
import QRPage from './pages/QRPage';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/check-out" element={<CheckOutPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="participants" element={<Participants />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="qr" element={<QRPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Navigate to="/check-in" replace />} />
        <Route path="*" element={<Navigate to="/check-in" replace />} />
      </Routes>
    </>
  );
}

export default App;
