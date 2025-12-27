import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey, faEye, faEyeSlash, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import '../assets/styles/LoginForm.css'
export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [redirected, setRedirected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (redirected) return;

    const authData = JSON.parse(localStorage.getItem("auth"));
    if (!authData) return;

    const role = authData.profile?.role || authData.role || "user";
    if (role) {
      setRedirected(true);
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
    }
  }, [redirected, navigate]);

  // Call your backend login endpoint
  const backendLogin = async (email, password, role) => {
    const res = await fetch(`https://attendance-backend-d4vi.onrender.comauth/login/${role}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Login failed');
    }

    return res.json();
  };

  // Form submit handler
  const onSubmit = async (data) => {
    setFeedback({ message: '', type: '' });
    setIsLoading(true);

    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();

    try {
      // Try admin login first
      let loginRes;
      try {
        loginRes = await backendLogin(email, password, 'admin');
      } catch (adminErr) {
        // If admin login fails, try user login
        loginRes = await backendLogin(email, password, 'user');
      }

      // Store auth data with proper token extraction
      const authData = {
        ...loginRes,
        access_token: loginRes.access_token || loginRes.session?.access_token,
        token: loginRes.access_token || loginRes.session?.access_token,
        profile: loginRes.profile || {
          id: loginRes.user?.id,
          name: loginRes.user?.user_metadata?.name || loginRes.user?.name,
          email: loginRes.user?.email,
          role: loginRes.user?.user_metadata?.role || loginRes.role || 'user',
          profile_url: loginRes.profile_url
        },
        role: loginRes.profile?.role || loginRes.user?.user_metadata?.role || loginRes.role || 'user'
      };

      // Save to localStorage
      localStorage.setItem("auth", JSON.stringify(authData));
      
      setFeedback({ message: 'Login successful! Redirecting...', type: 'success' });

      // Redirect based on role
      const role = authData.role;
      setTimeout(() => {
        setRedirected(true);
        navigate(role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
      }, 1500);

    } catch (err) {
      console.error('Login error:', err);
      setFeedback({ 
        message: `${err.message || 'Invalid credentials. Please try again.'}`, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1>Attendance System</h1>
          </div>
          <p className="subtitle">Sign in to access your account</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Email Field */}
          <div className="form-group">
            <div className="input-group">
              <div className="input-icon">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <input
                type="email"
                placeholder="Email address"
                autoComplete="email"
                disabled={isLoading}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={errors.email ? 'input-error' : ''}
              />
            </div>
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="input-group">
              <div className="input-icon">
                <FontAwesomeIcon icon={faKey} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
                disabled={isLoading}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className={errors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => !isLoading && setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          {/* Remember Me */}
          <div className="form-options">
            <label className="checkbox">
              <input 
                type="checkbox" 
                id="remember" 
                disabled={isLoading}
                className="checkbox-input"
              />
              <span className="checkbox-box"></span>
              <span className="checkbox-label">Remember me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`login-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In <FontAwesomeIcon icon={faSignInAlt} />
              </>
            )}
          </button>

          {/* Feedback Message */}
          {feedback.message && (
            <div className={`feedback-message ${feedback.type}`}>
              <span>{feedback.message}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Secure login 🔒</p>
        </div>
      </div>
    </div>
  );
}