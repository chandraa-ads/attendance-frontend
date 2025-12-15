import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey, faEye, faEyeSlash, faSignInAlt } from '@fortawesome/free-solid-svg-icons';

import chandraaLogo from '../assets/images/CHANDRAA.png';
import webSixLogo from '../assets/images/WEB SIX.png';
import '../assets/styles/LoginForm.css';

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [redirected, setRedirected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Button hover state
  const [btnHover, setBtnHover] = useState(false);

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
    const res = await fetch(`https://attendance-backend-d4vi.onrender.com/auth/login/${role}`, {
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
        // Extract access token from session or direct response
        access_token: loginRes.access_token || loginRes.session?.access_token,
        token: loginRes.access_token || loginRes.session?.access_token,
        // Store user profile information
        profile: loginRes.profile || {
          id: loginRes.user?.id,
          name: loginRes.user?.user_metadata?.name || loginRes.user?.name,
          email: loginRes.user?.email,
          role: loginRes.user?.user_metadata?.role || loginRes.role || 'user',
          profile_url: loginRes.profile_url
        },
        // Store role separately for easy access
        role: loginRes.profile?.role || loginRes.user?.user_metadata?.role || loginRes.role || 'user'
      };

      // Save to localStorage
      localStorage.setItem("auth", JSON.stringify(authData));
      
      // Debug: Log stored data
      console.log("Auth data stored successfully:", {
        hasToken: !!authData.access_token,
        role: authData.role,
        user: authData.profile?.name
      });

      setFeedback({ message: '✅ Login successful! Redirecting...', type: 'success' });

      // Redirect based on role
      const role = authData.role;
      setTimeout(() => {
        setRedirected(true);
        navigate(role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
      }, 1500);

    } catch (err) {
      console.error('Login error:', err);
      setFeedback({ 
        message: `❌ ${err.message || 'Invalid credentials. Please try again.'}`, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="root">
      <div className="top-bar" aria-hidden="true" />
      <main className="page" role="main">
        {/* Brand Logos */}
        <div className="brand-left" aria-hidden="true">
          <img src={chandraaLogo} alt="CHANDRAA ADS AND EVENTS" />
        </div>
        <div className="brand-right" aria-hidden="true">
          <img src={webSixLogo} alt="WEB MEDIA 6" />
        </div>

        {/* Login Form */}
        <div className="center-column" aria-labelledby="login-heading">
          <h1 id="login-heading" className="title">ATTENDANCE SYSTEM LOGIN</h1>
          <form className="card" onSubmit={handleSubmit(onSubmit)} aria-label="Login form">
            
            {/* Email Field */}
            <div className="field">
              <FontAwesomeIcon icon={faUser} className="left-icon" />
              <input
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                disabled={isLoading}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && (
                <span className="error-message">{errors.email.message}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="field">
              <FontAwesomeIcon icon={faKey} className="left-icon" />
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
                className={errors.password ? 'error' : ''}
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="right-icon"
                onClick={() => !isLoading && setShowPassword(!showPassword)}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
              />
              {errors.password && (
                <span className="error-message">{errors.password.message}</span>
              )}
            </div>

            {/* Remember Me */}
            <label className="row-remember" htmlFor="remember">
              <input type="checkbox" id="remember" disabled={isLoading} />
              <span>Remember me</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`btn ${btnHover ? 'btn-hover' : ''} ${isLoading ? 'btn-loading' : ''}`}
              onMouseEnter={() => !isLoading && setBtnHover(true)}
              onMouseLeave={() => !isLoading && setBtnHover(false)}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                <>
                  SIGN IN <FontAwesomeIcon icon={faSignInAlt} />
                </>
              )}
            </button>

            {/* Feedback Message */}
            {feedback.message && (
              <div className={`feedback ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
                {feedback.message}
              </div>
            )}

            {/* Divider */}
            <div className="divider" aria-hidden="true">
              <div className="divider-line" />
              <span>or continue with</span>
              <div className="divider-line" />
            </div>

            {/* Socials */}
            <div className="socials" aria-label="Social login">
              <button type="button" className="social-btn" disabled={isLoading}>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/124/124010.png"
                  alt="Facebook login"
                />
              </button>
              <button type="button" className="social-btn" disabled={isLoading}>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
                  alt="Google login"
                />
              </button>
              <button type="button" className="social-btn" disabled={isLoading}>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/732/732223.png"
                  alt="Outlook login"
                />
              </button>
            </div>

            {/* Forgot Password */}
            <div className="forgot">
              <button type="button" className="forgot-btn" disabled={isLoading}>
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </main>
      <div className="bottom-bar" aria-hidden="true" />
    </div>
  );
}