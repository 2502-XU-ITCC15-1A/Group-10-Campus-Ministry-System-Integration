import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Logging in with:', formData);
      console.log('Sending request to:', api.defaults.baseURL + '/auth/login');
      const response = await api.post('/auth/login', formData);
      console.log('Login response status:', response.status);
      console.log('Login response:', response.data);
      
      if (!response.data || !response.data.token || !response.data.user) {
        console.error('Invalid response:', response.data);
        toast.error('Invalid server response');
        setLoading(false);
        return;
      }
      
// Save to localStorage first
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Also call login from context to update state
      login(response.data);
      
      // Update API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Get role and navigate immediately
      const { role } = response.data.user;
      console.log('User role:', role);
      toast.success('Welcome to eCMS!');
      
      // Navigate directly based on role from response
      const targetPath = role === 'student' ? '/student/dashboard' : '/admin/dashboard';
      console.log('Navigating to:', targetPath);
      window.location.href = targetPath;
} catch (error) {
      console.error('Login error full:', error);
      console.error('Login error response:', error.response);
      console.error('Login error message:', error.message);
      
      // Show specific error message
      if (error.code === 'ECONNREFUSED') {
        toast.error('Cannot connect to server. Is backend running?');
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Login failed - check console for details');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">eCMS Portal</h2>
          <p className="text-gray-500">Electronic Certificate Management System</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Email
            </label>
            <input
              type="email"
              required
              className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-primary outline-none"
placeholder="20230028369@my.xu.edu.ph"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-primary outline-none"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white p-3 rounded-lg hover:opacity-90 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4 pt-4 border-t">
          <p className="text-gray-500 text-sm">Test Accounts:</p>
<p className="text-gray-400 text-xs mt-1">Student: 20230028369@my.xu.edu.ph / password123</p>
          <p className="text-gray-400 text-xs">Admin: dfabela@xu.edu.ph / admin123</p>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
