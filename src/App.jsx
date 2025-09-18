import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginForm from './components/LoginForm';
import ProfileForm from './pages/ProfileForm';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAttendance from './pages/admin/Attendance';
import AdminLeave from './pages/admin/Leave';
import AdminPanel from './pages/admin/AdminPanel';
import AdminOption from './pages/admin/AdminOption';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserAttendance from './pages/user/Attendance';
import UserLeave from './pages/user/Leave';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginForm />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfileForm />
            </ProtectedRoute>
          } 
        />

        {/* ✅ Admin Option Route */}
        <Route 
          path="/admin/option"
          element={
            <ProtectedRoute role="admin">
              <AdminOption />
            </ProtectedRoute>
          }
        />

        {/* ✅ Admin Dashboard with nested routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="leave" element={<AdminLeave />} />
        </Route>

        {/* ✅ Admin Panel Route */}
        <Route
          path="/admin/panel"
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* ✅ User Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="attendance" element={<UserAttendance />} />
          <Route path="leave" element={<UserLeave />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </Router>
  );
}
