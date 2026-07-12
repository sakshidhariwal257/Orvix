import { useCallback, useEffect, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getUnreadCount } from '../../api/notifications';

export default function AppLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [header, setHeader] = useState({ title: null, subtitle: null });

  const refreshUnread = useCallback(() => {
    getUnreadCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, 30000);
    return () => clearInterval(interval);
  }, [refreshUnread]);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar unreadCount={unreadCount} />
      <div className="flex-1 min-w-0">
        <Topbar title={header.title} subtitle={header.subtitle} unreadCount={unreadCount} refreshUnread={refreshUnread} />
        <main className="p-8">
          <Outlet context={{ setHeader, refreshUnread }} />
        </main>
      </div>
    </div>
  );
}

// Pages call this to set the Topbar's title/subtitle for their route.
export function usePageHeader(title, subtitle) {
  const ctx = useOutletContext();
  useEffect(() => {
    ctx?.setHeader({ title, subtitle });
    return () => ctx?.setHeader({ title: null, subtitle: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle]);
  return ctx;
}
