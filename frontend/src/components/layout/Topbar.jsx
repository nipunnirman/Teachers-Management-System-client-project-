import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title, onMenuClick }) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <span className="topbar-title">{title}</span>
      <button className="notif-btn" onClick={() => navigate('/notifications')} title="Notifications">
        <Bell size={18} />
        <span className="notif-dot" />
      </button>
    </header>
  );
}
