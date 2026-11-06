import { tr } from '../../utils/i18n'
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, ROLE_LABELS } from '../../utils/locale';
import LanguageSwitch from './LanguageSwitch';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarOff,
  Clock, BarChart2, Bell, LogOut
} from 'lucide-react';

const adminNav = [
  { label: tr('මුල් පිටුව'),     to: '/dashboard',     icon: LayoutDashboard },
  { label: tr('ගුරුවරු'),      to: '/teachers',      icon: Users },
  { label: tr('පැමිණීම'),    to: '/attendance',    icon: CalendarCheck },
  { label: tr('නිවාඩු'),         to: '/leave',         icon: CalendarOff },
  { label: tr('කාලසටහන'),     to: '/timetable',     icon: Clock },
  { label: tr('වාර්තා'),       to: '/reports',       icon: BarChart2 },
  { label: tr('දැනුම්දීම්'), to: '/notifications', icon: Bell },
];

const teacherNav = [
  { label: tr('මුල් පිටුව'),     to: '/dashboard',     icon: LayoutDashboard },
  { label: tr('මගේ පැමිණීම'), to: '/attendance',    icon: CalendarCheck },
  { label: tr('මගේ නිවාඩු'),      to: '/leave',         icon: CalendarOff },
  { label: tr('මගේ කාලසටහන'),  to: '/timetable',     icon: Clock },
  { label: tr('දැනුම්දීම්'), to: '/notifications', icon: Bell },
];

export default function Sidebar({ unread = 0 }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const nav = isAdmin ? adminNav : teacherNav;

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>{APP_NAME}</h1>
      </div>

      <nav className="nav-section">
        {nav.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" size={18} />
            {label}
            {to === '/notifications' && unread > 0 && <span className="nav-count">{unread > 99 ? '99+' : unread}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <LanguageSwitch />
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-chip-info">
            <div className="user-chip-name">{user?.name}</div>
            <div className="user-chip-role">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title={tr('ඉවත් වන්න')} aria-label={tr('ඉවත් වන්න')}>
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
