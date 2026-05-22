import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading, checkSession } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  if (!isAuthenticated || !checkSession()) {
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default PrivateRoute;