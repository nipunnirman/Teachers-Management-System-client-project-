import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarOff,
  Clock, BarChart2, Bell, LogOut
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard',     to: '/dashboard',     icon: LayoutDashboard },
  { label: 'Teachers',      to: '/teachers',      icon: Users },
  { label: 'Attendance',    to: '/attendance',    icon: CalendarCheck },
  { label: 'Leave',         to: '/leave',         icon: CalendarOff },
  { label: 'Timetable',     to: '/timetable',     icon: Clock },
  { label: 'Reports',       to: '/reports',       icon: BarChart2 },
  { label: 'Notifications', to: '/notifications', icon: Bell },
];

const teacherNav = [
  { label: 'Dashboard',     to: '/dashboard',     icon: LayoutDashboard },
  { label: 'My Attendance', to: '/attendance',    icon: CalendarCheck },
  { label: 'My Leave',      to: '/leave',         icon: CalendarOff },
  { label: 'My Timetable',  to: '/timetable',     icon: Clock },
  { label: 'Notifications', to: '/notifications', icon: Bell },
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
        <h1>Teachers Management System</h1>
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
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-chip-info">
            <div className="user-chip-name">{user?.name}</div>
            <div className="user-chip-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
