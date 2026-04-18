import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

export default function AppLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change or resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      {/* Overlay for mobile sidebar */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
      />

      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="main-area">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(s => !s)} />
        <main className="page-content animate-in">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
