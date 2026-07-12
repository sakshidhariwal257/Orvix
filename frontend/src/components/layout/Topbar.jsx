import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import SearchDropdown from '../search/SearchDropdown';
import NotificationsDropdown from '../notifications/NotificationsDropdown';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Topbar({ title, subtitle, unreadCount, refreshUnread }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between gap-6 px-8 py-5 border-b border-border">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-white truncate">
          {title || `${greeting()}, ${user?.name?.split(' ')[0] || ''} 👋`}
        </h1>
        {subtitle && <p className="text-[13px] text-text-dim mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end">
        <SearchDropdown />
        <NotificationsDropdown unreadCount={unreadCount} refreshUnread={refreshUnread} />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/[0.05]"
          >
            <Avatar name={user?.name} avatarUrl={user?.avatar} size="sm" />
            <span className="text-[13px] font-medium text-text hidden sm:block">{user?.name}</span>
            <ChevronDown size={14} className="text-text-dim" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0d1120] border border-border-strong rounded-lg shadow-xl z-50 py-1.5">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/dashboard/settings');
                }}
                className="w-full text-left px-3.5 py-2 text-[13px] text-text hover:bg-white/[0.05]"
              >
                Profile Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="w-full text-left px-3.5 py-2 text-[13px] text-red-300 hover:bg-white/[0.05]"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
