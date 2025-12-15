import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    role: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authJson = localStorage.getItem('auth');
        
        if (!authJson) {
          setAuthState({
            user: null,
            role: null,
            isLoading: false,
            isAuthenticated: false
          });
          return;
        }

        const auth = JSON.parse(authJson);
        const userProfile = auth.profile || auth.user;
        const userRole = userProfile?.role || 
                        auth?.user?.user_metadata?.role || 
                        userProfile?.user_metadata?.role || 
                        'user';

        setAuthState({
          user: userProfile,
          role: userRole,
          isLoading: false,
          isAuthenticated: true
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth');
        setAuthState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    };

    checkAuth();
  }, []);

  const login = (authData) => {
    localStorage.setItem('auth', JSON.stringify(authData));
    const userProfile = authData.profile || authData.user;
    const userRole = userProfile?.role || 
                    authData?.user?.user_metadata?.role || 
                    userProfile?.user_metadata?.role || 
                    'user';

    setAuthState({
      user: userProfile,
      role: userRole,
      isLoading: false,
      isAuthenticated: true
    });
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setAuthState({
      user: null,
      role: null,
      isLoading: false,
      isAuthenticated: false
    });
  };

  const updateUser = (userData) => {
    const currentAuth = JSON.parse(localStorage.getItem('auth') || '{}');
    const updatedAuth = {
      ...currentAuth,
      profile: { ...currentAuth.profile, ...userData },
      user: { ...currentAuth.user, ...userData }
    };
    localStorage.setItem('auth', JSON.stringify(updatedAuth));
    
    setAuthState(prev => ({
      ...prev,
      user: { ...prev.user, ...userData }
    }));
  };

  const value = {
    ...authState,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher Order Component for role-based access
export const withRole = (Component, requiredRoles) => {
  return function WithRoleComponent(props) {
    const { role, isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!rolesArray.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <Component {...props} />;
  };
};