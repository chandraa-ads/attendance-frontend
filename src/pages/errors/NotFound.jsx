import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/styles/NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-icon">🔍</div>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        
        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Go to Homepage
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}