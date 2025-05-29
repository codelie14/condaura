import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';

// Components will be lazy-loaded for better performance
const LoginForm = React.lazy(() => import('./components/auth/LoginForm'));
const RegisterForm = React.lazy(() => import('./components/auth/RegisterForm'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const CampaignList = React.lazy(() => import('./components/campaigns/CampaignList'));
const ReviewList = React.lazy(() => import('./components/reviews/ReviewList'));

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// App loading wrapper
const LoadingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <React.Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
        {children}
      </React.Suspense>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LoadingWrapper>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <CampaignList />
              </ProtectedRoute>
            } />
            
            <Route path="/reviews" element={
              <ProtectedRoute>
                <ReviewList />
              </ProtectedRoute>
            } />
            
            {/* Redirect to dashboard if authenticated, otherwise to login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LoadingWrapper>
      </AuthProvider>
    </Router>
  );
}

export default App;
