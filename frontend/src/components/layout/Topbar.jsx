import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title }) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      <button className="notif-btn" onClick={() => navigate('/notifications')} title="Notifications">
        <Bell size={18} />
        <span className="notif-dot" />
      </button>
    </header>
  );
}
