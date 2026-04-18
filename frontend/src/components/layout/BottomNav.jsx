import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, CalendarCheck, CalendarOff, DollarSign, Bell } from 'lucide-react';

const adminItems = [
  { label: 'Dashboard', to: '/dashboard',     icon: LayoutDashboard },
  { label: 'Attend.',   to: '/attendance',    icon: CalendarCheck },
  { label: 'Leave',     to: '/leave',         icon: CalendarOff },
  { label: 'Salary',    to: '/salary',        icon: DollarSign },
  { label: 'Alerts',    to: '/notifications', icon: Bell },
];

const teacherItems = [
  { label: 'Dashboard', to: '/dashboard',     icon: LayoutDashboard },
  { label: 'Attend.',   to: '/attendance',    icon: CalendarCheck },
  { label: 'Leave',     to: '/leave',         icon: CalendarOff },
  { label: 'Salary',    to: '/salary',        icon: DollarSign },
  { label: 'Alerts',    to: '/notifications', icon: Bell },
];

export default function BottomNav() {
  const { isAdmin } = useAuth();
  const items = isAdmin ? adminItems : teacherItems;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={20} />
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
