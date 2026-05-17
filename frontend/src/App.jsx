import React, { useContext, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import StudentProfile from './components/StudentProfile';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';
import EvaluationForm from './components/EvaluationForm';
import EvaluationBuilder from './components/EvaluationBuilder';
import DataManagement from './components/DataManagement';
import CertificateGenerator from './components/CertificateGenerator';
import CertificateTemplates from './components/CertificateTemplates';
import CertificateScanner from './components/CertificateScanner';
import RecollectionRegistrants from './components/RecollectionRegistrants';
import RecollectionScheduleManager from './components/RecollectionScheduleManager';
import ManageAccounts from './components/ManageAccounts';
import StudentRecords from './components/StudentRecords';
import AdminStudentProfile from './components/AdminStudentProfile';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const idleTimerRef = useRef(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

  const isAuthPage = location.pathname === '/login';
  const getHomePath = (role) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'staff') return '/formator/dashboard';
    return '/student/dashboard';
  };

  // Prevent back button from returning to login page
  useEffect(() => {
    if (user && location.pathname === '/login') {
      navigate(getHomePath(user.role), { replace: true });
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
  }, [user, location.pathname, isAuthPage, navigate]);

  useEffect(() => {
    if (user || location.pathname !== '/login') return undefined;

    window.history.replaceState({ lockedLogin: true }, '', '/login');
    window.history.pushState({ lockedLogin: true }, '', '/login');

    const lockLoginHistory = () => {
      window.history.pushState({ lockedLogin: true }, '', '/login');
      navigate('/login', { replace: true });
    };

    window.addEventListener('popstate', lockLoginHistory);
    return () => window.removeEventListener('popstate', lockLoginHistory);
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    if (!user || isAuthPage) return undefined;

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

    const expireSession = () => {
      logout();
      toast.error('Session expired due to inactivity. Please sign in again.');
      navigate('/login', { replace: true });
    };

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(expireSession, IDLE_TIMEOUT_MS);
    };

    resetIdleTimer();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [user, isAuthPage, logout, navigate]);

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setLogoutModalOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }) => (
    `rounded-md p-3 transition-colors ${
      isActive ? 'bg-white text-[#3a53a5] shadow-sm' : 'text-white hover:bg-[#2a3a85]'
    }`
  );

  if (isAuthPage || !user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#edf0f7] text-text-dark">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 h-screen w-[260px] bg-[#3a53a5] p-4 text-white">
        <div className="mb-8 flex items-center gap-3 px-2">
          <img className="h-12 w-12 object-contain" src="/assets/CMO_Seal.png" alt="CMO Seal" />
          <div>
            <h2 className="text-xl font-bold">CMS</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Campus Ministries</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {user.role === 'admin' ? (
            <>
              <NavLink to="/admin/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/admin/accounts" className={navLinkClass}>Manage Accounts</NavLink>
              <NavLink to="/admin/student-records" className={navLinkClass}>Student Records</NavLink>
              <NavLink to="/admin/certificate-templates" className={navLinkClass}>Certificate Templates</NavLink>
              <NavLink to="/admin/certificates" className={navLinkClass}>Generate Certificate</NavLink>
              <NavLink to="/admin/certificate-scan" className={navLinkClass}>Verify Certificate</NavLink>
            </>
          ) : user.role === 'staff' ? (
            <>
              <NavLink to="/formator/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/admin/student-records" className={navLinkClass}>Student Records</NavLink>
              <NavLink to="/admin/certificate-templates" className={navLinkClass}>Certificate Templates</NavLink>
              <NavLink to="/admin/certificates" className={navLinkClass}>Generate Certificate</NavLink>
              <NavLink to="/admin/certificate-scan" className={navLinkClass}>Verify Certificate</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/student/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/student/profile" className={navLinkClass}>Student Profile</NavLink>
            </>
          )}
        </nav>
        <button onClick={handleLogout} className="absolute bottom-5 flex w-[228px] items-center gap-2 p-3 text-left hover:bg-[#2a3a85]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <div className="ml-[260px] min-w-0 flex-1">
        {/* TOPBAR */}
        <header className="flex h-[70px] items-center justify-end border-b border-gray-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="font-medium">{user.fullName}</span>
            <span className="text-sm capitalize text-gray-500">({user.role === 'staff' ? 'formator' : user.role})</span>
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
              path="/student/profile"
              element={
                <ProtectedRoute role="student">
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/formator/dashboard"
              element={
                <ProtectedRoute role="staff">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/faculty/dashboard" element={<Navigate to="/formator/dashboard" />} />
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
                <ProtectedRoute role={['admin', 'staff']}>
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
              path="/admin/accounts"
              element={
                <ProtectedRoute role="admin">
                  <ManageAccounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/student-records"
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <StudentRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/student-records/profile/:studentId"
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <AdminStudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificates"
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <CertificateGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificate-templates"
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <CertificateTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificate-scan"
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <CertificateScanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/recollections"
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <RecollectionScheduleManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/recollections/:id/registrants"
              element={
                <ProtectedRoute role={['admin', 'staff']}>
                  <RecollectionRegistrants />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to={getHomePath(user.role)} />} />
          </Routes>
        </main>
      </div>
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#edf0f7] text-[#3a53a5]">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Confirm Logout</h2>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to log out of your account?</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => setLogoutModalOpen(false)} className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={confirmLogout} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
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
