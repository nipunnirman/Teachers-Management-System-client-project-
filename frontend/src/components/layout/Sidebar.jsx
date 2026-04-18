import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarOff,
  DollarSign, Clock, BarChart2, Bell, LogOut, X
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard',     to: '/dashboard',     icon: LayoutDashboard },
  { label: 'Teachers',      to: '/teachers',      icon: Users },
  { label: 'Attendance',    to: '/attendance',    icon: CalendarCheck },
  { label: 'Leave',         to: '/leave',         icon: CalendarOff },
  { label: 'Salary',        to: '/salary',        icon: DollarSign },
  { label: 'Timetable',     to: '/timetable',     icon: Clock },
  { label: 'Reports',       to: '/reports',       icon: BarChart2 },
  { label: 'Notifications', to: '/notifications', icon: Bell },
];

const teacherNav = [
  { label: 'Dashboard',     to: '/dashboard',     icon: LayoutDashboard },
  { label: 'My Attendance', to: '/attendance',    icon: CalendarCheck },
  { label: 'My Leave',      to: '/leave',         icon: CalendarOff },
  { label: 'My Salary',     to: '/salary',        icon: DollarSign },
  { label: 'My Timetable',  to: '/timetable',     icon: Clock },
  { label: 'Notifications', to: '/notifications', icon: Bell },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const nav = isAdmin ? adminNav : teacherNav;

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ')?.map(n => n[0])?.join('')?.slice(0, 2)?.toUpperCase() || 'U';

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* Close button — only visible on mobile */}
      <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <button
          onClick={onClose}
          aria-label="Close menu"
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}
          className="hamburger-btn"
        >
          <X size={18} />
        </button>
        <img
          src="/logo.jpg"
          alt="Kendagolla Secondary School Logo"
          style={{ width: 70, height: 70, objectFit: 'contain', marginBottom: 8 }}
        />
        <h1 style={{ fontSize: '1.1rem', textAlign: 'center', lineHeight: '1.2', margin: 0 }}>
          Kendagolla Secondary School
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: 4 }}>Badulla</p>
      </div>

      <nav className="nav-section">
        <span className="nav-label">Navigation</span>
        {nav.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" size={16} />
            {label}
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
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
