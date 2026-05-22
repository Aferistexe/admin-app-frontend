import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CookiesProvider } from 'react-cookie';
import Navigation from './components/Navigation';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import './styles/theme.css';
import './App.css';

const SeniorList = lazy(() => import('./pages/SeniorList'));
const TeamDetail = lazy(() => import('./pages/TeamDetail'));
const Promotions = lazy(() => import('./pages/Promotions'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SENIORS: '/seniors',
  TEAM: '/team/:seniorId',
  PROMOTIONS: '/promotions',
  ADMIN: '/admin',
  NOT_FOUND: '/404',
};

const ProtectedRoute = ({ children }) => (
  <PrivateRoute>
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  </PrivateRoute>
);

const PublicRoute = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

function App() {
  return (
    <ErrorBoundary>
      <CookiesProvider>
        <AuthProvider>
          <Router>
            <div className="app-layout">
              <Navigation />
              
              <main className="main-content" role="main">
                <Routes>
                  <Route 
                    path={ROUTES.LOGIN} 
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.SENIORS} 
                    element={
                      <PublicRoute>
                        <SeniorList />
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.TEAM} 
                    element={
                      <PublicRoute>
                        <TeamDetail />
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.HOME} 
                    element={<Navigate to={ROUTES.SENIORS} replace />} 
                  />
                  
                  <Route 
                    path={ROUTES.PROMOTIONS} 
                    element={
                      <ProtectedRoute>
                        <Promotions />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.ADMIN} 
                    element={
                      <ProtectedRoute>
                        <AdminPanel />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.NOT_FOUND} 
                    element={
                      <PublicRoute>
                        <NotFound />
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path="*" 
                    element={<Navigate to={ROUTES.NOT_FOUND} replace />} 
                  />
                </Routes>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </CookiesProvider>
    </ErrorBoundary>
  );
}

export default App;