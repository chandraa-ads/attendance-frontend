import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({
    user: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
    token: null
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const authJson = localStorage.getItem('auth');
      
      if (!authJson) {
        setAuthState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
          token: null
        });
        return;
      }

      const auth = JSON.parse(authJson);
      
      // Check if auth data is valid
      if (!auth || (!auth.profile && !auth.user)) {
        localStorage.removeItem('auth');
        setAuthState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
          token: null
        });
        return;
      }

      const userProfile = auth.profile || auth.user;
      const userRole = userProfile?.role || 
                      auth?.user?.user_metadata?.role || 
                      userProfile?.user_metadata?.role || 
                      'user';
      const token = auth.session?.access_token || null;

      setAuthState({
        user: userProfile,
        role: userRole,
        isLoading: false,
        isAuthenticated: true,
        token
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('auth');
      setAuthState({
        user: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
        token: null
      });
    }
  };

  const login = (authData) => {
    localStorage.setItem('auth', JSON.stringify(authData));
    
    const userProfile = authData.profile || authData.user;
    const userRole = userProfile?.role || 
                    authData?.user?.user_metadata?.role || 
                    userProfile?.user_metadata?.role || 
                    'user';
    const token = authData.session?.access_token || null;

    setAuthState({
      user: userProfile,
      role: userRole,
      isLoading: false,
      isAuthenticated: true,
      token
    });
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setAuthState({
      user: null,
      role: null,
      isLoading: false,
      isAuthenticated: false,
      token: null
    });
    navigate('/login');
  };

  const updateUser = (userData) => {
    const currentAuth = JSON.parse(localStorage.getItem('auth') || '{}');
    const updatedAuth = {
      ...currentAuth,
      profile: currentAuth.profile ? { ...currentAuth.profile, ...userData } : userData,
      user: currentAuth.user ? { ...currentAuth.user, ...userData } : userData
    };
    localStorage.setItem('auth', JSON.stringify(updatedAuth));
    
    setAuthState(prev => ({
      ...prev,
      user: { ...prev.user, ...userData }
    }));
  };

  const refreshAuth = () => {
    checkAuth();
  };

  const value = {
    ...authState,
    login,
    logout,
    updateUser,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};