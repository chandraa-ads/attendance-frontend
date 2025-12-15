import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("auth"))?.profile;

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/attendance', label: 'Attendance', icon: '🕒' },
    { path: '/admin/attendance/manual', label: 'Manual Entry', icon: '✏️' },
    { path: '/admin/attendance/all', label: 'All Records', icon: '📋' },
    { path: '/admin/leave', label: 'Leave Management', icon: '🏖️' },
    { path: '/admin/panel', label: 'Admin Panel', icon: '⚙️' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Portal</h2>
          <div className="admin-info">
            <div className="admin-avatar">
              {admin?.profile_url ? (
                <img src={admin.profile_url} alt="Admin" />
              ) : (
                <span>{admin?.name?.charAt(0) || 'A'}</span>
              )}
            </div>
            <div className="admin-details">
              <h3>{admin?.name || 'Administrator'}</h3>
              <p>{admin?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}