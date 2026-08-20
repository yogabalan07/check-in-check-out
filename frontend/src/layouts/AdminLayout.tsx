import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiUsers, FiClock, FiGrid, FiFileText, FiSettings, FiLogOut } from 'react-icons/fi';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/admin/participants', label: 'Participants', icon: FiUsers },
    { path: '/admin/attendance', label: 'Attendance', icon: FiClock },
    { path: '/admin/qr', label: 'QR Codes', icon: FiGrid },
    { path: '/admin/reports', label: 'Reports', icon: FiFileText },
    { path: '/admin/settings', label: 'Settings', icon: FiSettings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-600 p-1" aria-label="Open menu">
          <FiMenu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Hackathon Admin</h1>
        <div className="w-6" />
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:flex lg:min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky lg:top-0 left-0 z-50 w-64 h-screen bg-white shadow-lg flex flex-col transform transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-6 border-b shrink-0">
            <h1 className="text-xl font-bold text-gray-800">Hackathon 2026</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <FiLogOut className="w-5 h-5 shrink-0" />
              <span className="font-medium whitespace-nowrap">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile close button for sidebar */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed top-4 right-4 z-50 bg-white rounded-full p-2 shadow-lg"
          aria-label="Close menu"
        >
          <FiX className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default AdminLayout;