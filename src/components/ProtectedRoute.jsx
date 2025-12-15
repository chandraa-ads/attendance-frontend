import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authJson = localStorage.getItem('auth');
        
        if (!authJson) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const auth = JSON.parse(authJson);
        
        if (!auth || (!auth.profile && !auth.user)) {
          localStorage.removeItem('auth');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const userProfile = auth.profile || auth.user;
        const extractedRole = userProfile?.role || 
                            auth?.user?.user_metadata?.role || 
                            userProfile?.user_metadata?.role || 
                            'user';

        setUserRole(extractedRole);
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('auth');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          borderTopColor: 'white',
          animation: 'spin 1s ease-in-out infinite',
          marginBottom: '20px'
        }}></div>
        <p style={{ color: 'white', fontSize: '18px', fontWeight: '500' }}>Checking authentication...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    localStorage.setItem('redirectUrl', location.pathname);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role-based access control
  if (role) {
    const rolesToCheck = Array.isArray(role) ? role : [role];
    
    if (!rolesToCheck.includes(userRole)) {
      // Redirect based on user role
      if (userRole === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
}