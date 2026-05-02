import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check current route to hide redundant links
  const isOnStudentDashboard = location.pathname === '/student/dashboard';
  const isOnAdminDashboard = location.pathname === '/admin/dashboard';
  const isOnEvaluationBuilder = location.pathname === '/admin/evaluation-builder';

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <>
    <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              {/* Xavier University Ateneo de Cagayan Theme - Gold Cross Symbol */}
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 7.072l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-white tracking-wide">
                  eCMS
                </span>
                <p className="text-xs text-yellow-400 -mt-1">Campus Ministry</p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            {user.role === 'student' ? (
              <>
                {!isOnStudentDashboard && (
                  <Link
                    to="/student/dashboard"
                    className="px-4 py-2 text-white/90 font-medium rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                {/* Admin: Hide Dashboard link when on Dashboard */}
                {!isOnAdminDashboard && (
                  <Link
                    to="/admin/dashboard"
                    className="px-4 py-2 text-white/90 font-medium rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {/* Admin: Hide Evaluation Builder link when on that page */}
                {!isOnEvaluationBuilder && (
                  <Link
                    to="/admin/evaluation-builder"
                    className="px-4 py-2 text-white/90 font-medium rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Create Evaluation
                  </Link>
                )}
                <Link
                  to="/admin/data"
                  className="px-4 py-2 text-white/90 font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  Data
                </Link>
              </>
            )}
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/20">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-blue-900 font-bold text-sm">
                  {user.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <p className="text-xs text-yellow-400 capitalize">{user.role}</p>
              </div>
            </div>
            
            {/* Logout Button with Confirmation */}
            <button
              onClick={handleLogoutClick}
              className="ml-4 px-4 py-2 text-white/90 font-medium rounded-xl hover:bg-red-600/80 hover:text-white transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Logout Confirmation Modal */}
    {showLogoutModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out? Make sure to save any unsaved work.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Navbar;