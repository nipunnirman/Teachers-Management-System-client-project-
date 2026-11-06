import { tr } from '../../utils/i18n'
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../../utils/locale';

export default function Topbar({ unread = 0 }) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <span className="topbar-title">{APP_NAME}</span>
      <button
        className="notif-btn"
        onClick={() => navigate('/notifications')}
        aria-label={unread > 0 ? tr('දැනුම්දීම්, නොකියවූ {count}ක්', { count: unread }) : tr('දැනුම්දීම්')}
      >
        <Bell size={21} />
        {unread > 0 && <span className="notif-dot" />}
      </button>
    </header>
  );
}
