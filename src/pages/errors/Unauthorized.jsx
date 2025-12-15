import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/styles/Unauthorized.css';

export default function Unauthorized() {
  const auth = JSON.parse(localStorage.getItem('auth'));
  const userRole = auth?.profile?.role || auth?.user?.user_metadata?.role || 'user';

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="error-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        
        <div className="user-info">
          <p><strong>Your Role:</strong> {userRole}</p>
        </div>

        <div className="action-buttons">
          {userRole === 'admin' ? (
            <Link to="/admin/dashboard" className="btn btn-primary">
              Go to Admin Dashboard
            </Link>
          ) : (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          )}
          
          <Link to="/" className="btn btn-secondary">
            Go to Home
          </Link>
          
          <button 
            onClick={() => {
              localStorage.removeItem('auth');
              window.location.href = '/login';
            }}
            className="btn btn-danger"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}