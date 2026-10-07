import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, FileText, Calendar,
  Bell, User, LogOut, Menu, X, ChevronDown, Clock, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { toast } from '../components/common/Toast';
import logoImg from '../assets/orphicsolution_logo.jpg';

const navItems = [
  { to: '/employee/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/office-attendance', icon: Clock,           label: 'Office Attendance' },
  { to: '/employee/tasks',            icon: CheckSquare,     label: 'My Tasks' },
  { to: '/employee/daily-work',       icon: FileText,        label: 'Submit Work Report' },
  { to: '/employee/work-history',     icon: Clock,           label: 'Report History' },
  { to: '/employee/leaves',           icon: Calendar,        label: 'Apply Leave' },
  { to: '/employee/login-history',    icon: ShieldCheck,     label: 'Login Records' },
  { to: '/employee/notifications',   icon: Bell,            label: 'Notifications' },
  { to: '/employee/profile',         icon: User,            label: 'My Profile' },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch { toast('error', 'Logout failed'); }
  };

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside className="flex flex-col bg-[#7C2D12] w-64 h-full shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-amber-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-md border border-[#F59E0B] shrink-0">
            {!logoError ? (
              <img
                src={logoImg}
                alt="Orphic Solution Logo"
                className="w-full h-full object-contain rounded-lg"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-[#EF7D35] text-white font-bold flex items-center justify-center text-sm">
                O
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-extrabold text-sm tracking-wide truncate">Orphic Solution</p>
            <p className="text-[#F59E0B] text-xs font-semibold truncate">Employee Portal</p>
          </div>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-orange-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto bg-[#F59E0B] text-slate-900 text-xs rounded-full px-2 py-0.5 font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-amber-900/60">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-orange-950/60 border border-orange-800/40">
          <div className="w-8 h-8 bg-[#EF7D35] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-orange-300">
            {user?.name?.[0] || 'E'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-orange-200 text-xs truncate font-mono">{user?.employeeId}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link sidebar-link-inactive w-full text-red-300 hover:text-red-100 hover:bg-red-500/20">
          <LogOut size={18} /><span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#FFFAF5] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full animate-in slide-in-from-left duration-200">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-[#F3DCCB] px-4 md:px-6 py-3 flex items-center gap-3 shrink-0 shadow-xs">
          <button
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-orange-50 transition border border-[#F3DCCB]"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-white rounded-lg p-0.5 lg:hidden border border-[#F59E0B]">
              {!logoError ? (
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} />
              ) : (
                <div className="w-full h-full rounded bg-[#EF7D35] text-white font-bold text-xs flex items-center justify-center">O</div>
              )}
            </div>
            <h1 className="font-bold text-[#1F1410] text-base md:text-lg truncate">OrphicSolution-Employee Portal</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 text-sm text-[#1F1410] hover:text-slate-900 p-1.5 rounded-xl hover:bg-[#FFF4EC] transition"
            >
              <div className="w-8 h-8 bg-[#FFF4EC] rounded-full flex items-center justify-center text-[#DC6422] font-bold text-sm border border-[#FBCBA8]">
                {user?.name?.[0] || 'E'}
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#F3DCCB] py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-[#F3DCCB]">
                  <p className="text-sm font-bold text-[#1F1410] truncate">{user?.name}</p>
                  <p className="text-xs text-[#78655A] truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2 font-medium transition"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#FFFAF5]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
