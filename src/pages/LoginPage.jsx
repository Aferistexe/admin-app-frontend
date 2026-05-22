import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Если уже авторизован, редирект
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/seniors', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('❌ Логин и пароль обязательны');
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        const from = location.state?.from?.pathname || '/seniors';
        navigate(from, { replace: true });
      } else {
        setError('❌ Неверный логин или пароль');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('⚠️ Произошла ошибка при входе. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>⚡ ACCESS TERMINAL ⚡</h2>
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}
        
        <input
          type="text"
          placeholder="👤 ЛОГИН"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          disabled={loading}
        />
        
        <input
          type="password"
          placeholder="🔒 ПАРОЛЬ"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={loading}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? '⏳ АВТОРИЗАЦИЯ...' : '🚀 ВОЙТИ В СИСТЕМУ'}
        </button>
        
        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center', 
          fontSize: '0.7rem', 
          color: 'var(--text-muted)',
          opacity: 0.6,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '15px'
        }}>
          <span>🔐 TEST ACCESS: admin / admin123</span>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;