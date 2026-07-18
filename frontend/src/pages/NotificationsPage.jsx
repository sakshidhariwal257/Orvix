import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../api/notifications';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState } from '../components/common/Misc';
import { NOTIFICATION_COLORS } from '../utils/constants';
import { timeAgo } from '../utils/date';
import { resolveNotificationLink } from '../utils/links';

export default function NotificationsPage() {
  const { refreshUnread } = usePageHeader('Notifications', 'Everything that needs your attention.');
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getNotifications()
      .then(setNotifications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
      refreshUnread?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      refreshUnread?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((list) => list.filter((n) => n._id !== id));
      refreshUnread?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClick = (n) => {
    if (!n.read) handleMarkRead(n._id);
    if (n.link) navigate(resolveNotificationLink(n.link));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button onClick={handleMarkAll} className="btn">Mark all as read</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <Spinner />}

      {!loading && notifications.length === 0 && (
        <EmptyState icon={Bell} title="No notifications" subtitle="You're all caught up." />
      )}

      {!loading && notifications.length > 0 && (
        <div className="card divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] ${
                !n.read ? 'bg-accent/[0.03]' : ''
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-semibold ${
                  NOTIFICATION_COLORS[n.type] || 'bg-white/10 text-text-dim'
                }`}
              >
                {n.type[0]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-text">{n.message}</p>
                <p className="text-[11.5px] text-text-faint mt-0.5">
                  {n.type} · {timeAgo(n.createdAt)}
                </p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
              <button
                onClick={(e) => handleDelete(n._id, e)}
                className="text-text-faint hover:text-red-300 flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
