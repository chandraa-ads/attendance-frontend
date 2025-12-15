import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminManualAttendance from './pages/admin/AdminManualAttendance';
import AdminAllAttendance from './pages/admin/AdminAllAttendance';

// User Pages
import UserDashboard from './pages/user/UserDashboard';

// Error Pages
import Unauthorized from './pages/errors/Unauthorized';
import NotFound from './pages/errors/NotFound';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/404" element={<NotFound />} />

          {/* User Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/admin/attendance/manual" 
            element={
              <ProtectedRoute role="admin">
                <AdminManualAttendance />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/admin/attendance/all" 
            element={
              <ProtectedRoute role="admin">
                <AdminAllAttendance />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}