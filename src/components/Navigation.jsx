import React, { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const sanitizeText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, username, logout, checkSession, hasPermission } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      if (window.confirm('Вы уверены, что хотите выйти?')) {
        sessionStorage.removeItem('redirectAfterLogin');
        
        const success = logout();
        
        if (success) {
          navigate('/seniors', { replace: true });
        }
      }
    } catch (err) {
      console.error('Logout error:', err.message);
      logout();
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const isActivePath = useCallback((path) => {
    try {
      const currentPath = sanitizeText(location.pathname);
      return currentPath === path;
    } catch (e) {
      return false;
    }
  }, [location.pathname]);

  const navLinks = [
    { to: '/seniors', label: 'Список', showAlways: true },
    { to: '/promotions', label: 'Повышения', showAlways: true },
    { to: '/admin', label: '👑 Админ-панель', showAlways: true, requireAdmin: true }
  ];

  // Фильтруем ссылки в зависимости от прав
  const visibleLinks = navLinks.filter(link => {
    if (link.requireAdmin) {
      return isAuthenticated && hasPermission('admin');
    }
    return link.showAlways;
  });

  return (
    <nav className="navigation" role="navigation" aria-label="Основное меню">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => navigate('/seniors')}>
          <h2>ОДРП4</h2>
        </div>
        
        <div className="nav-links" role="menubar">
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={isActivePath(link.to) ? 'active' : ''}
              role="menuitem"
              aria-current={isActivePath(link.to) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        <div className="nav-actions">
          {isLoading ? (
            <span className="loading-indicator">Загрузка...</span>
          ) : isAuthenticated && checkSession() ? (
            <div className="user-menu">
              <span className="username-display">
                <svg className="user-icon-svg" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                {username}
              </span>
              <button 
                onClick={handleLogout} 
                className="logout-btn"
                aria-label="Выйти из системы"
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="login-btn"
              aria-label="Войти в систему"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;