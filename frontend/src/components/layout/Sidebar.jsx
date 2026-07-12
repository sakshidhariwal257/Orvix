import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Users,
  LayoutGrid,
  ListChecks,
  CalendarDays,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/workspaces', label: 'Workspaces', icon: Boxes },
  { to: '/dashboard/teams', label: 'Teams', icon: Users },
  { to: '/dashboard/boards', label: 'Boards', icon: LayoutGrid },
  { to: '/dashboard/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar({ unreadCount = 0 }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13.5px] font-medium transition-colors ${
      isActive
        ? 'bg-accent/15 text-white'
        : 'text-text-dim hover:bg-white/[0.04] hover:text-text'
    }`;

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-border bg-bg-elevated px-3.5 py-5">
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <span className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center text-white shadow-[0_0_18px_rgba(124,92,255,0.45)]">
          <Layers size={17} />
        </span>
        <span className="text-[17px] font-semibold text-white">Orvix</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        <NavLink to="/dashboard/notifications" className={linkClass}>
          <Bell size={17} />
          <span className="flex-1">Notifications</span>
          {unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10.5px] font-semibold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>
      </nav>

      <div className="flex flex-col gap-1 pt-3 border-t border-border">
        <NavLink to="/dashboard/settings" className={linkClass}>
          <Settings size={17} />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13.5px] font-medium text-text-dim hover:bg-white/[0.04] hover:text-text transition-colors"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  );
}
