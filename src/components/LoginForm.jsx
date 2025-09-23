import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import chandraaLogo from '../assets/images/CHANDRAA.png';
import webSixLogo from '../assets/images/WEB SIX.png';
import '../assets/styles/LoginForm.css';

export default function LoginForm() {
  const { register, handleSubmit } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [redirected, setRedirected] = useState(false);
  const navigate = useNavigate();

  // ✅ Button hover state (keep only here)
  const [btnHover, setBtnHover] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (redirected) return;

    const authData = JSON.parse(localStorage.getItem("auth"));
    if (!authData) return;

    const role = authData.profile?.role || authData.role || "user";
    if (role) {
      setRedirected(true);
      navigate(role === "admin" ? "/admin/option" : "/dashboard", { replace: true });
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

    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();

    try {
      // Try admin login first
      let loginRes;
      try {
        loginRes = await backendLogin(email, password, 'admin');
      } catch {
        // If admin login fails, try user login
        loginRes = await backendLogin(email, password, 'user');
      }

      // Save login data to localStorage
      localStorage.setItem("auth", JSON.stringify(loginRes));
      setFeedback({ message: '✅ Login successful!', type: 'success' });

      // Redirect based on role
      const role = loginRes.profile?.role || loginRes.role || "user";
      setRedirected(true);
      navigate(role === "admin" ? "/admin/option" : "/dashboard", { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setFeedback({ message: `❌ ${err.message}`, type: 'error' });
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
          <h1 id="login-heading" className="title">LOGIN</h1>
          <form className="card" onSubmit={handleSubmit(onSubmit)} aria-label="Login form">
            
            {/* Email Field */}
            <div className="field">
              <FontAwesomeIcon icon={faUser} className="left-icon" />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                {...register('email', { required: true })}
              />
            </div>

            {/* Password Field */}
            <div className="field">
              <FontAwesomeIcon icon={faKey} className="left-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
                {...register('password', { required: true })}
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="right-icon"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>

            {/* Remember Me */}
            <label className="row-remember" htmlFor="remember">
              <input type="checkbox" id="remember" />
              <span>Remember me</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn ${btnHover ? 'btn-hover' : ''}`}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
            >
              WEB SIX <FontAwesomeIcon icon={faUser} />
            </button>

            {/* Feedback Message */}
            {feedback.message && (
              <div className={feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}>
                {feedback.message}
              </div>
            )}

            {/* Divider */}
            <div className="divider" aria-hidden="true">
              <div className="divider-line" />
              <span>or</span>
              <div className="divider-line" />
            </div>

            {/* Socials */}
            <div className="socials" aria-label="Social login">
              <img
                src="https://cdn-icons-png.flaticon.com/512/124/124010.png"
                alt="Facebook login"
              />
              <img
                src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
                alt="Google login"
              />
              <img
                src="https://cdn-icons-png.flaticon.com/512/732/732223.png"
                alt="Outlook login"
              />
            </div>

            {/* Forgot Password */}
            <div className="forgot">Forgot Password?</div>
          </form>
        </div>
      </main>
      <div className="bottom-bar" aria-hidden="true" />
    </div>
  );
}
