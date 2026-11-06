import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ unread = 0 }) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <span className="topbar-title">Teachers Management System</span>
      <button
        className="notif-btn"
        onClick={() => navigate('/notifications')}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell size={21} />
        {unread > 0 && <span className="notif-dot" />}
      </button>
    </header>
  );
}
