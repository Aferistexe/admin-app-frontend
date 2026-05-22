import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext(null);

// ⚠️ ДЛЯ ПРОДАКШЕНА: авторизация через бэкенд на Render
const AUTH_API_URL = process.env.REACT_APP_AUTH_URL || 'https://admin-app-backend-6i6d.onrender.com/api';

// Для остальных запросов — из .env (admin.unionteams.ru)
const API_URL = process.env.REACT_APP_API_URL || 'https://admin.unionteams.ru/api';

const TOKEN_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000,
  STORAGE_KEY: 'auth_token',
  REFRESH_KEY: 'refresh_token',
  USERNAME_KEY: 'auth_username',
  USER_KEY: 'user_data',
  TOKEN_PREFIX: 'Bearer ',
  COOKIE_NAME: 'auth_token',
  COOKIE_OPTIONS: {
    path: '/',
    maxAge: 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: false
  }
};

const validateToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 10 || token.length > 5000) return false;
  
  const dangerousPattern = /[<>{}"'`]/g;
  if (dangerousPattern.test(token)) return false;
  
  const parts = token.split('.');
  if (parts.length === 3) {
    return true;
  }
  
  const base64Pattern = /^[A-Za-z0-9+/=_-]+$/;
  if (!base64Pattern.test(token)) return false;
  
  return true;
};

const isTokenExpired = (token) => {
  try {
    if (!token || typeof token !== 'string') return true;

    if (token.split('.').length === 3) {
      const decoded = jwtDecode(token);
      if (decoded && decoded.exp) {
        return Date.now() > decoded.exp * 1000;
      }
    }

    const tokenData = localStorage.getItem(`${TOKEN_CONFIG.STORAGE_KEY}_created`);
    if (tokenData) {
      const createdAt = parseInt(tokenData, 10);
      if (!isNaN(createdAt)) {
        return Date.now() - createdAt > TOKEN_CONFIG.MAX_AGE;
      }
    }
  } catch (err) {
    console.error('Token validation error:', err.message);
    return true;
  }

  return false;
};

const getUserFromToken = (token) => {
  try {
    if (token && token.split('.').length === 3) {
      const decoded = jwtDecode(token);
      return {
        id: decoded.id || decoded.sub || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || decoded.roles?.[0],
        ...decoded
      };
    }
  } catch (err) {
    console.error('Error decoding token:', err.message);
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [cookies, setCookie, removeCookie] = useCookies([TOKEN_CONFIG.COOKIE_NAME]);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_CONFIG.STORAGE_KEY);
    localStorage.removeItem(TOKEN_CONFIG.REFRESH_KEY);
    localStorage.removeItem(TOKEN_CONFIG.USERNAME_KEY);
    localStorage.removeItem(TOKEN_CONFIG.USER_KEY);
    localStorage.removeItem(`${TOKEN_CONFIG.STORAGE_KEY}_created`);
    removeCookie(TOKEN_CONFIG.COOKIE_NAME, { path: '/' });
    setToken(null);
    setRefreshToken(null);
    setUsername('');
    setUser(null);
    setIsAuthenticated(false);
  }, [removeCookie]);

  useEffect(() => {
    const initAuth = () => {
      try {
        let storedToken = cookies[TOKEN_CONFIG.COOKIE_NAME] || localStorage.getItem(TOKEN_CONFIG.STORAGE_KEY);
        const storedRefreshToken = localStorage.getItem(TOKEN_CONFIG.REFRESH_KEY);
        const storedUsername = localStorage.getItem(TOKEN_CONFIG.USERNAME_KEY);
        const storedUser = localStorage.getItem(TOKEN_CONFIG.USER_KEY);
        
        if (storedToken && validateToken(storedToken)) {
          if (isTokenExpired(storedToken)) {
            if (storedRefreshToken) {
              console.log('Token expired, trying to refresh...');
            } else {
              clearAuthData();
            }
          } else {
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            setUsername(storedUsername || '');
            
            const userData = getUserFromToken(storedToken);
            if (userData) {
              setUser(userData);
            } else if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch (e) {
                setUser(null);
              }
            }
            
            setIsAuthenticated(true);
          }
        } else {
          clearAuthData();
        }
      } catch (err) {
        console.error('Auth initialization error:', err.message);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [cookies, clearAuthData]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkTokenInterval = setInterval(() => {
      if (isTokenExpired(token)) {
        console.log('Token expired, logging out...');
        logout();
      }
    }, 60000);

    return () => clearInterval(checkTokenInterval);
  }, [isAuthenticated, token]);

  const login = useCallback(async (username, password) => {
    try {
      console.log('Login attempt to:', `${AUTH_API_URL}/auth/login`);
      
      const response = await axios.post(`${AUTH_API_URL}/auth/login`, {
        username,
        password
      });

      const { accessToken, user: userData } = response.data;

      if (!validateToken(accessToken)) {
        console.error('Invalid token format');
        return false;
      }

      localStorage.setItem(TOKEN_CONFIG.STORAGE_KEY, accessToken);
      localStorage.setItem(TOKEN_CONFIG.USERNAME_KEY, userData.name || userData.username);
      localStorage.setItem(TOKEN_CONFIG.USER_KEY, JSON.stringify(userData));
      localStorage.setItem(`${TOKEN_CONFIG.STORAGE_KEY}_created`, Date.now().toString());
      
      setCookie(TOKEN_CONFIG.COOKIE_NAME, accessToken, TOKEN_CONFIG.COOKIE_OPTIONS);
      
      setToken(accessToken);
      setUser(userData);
      setUsername(userData.name || userData.username);
      setIsAuthenticated(true);
      
      return true;
    } catch (err) {
      console.error('Login error:', err.response?.data?.error || err.message);
      return false;
    }
  }, [setCookie]);

  const logout = useCallback(() => {
    try {
      clearAuthData();
      sessionStorage.clear();
      
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      return true;
    } catch (err) {
      console.error('Logout error:', err.message);
      setToken(null);
      setUsername('');
      setIsAuthenticated(false);
      return false;
    }
  }, [clearAuthData]);

  const getAuthHeader = useCallback(() => {
    if (!token || !isAuthenticated) return null;
    return {
      Authorization: `${TOKEN_CONFIG.TOKEN_PREFIX}${token}`
    };
  }, [token, isAuthenticated]);

  const checkSession = useCallback(() => {
    if (!token || !isAuthenticated) return false;
    
    if (isTokenExpired(token)) {
      logout();
      return false;
    }
    
    return true;
  }, [token, isAuthenticated, logout]);

  const getUserRoles = useCallback(() => {
    if (user && user.role) {
      return Array.isArray(user.role) ? user.role : [user.role];
    }
    
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode(token);
        const roles = decoded.role || decoded.roles;
        return Array.isArray(roles) ? roles : (roles ? [roles] : []);
      } catch (err) {
        console.error('Error getting roles:', err);
      }
    }
    
    return [];
  }, [user, token]);

  const hasPermission = useCallback((requiredRole) => {
    const userRoles = getUserRoles();
    return userRoles.includes(requiredRole) || userRoles.includes('admin');
  }, [getUserRoles]);

  const contextValue = {
    token,
    refreshToken,
    username,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAuthHeader,
    checkSession,
    getUserRoles,
    hasPermission,
    isTokenExpired: () => isTokenExpired(token)
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;