import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const authJson = localStorage.getItem('auth');
  if (!authJson) {
    return <Navigate to="/login" replace />;
  }

  let auth;
  try {
    auth = JSON.parse(authJson);
  } catch {
    localStorage.removeItem('auth');
    return <Navigate to="/login" replace />;
  }

  const userRole =
    auth?.profile?.role ||
    auth?.user?.user_metadata?.role ||
    'user';

  if (role) {
    const rolesAllowed = Array.isArray(role) ? role : [role];
    if (!rolesAllowed.includes(userRole)) {
      // Redirect to unauthorized or login
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
