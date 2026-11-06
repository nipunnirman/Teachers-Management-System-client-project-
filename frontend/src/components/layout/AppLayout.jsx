import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import { useUnreadCount } from './useUnreadCount';

export default function AppLayout({ title, children }) {
  const unread = useUnreadCount();

  useEffect(() => {
    document.title = title ? `${title} · Teachers Management System` : 'Teachers Management System';
  }, [title]);

  return (
    <div className="app-shell">
      <Sidebar unread={unread} />

      <div className="main-area">
        <Topbar unread={unread} />
        <main className="page-content animate-in">{children}</main>
      </div>

      <BottomNav unread={unread} />
    </div>
  );
}
