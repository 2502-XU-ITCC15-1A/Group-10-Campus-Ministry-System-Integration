import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import EvaluationForm from './components/EvaluationForm';
import EvaluationBuilder from './components/EvaluationBuilder';
import DataManagement from './components/DataManagement';
import CertificateGenerator from './components/CertificateGenerator';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Prevent back button from returning to login page
  useEffect(() => {
    if (user && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    }
    
    // Prevent browser back button
    const preventBack = (e) => {
      if (user && !isAuthPage) {
        e.preventDefault();
        window.history.pushState(null, null, window.location.href);
      }
    };
    
    window.addEventListener('popstate', preventBack);
    window.history.pushState(null, null, window.location.href);
    
    return () => window.removeEventListener('popstate', preventBack);
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

if (isAuthPage || !user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#1f1f2e] text-white p-5 fixed h-full">
        <h2 className="text-xl font-bold mb-8">CMS</h2>
        <nav className="flex flex-col gap-2">
          {user.role === 'admin' ? (
            <>
              {/* Only show links that are NOT the current page for admin */}
              {location.pathname !== '/admin/dashboard' && (
                <Link to="/admin/dashboard" className="p-3 rounded-lg hover:bg-[#2e2e44]">Dashboard</Link>
              )}
              {location.pathname !== '/admin/evaluation-builder' && (
                <Link to="/admin/evaluation-builder" className="p-3 rounded-lg hover:bg-[#2e2e44]">Create Evaluation</Link>
              )}
              {location.pathname !== '/admin/data' && (
                <Link to="/admin/data" className="p-3 rounded-lg hover:bg-[#2e2e44]">Data</Link>
              )}
              {location.pathname !== '/admin/certificates' && (
                <Link to="/admin/certificates" className="p-3 rounded-lg hover:bg-[#2e2e44]">Certificates</Link>
              )}
            </>
          ) : (
            <>
              {location.pathname !== '/student/dashboard' && (
                <Link to="/student/dashboard" className="p-3 rounded-lg hover:bg-[#2e2e44]">Dashboard</Link>
              )}
            </>
          )}
        </nav>
<button onClick={handleLogout} className="mt-auto p-3 rounded-lg hover:bg-red-600 w-full text-left absolute bottom-5 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <div className="ml-[260px] flex-1">
        {/* TOPBAR */}
        <header className="h-[70px] bg-white flex items-center justify-between px-6 shadow-sm">
          <h1 className="text-lg font-semibold">{user.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}</h1>
          <div className="flex items-center gap-3">
            <span className="font-medium">{user.fullName}</span>
            <span className="text-gray-500 text-sm capitalize">({user.role})</span>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-6">
          <Routes>
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/evaluation/:id" element={<EvaluationForm />} />
            <Route 
              path="/admin/evaluation-builder" 
              element={
                <ProtectedRoute role="admin">
                  <EvaluationBuilder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/data" 
              element={
                <ProtectedRoute role="admin">
                  <DataManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/certificates" 
              element={
                <ProtectedRoute role="admin">
                  <CertificateGenerator />
                </ProtectedRoute>
              } 
            />
<Route path="/" element={<Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
