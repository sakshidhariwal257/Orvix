import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../api/notifications';
import { NOTIFICATION_COLORS } from '../../utils/constants';
import { timeAgo } from '../../utils/date';
import { resolveNotificationLink } from '../../utils/links';

export default function NotificationsDropdown({ unreadCount, refreshUnread }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getNotifications()
      .then((data) => setNotifications(data.slice(0, 5)))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
      refreshUnread();
    } catch {
      // best-effort
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      refreshUnread();
    } catch {
      // best-effort
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((list) => list.filter((n) => n._id !== id));
      refreshUnread();
    } catch {
      // best-effort
    }
  };

  const handleClick = (n) => {
    if (!n.read) handleMarkRead(n._id);
    setOpen(false);
    if (n.link) navigate(resolveNotificationLink(n.link));
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center border border-border bg-white/[0.03] hover:bg-white/[0.06]"
        aria-label="Notifications"
      >
        <Bell size={17} className="text-text-dim" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0d1120] border border-border-strong rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Notifications</span>
            <button onClick={handleMarkAllRead} className="text-[12px] text-accent-2 hover:underline">
              Mark all as read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && <div className="text-center text-text-dim text-xs py-6">Loading…</div>}
            {!loading && notifications.length === 0 && (
              <div className="text-center text-text-dim text-xs py-6">You're all caught up</div>
            )}
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.04] border-b border-border/60 last:border-0 ${
                  !n.read ? 'bg-accent/[0.04]' : ''
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-semibold ${
                    NOTIFICATION_COLORS[n.type] || 'bg-white/10 text-text-dim'
                  }`}
                >
                  {n.type[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] text-text leading-snug">{n.message}</p>
                  <span className="text-[11px] text-text-faint">{timeAgo(n.createdAt)}</span>
                </div>
                <button
                  onClick={(e) => handleDelete(n._id, e)}
                  className="text-text-faint hover:text-red-300 flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate('/dashboard/notifications');
            }}
            className="w-full text-center text-[12.5px] text-accent-2 hover:underline py-3 border-t border-border"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
