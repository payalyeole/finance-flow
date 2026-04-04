import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', icon: '◈', label: 'Dashboard', roles: ['VIEWER','ANALYST','ADMIN'] },
  { path: '/transactions', icon: '⇄', label: 'Transactions', roles: ['VIEWER','ANALYST','ADMIN'] },
  { path: '/users', icon: '◎', label: 'Users', roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = navItems.filter(i => i.roles.includes(user?.role));
  const initials = user?.fullName?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Finance<span>Flow</span></h1>
        <div className="logo-sub">Management System</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {items.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.fullName || user?.username}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  );
}
