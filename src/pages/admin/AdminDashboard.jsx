import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayAttendance: 0,
    presentToday: 0,
    absentToday: 0
  });

  useEffect(() => {
    // Check authentication
    const authData = JSON.parse(localStorage.getItem("auth"));
    if (!authData) {
      navigate('/login');
      return;
    }
    
    const role = authData?.profile?.role || authData?.role;
    if (role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    setAdmin(authData.profile || authData.user);
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      // Fetch users
      const usersRes = await fetch('https://attendance-backend-d4vi.onrender.com/users/all', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const users = await usersRes.json();
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceRes = await fetch(
        `https://attendance-backend-d4vi.onrender.com/attendance/all?date=${today}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const attendance = await attendanceRes.json();
      
      const presentToday = attendance.filter(a => !a.is_absent && a.check_in).length;
      const absentToday = attendance.filter(a => a.is_absent).length;
      
      setStats({
        totalUsers: users.length,
        todayAttendance: attendance.length,
        presentToday,
        absentToday
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getToken = () => {
    const authData = JSON.parse(localStorage.getItem("auth"));
    return authData?.session?.access_token || null;
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login');
  };

  if (!admin) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="admin-info">
            <div className="admin-avatar">
              {admin?.profile_url ? (
                <img src={admin.profile_url} alt="Admin" />
              ) : (
                <span>{admin?.name?.charAt(0) || 'A'}</span>
              )}
            </div>
            <div className="admin-details">
              <h3>{admin.name}</h3>
              <p>Administrator</p>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-section">
        <h2>Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-value">{loading ? '...' : stats.totalUsers}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Today's Attendance</h3>
              <p className="stat-value">{loading ? '...' : stats.todayAttendance}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Present Today</h3>
              <p className="stat-value present">{loading ? '...' : stats.presentToday}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <h3>Absent Today</h3>
              <p className="stat-value absent">{loading ? '...' : stats.absentToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            onClick={() => navigate('/admin/attendance/manual')}
            className="action-card"
          >
            <div className="action-icon">✏️</div>
            <h3>Manual Attendance</h3>
            <p>Mark attendance for users</p>
          </button>
          
          <button 
            onClick={() => navigate('/admin/attendance/all')}
            className="action-card"
          >
            <div className="action-icon">📋</div>
            <h3>View All Records</h3>
            <p>See complete attendance history</p>
          </button>
          
          <button 
            onClick={() => navigate('/admin/profile')}
            className="action-card"
          >
            <div className="action-icon">👥</div>
            <h3>Manage Users</h3>
            <p>Add, edit or remove users</p>
          </button>
          
          <button 
            onClick={() => alert('Reports feature coming soon')}
            className="action-card"
          >
            <div className="action-icon">📈</div>
            <h3>Generate Reports</h3>
            <p>Create attendance reports</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <p className="no-activity">
            No recent activity to display
            <br />
            <small>Activity log will appear here</small>
          </p>
        </div>
      </div>
    </div>
  );
}