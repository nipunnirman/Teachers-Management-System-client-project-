import { tr } from '../../utils/i18n'
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarOff,
  Clock, Bell, Camera, BarChart2, Menu, LogOut, UserCheck, CalendarDays, Settings, UserRound,
} from 'lucide-react';
import { ROLE_LABELS } from '../../utils/locale';
import LanguageSwitch from './LanguageSwitch';

const adminTabs = [
  { label: tr('මුල් පිටුව'),       to: '/dashboard',  icon: LayoutDashboard },
  { label: tr('ගුරුවරු'),   to: '/teachers',   icon: Users },
  { label: tr('පැමිණීම'), to: '/attendance', icon: CalendarCheck },
  { label: tr('නිවාඩු'),      to: '/leave',      icon: CalendarOff },
];
const adminMore = [
  { label: tr('කාලසටහන'), to: '/timetable', icon: Clock },
  { label: tr('ආදේශක'), to: '/relief', icon: UserCheck },
  { label: tr('වාර්තා'), to: '/reports', icon: BarChart2 },
  { label: tr('දින දර්ශනය'), to: '/calendar', icon: CalendarDays },
  { label: tr('දැනුම්දීම්'), to: '/notifications', icon: Bell },
  { label: tr('මගේ පැතිකඩ'), to: '/profile', icon: UserRound },
  { label: tr('සැකසුම්'), to: '/settings', icon: Settings },
];

const teacherTabs = [
  { label: tr('මුල් පිටුව'),       to: '/dashboard',  icon: LayoutDashboard },
  { label: tr('පැමිණීම'), to: '/attendance', icon: CalendarCheck },
  { label: tr('ස්කෑන්'),       to: '/attendance?scan=true', icon: Camera, primary: true },
  { label: tr('කාලසටහන'),  to: '/timetable',  icon: Clock },
];
const teacherMore = [
  { label: tr('මගේ නිවාඩු'), to: '/leave', icon: CalendarOff },
  { label: tr('දින දර්ශනය'), to: '/calendar', icon: CalendarDays },
  { label: tr('දැනුම්දීම්'), to: '/notifications', icon: Bell },
  { label: tr('මගේ පැතිකඩ'), to: '/profile', icon: UserRound },
];

export default function BottomNav({ unread = 0 }) {
  const { user, logout, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = isAdmin ? adminTabs : teacherTabs;
  const more = isAdmin ? adminMore : teacherMore;
  const moreActive = more.some(item => item.to === pathname);
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <nav className="bottom-nav" aria-label={tr('ප්‍රධාන මෙනුව')}>
        <div className="bottom-nav-inner">
          {tabs.map(({ label, to, icon: Icon, primary }) => (
            primary ? (
              <Link key={to} to={to} className="bottom-nav-item primary">
                <span className="bottom-nav-icon"><Icon size={20} /></span>
                <span className="bottom-nav-label">{label}</span>
              </Link>
            ) : (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
              >
                <span className="bottom-nav-icon"><Icon size={20} /></span>
                <span className="bottom-nav-label">{label}</span>
              </NavLink>
            )
          ))}
          <button
            type="button"
            className={`bottom-nav-item${moreActive || moreOpen ? ' active' : ''}`}
            onClick={() => setMoreOpen(open => !open)}
            aria-expanded={moreOpen}
          >
            <span className="bottom-nav-icon"><Menu size={20} /></span>
            <span className="bottom-nav-label">{tr('තවත්')}</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <>
          <div className="sheet-overlay" onClick={() => setMoreOpen(false)} />
          <div className="more-sheet" role="dialog" aria-label={tr('තවත්')}>
            <div className="sheet-handle" />
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div className="user-chip-info">
                <div className="user-chip-name">{user?.name}</div>
                <div className="user-chip-role">{ROLE_LABELS[user?.role] || user?.role}</div>
              </div>
            </div>
            {more.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon className="nav-icon" size={19} />
                {label}
                {to === '/notifications' && unread > 0 && <span className="nav-count">{unread > 99 ? '99+' : unread}</span>}
              </NavLink>
            ))}
            <LanguageSwitch />
            <button
              type="button"
              className="nav-item"
              onClick={handleLogout}
              style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--red)' }}
            >
              <LogOut className="nav-icon" size={19} />
              {tr('ඉවත් වන්න')}
            </button>
          </div>
        </>
      )}
    </>
  );
}
