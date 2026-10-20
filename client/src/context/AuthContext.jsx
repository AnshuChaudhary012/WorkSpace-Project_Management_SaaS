import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('workspace_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on initial mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('workspace_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (error) {
        console.warn('Session restoration failed:', error.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.success && response.data) {
      const { user: loggedInUser, token: authToken } = response.data;
      setUser(loggedInUser);
      setToken(authToken);
      setAuthToken(authToken);
      return loggedInUser;
    }
    throw new Error(response.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.success && response.data) {
      const { user: registeredUser, token: authToken } = response.data;
      setUser(registeredUser);
      setToken(authToken);
      setAuthToken(authToken);
      return registeredUser;
    }
    throw new Error(response.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
