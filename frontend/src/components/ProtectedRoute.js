import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Prevent back button from going to login page
  useEffect(() => {
    // Push a new state to prevent back button from working
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (e) => {
      e.preventDefault();
      // If trying to go back to login, stay on current page
      if (location.pathname !== '/login') {
        window.history.pushState(null, '', window.location.href);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} />
  }

  return children;
};

export default ProtectedRoute;