// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../assets/styles/AdminDashboard.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Reportss from './Reports';
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    total_users: 0,
    present_today: 0,
    absent_today: 0,
    checked_in_today: 0,
    checked_out_today: 0,
    pending_today: 0,
    today_attendance: 0
  });
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const API_BASE_URL = 'https://attendance-backend-d4vi.onrender.com';
// Handle logout
const handleLogout = async () => {
  try {
    // Get the current auth data
    const authData = localStorage.getItem('auth');
    if (!authData) {
      localStorage.removeItem('auth');
      navigate('/login');
      return;
    }

    const parsedAuth = JSON.parse(authData);
    const token = parsedAuth.session?.access_token;

    // If using Supabase, you might want to call signout endpoint
    if (token && API_BASE_URL.includes('supabase')) {
      try {
        await fetch(`${API_BASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
      } catch (error) {
        console.log('Logout API call failed, continuing with client logout');
      }
    }

    // Clear all localStorage items
    localStorage.removeItem('auth');
    
    // Clear any other related items
    const itemsToRemove = ['user', 'token', 'access_token', 'refresh_token'];
    itemsToRemove.forEach(item => localStorage.removeItem(item));

    // Navigate to login page
    navigate('/login');
    
    // Force reload to clear any state
    window.location.href = '/login';
    
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout anyway
    localStorage.removeItem('auth');
    navigate('/login');
  }
};
  // Quick Actions Data
  const quickActions = [
    {
      id: 1,
      title: 'Manual Attendance',
      description: 'Mark attendance for users',
      icon: '📝',
      path: '/admin/attendance/manual',
      color: '#3b82f6'
    },
    {
      id: 2,
      title: 'All Records',
      description: 'Complete attendance history',
      icon: '📊',
      path: '/admin/attendance/all',
      color: '#10b981'
    },
    {
      id: 3,
      title: 'Manage Users',
      description: 'Add, edit or remove users',
      icon: '👥',
      path: '/admin/profile',
      color: '#8b5cf6'
    },
   
  ];

  // Handle quick action click
  const handleQuickActionClick = (path) => {
    navigate(path);
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) throw new Error('No authentication data found');

      const parsedAuth = JSON.parse(authData);
      const token = parsedAuth.session?.access_token || parsedAuth.access_token || parsedAuth.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/attendance/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      setDashboardStats(data);
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data for testing
      return {
        total_users: 50,
        present_today: 35,
        absent_today: 10,
        checked_in_today: 5,
        checked_out_today: 30,
        pending_today: 5,
        today_attendance: 40
      };
    }
  };

  // Fetch weekly summary
  const fetchWeeklySummary = async () => {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) throw new Error('No authentication data found');

      const parsedAuth = JSON.parse(authData);
      const token = parsedAuth.session?.access_token || parsedAuth.access_token || parsedAuth.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get dates for last 7 days
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // Use mock data for now to avoid API errors
      const dailyData = dates.map((date, index) => {
        const percentages = [85, 90, 65, 95, 80, 70, 50];
        const counts = [42, 45, 32, 47, 40, 35, 25];

        return {
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          date: date,
          percentage: percentages[index] || 50,
          count: counts[index] || 25
        };
      });

      setWeeklySummary(dailyData);
      return dailyData;
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      // Return mock weekly data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const mockData = days.map((day, index) => ({
        day: day,
        date: `2024-12-${String(index + 16).padStart(2, '0')}`,
        percentage: [50, 65, 80, 95, 85, 70, 60][index],
        count: [25, 32, 40, 47, 42, 35, 30][index]
      }));
      setWeeklySummary(mockData);
      return mockData;
    }
  };

  // Load all data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await fetchDashboardStats();
      await fetchWeeklySummary();
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(loadDashboardData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate weekly average
  const calculateWeeklyAverage = () => {
    if (weeklySummary.length === 0) return 0;
    const sum = weeklySummary.reduce((acc, day) => acc + day.percentage, 0);
    return Math.round(sum / weeklySummary.length);
  };

  // Find best day
  const findBestDay = () => {
    if (weeklySummary.length === 0) return { day: 'N/A', percentage: 0 };
    const bestDay = weeklySummary.reduce((max, day) =>
      day.percentage > max.percentage ? day : max
    );
    return {
      day: bestDay.day,
      percentage: bestDay.percentage
    };
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
    <div className="dashboard-header">
  <div className="header-content">
    <h1>{getGreeting()}, {user?.name || 'Admin'}</h1>
    <p className="subtitle">Welcome to Attendance Management System</p>
  </div>
  <div className="header-right">
    <div className="user-profile">
      <div className="user-avatar">
        {user?.name?.charAt(0) || 'A'}
      </div>
      <div className="user-info">
        <span className="user-name">{user?.name || 'Admin'}</span>
        <span className="user-role">Administrator</span>
      </div>
     <button
  className="logout-btn-icon"
  onClick={handleLogout}
  title="Logout"
>
  <FontAwesomeIcon icon={faRightFromBracket} />
</button>
    </div>
  </div>
</div>


      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Employees</h3>
            <div className="stat-value">{dashboardStats.total_users}</div>
            <div className="stat-trend">All active users</div>
          </div>
        </div>

        <div className="stat-card present-today">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Present Today</h3>
            <div className="stat-value">{dashboardStats.present_today}</div>
            <div className="stat-trend">
              {dashboardStats.total_users > 0
                ? `${Math.round((dashboardStats.present_today / dashboardStats.total_users) * 100)}% attendance`
                : '0% attendance'}
            </div>
          </div>
        </div>

        <div className="stat-card absent-today">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>Absent Today</h3>
            <div className="stat-value">{dashboardStats.absent_today}</div>
            <div className="stat-trend">Marked absent</div>
          </div>
        </div>

        <div className="stat-card checked-in">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>Currently Working</h3>
            <div className="stat-value">{dashboardStats.checked_in_today}</div>
            <div className="stat-trend">Active now</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Column - Quick Actions */}
        <div className="quick-actions-section">
          <div className="section-header">
            <h2>🚀 Quick Actions</h2>
            <span className="section-subtitle">Manage your attendance system</span>
          </div>

          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <div
                key={action.id}
                className="quick-action-card"
                onClick={() => handleQuickActionClick(action.path)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className="quick-action-icon"
                  style={{ backgroundColor: `${action.color}20`, color: action.color }}
                >
                  {action.icon}
                </div>
                <div className="quick-action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                <div className="quick-action-arrow">
                  <span style={{ color: action.color }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Weekly Summary */}
        <div className="weekly-summary">
          <div className="section-header">
            <h2>📈 Weekly Summary</h2>
            <span className="date-range">Last 7 days</span>
          </div>

          {/* Summary Stats */}
          <div className="summary-stats">
            <div className="summary-stat">
              <h4>Weekly Average</h4>
              <div className="stat-value-large">
                {calculateWeeklyAverage()}%
              </div>
              <div className="stat-progress">
                <div
                  className="progress-bar"
                  style={{ width: `${calculateWeeklyAverage()}%` }}
                ></div>
              </div>
            </div>

            <div className="summary-stat">
              <h4>Best Day</h4>
              <div className="stat-value-large">
                {findBestDay().percentage}%
              </div>
              <div className="stat-day">{findBestDay().day}</div>
            </div>

            <div className="summary-stat">
              <h4>Total Present</h4>
              <div className="stat-value-large">{dashboardStats.present_today}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>

          {/* Daily Chart */}
          <div className="daily-chart">
            <h4>Daily Attendance Trend</h4>
            <div className="chart-bars">
              {weeklySummary.map((day, index) => {
                const date = new Date(day.date);
                const isSunday = date.getDay() === 0; // 0 = Sunday

                return (
                  <div key={index} className="chart-bar-container">
                    <div className="chart-bar-label">
                      {day.day}
                      {isSunday && <span className="holiday-dot">●</span>}
                    </div>
                    <div className="chart-bar-wrapper">
                      {isSunday ? (
                        <div
                          className="chart-bar holiday-full"
                          style={{ height: '100%' }}
                          title="Sunday - Holiday"
                        >
                          <span className="holiday-label">HOLIDAY</span>
                        </div>
                      ) : (
                        <div
                          className="chart-bar"
                          style={{ height: `${day.percentage}%` }}
                          title={`${day.count} employees (${day.percentage}%)`}
                        ></div>
                      )}
                    </div>
                    <div className="chart-bar-value sunday-value">
                      {isSunday ? '100%' : `${day.percentage}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="quick-stat">
              <div className="quick-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                ✅
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{dashboardStats.checked_out_today}</div>
                <div className="quick-stat-label">Completed Today</div>
              </div>
            </div>

            <div className="quick-stat">
              <div className="quick-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                ⏳
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{dashboardStats.pending_today}</div>
                <div className="quick-stat-label">Pending</div>
              </div>
            </div>

            <div className="quick-stat">
              <div className="quick-stat-icon" style={{ background: '#e0e7ff', color: '#8b5cf6' }}>
                📅
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{dashboardStats.today_attendance}</div>
                <div className="quick-stat-label">Marked Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}