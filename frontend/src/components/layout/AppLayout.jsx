import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ title, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title={title} />
        <main className="page-content animate-in">{children}</main>
      </div>
    </div>
  );
}
