import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import { useUnreadCount } from './useUnreadCount';
import { APP_NAME } from '../../utils/locale';
import { syncPushLanguage } from '../../utils/push';

export default function AppLayout({ title, children }) {
  const unread = useUnreadCount();

  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);

  useEffect(() => { syncPushLanguage(); }, []);

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
