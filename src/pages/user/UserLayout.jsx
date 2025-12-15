import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import './UserLayout.css';

export default function UserLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("auth"))?.profile;

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login');
  };

  const navItems = [
    { path: '/user/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/user/attendance', label: 'My Attendance', icon: '🕒' },
    { path: '/user/attendance/summary', label: 'Summary', icon: '📊' },
    { path: '/user/leave', label: 'Leave', icon: '🏖️' },
  ];

  return (
    <div className="user-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Employee Portal</h2>
          <div className="user-info">
            <div className="user-avatar">
              {user?.profile_url ? (
                <img src={user.profile_url} alt="User" />
              ) : (
                <span>{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="user-details">
              <h3>{user?.name || 'User'}</h3>
              <p>{user?.employee_id || 'EMP-000'}</p>
              <p className="user-role">{user?.role || 'Employee'}</p>
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