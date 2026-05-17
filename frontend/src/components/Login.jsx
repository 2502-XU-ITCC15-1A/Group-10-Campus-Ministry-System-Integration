import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const accountOptions = [
  {
    id: 'admin',
    title: 'Admin',
    helper: 'Use your @xu.edu.ph account',
    placeholder: 'dfabela@xu.edu.ph',
    allowedDomains: ['@xu.edu.ph'],
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    )
  },
  {
    id: 'staff',
    title: 'Formators',
    helper: 'Use your @xu.edu.ph account',
    placeholder: 'formator@xu.edu.ph',
    allowedDomains: ['@xu.edu.ph'],
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m8-5.13a3 3 0 11-6 0 3 3 0 016 0zM9 9a3 3 0 11-6 0 3 3 0 016 0z" />
    )
  },
  {
    id: 'student',
    title: 'Students',
    helper: 'Use your @my.xu.edu.ph account',
    placeholder: 'student@my.xu.edu.ph',
    allowedDomains: ['@my.xu.edu.ph'],
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.08 12.08 0 0112 20.5a12.08 12.08 0 01-6.16-9.92L12 14z" />
    )
  }
];

const Login = () => {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetData, setResetData] = useState({
    email: '',
    token: '',
    password: '',
    confirmPassword: ''
  });
  const [resetCodeReady, setResetCodeReady] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const currentAccount = accountOptions.find((option) => option.id === selectedAccount);

  const getEmailError = (email, account = currentAccount) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return 'School email is required';
    if (!account) return 'Please select an account type first';
    const isAllowed = account.allowedDomains.some((domain) => normalizedEmail.endsWith(domain));
    if (!isAllowed) {
      return `${account.title} must use ${account.allowedDomains.join(' or ')} email.`;
    }
    return '';
  };

  const ensureSelectedEmailAllowed = (email) => {
    const error = getEmailError(email);
    if (error) {
      showLoginError(error);
      return false;
    }
    return true;
  };

  const showLoginError = (message) => {
    toast.error(message, {
      position: 'top-center',
      style: {
        minWidth: '320px',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center'
      }
    });
  };

  const showLoginSuccess = (message) => {
    toast.success(message, {
      position: 'top-center',
      style: {
        minWidth: '320px',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center'
      }
    });
  };

  const completeLogin = (data) => {
    if (!data || !data.token || !data.user) {
      showLoginError('Invalid server response');
      return;
    }

    if (!ensureSelectedEmailAllowed(data.user.email)) return;

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    login(data);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    const targetPath = data.user.role === 'admin'
      ? '/admin/dashboard'
      : data.user.role === 'staff'
        ? '/formator/dashboard'
        : '/student/dashboard';
    showLoginSuccess('Welcome to eCMS!');
    navigate(targetPath, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureSelectedEmailAllowed(formData.email)) return;

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        ...formData,
        accountType: selectedAccount
      });
      completeLogin(response.data);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        showLoginError('Cannot connect to server. Is backend running?');
      } else if (error.response?.status === 401) {
        showLoginError('Invalid email or password');
      } else if (error.response?.data?.message) {
        showLoginError(error.response.data.message);
      } else {
        showLoginError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    if (!currentAccount) {
      showLoginError('Please select an account type first');
      return;
    }

    setGoogleLoading(true);

    try {
      const response = await api.post('/auth/google', {
        credential,
        accountType: selectedAccount
      });
      completeLogin(response.data);
    } catch (error) {
      if (error.response?.data?.message) {
        showLoginError(error.response.data.message);
      } else {
        showLoginError('Google login failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const openForgotPassword = () => {
    setResetData({
      email: formData.email,
      token: '',
      password: '',
      confirmPassword: ''
    });
    setResetCodeReady(false);
    setForgotModalOpen(true);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!ensureSelectedEmailAllowed(resetData.email)) return;

    setForgotLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: resetData.email });
      if (response.data?.resetToken) {
        setResetData((current) => ({ ...current, token: response.data.resetToken }));
        setResetCodeReady(true);
      }
      showLoginSuccess(response.data?.message || 'Password reset code generated');
    } catch (error) {
      showLoginError(error.response?.data?.message || 'Failed to prepare password reset');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (resetData.password !== resetData.confirmPassword) {
      showLoginError('Passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token: resetData.token,
        password: resetData.password
      });
      showLoginSuccess(response.data?.message || 'Password reset successful');
      setFormData({ email: resetData.email, password: '' });
      setForgotModalOpen(false);
    } catch (error) {
      showLoginError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const selectAccount = (accountId) => {
    setSelectedAccount(accountId);
    setFormData({ email: '', password: '' });
    setUsePasswordLogin(false);
    if (!googleConfigured) {
      showLoginError('Google login needs a client ID. Use password login for now.');
      setUsePasswordLogin(true);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-blue-950 md:flex">
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 md:w-1/2">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/Login_Background.jpg"
            alt=""
          />
          <div className="absolute inset-0 bg-blue-950/20" />

          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#24366f] p-7 text-center text-white shadow-2xl sm:p-9">
            <div className="text-center">
              <img className="mx-auto h-24 w-full object-contain pb-2" src="/assets/CMO_Seal.png" alt="CMO Seal" />
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">Campus Ministries</p>
              <h1 className="pb-3 pt-1 text-xl font-semibold text-white">Log in to eCMS</h1>
            </div>

            {!currentAccount ? (
              <div className="mx-auto mt-2 w-full space-y-3 text-left sm:w-3/4">
                <p className="pb-1 text-center text-sm font-semibold text-white/85">Select your account type to continue</p>
                {accountOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectAccount(option.id)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left text-[#24366f] transition hover:-translate-y-0.5 hover:bg-[#f7f9fd] hover:shadow-md"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eef3fa] text-[#24366f]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {option.icon}
                      </svg>
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{option.title}</span>
                      <span className="mt-1 block text-xs text-gray-600">{option.helper}</span>
                    </span>
                  </button>
                ))}

              </div>
            ) : (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccount('');
                    setUsePasswordLogin(false);
                  }}
                  className="mb-3 text-sm font-semibold text-white/85 hover:text-white hover:underline"
                >
                  ← Change account type
                </button>

                <div className="mx-auto mb-4 w-full rounded-xl bg-white px-3 py-3 text-center sm:w-3/4">
                  <p className="text-sm font-bold text-[#24366f]">{currentAccount.title}</p>
                  <p className="text-xs text-gray-600">{currentAccount.helper}</p>
                </div>

                {!usePasswordLogin && googleConfigured ? (
                  <div className={`mx-auto w-full sm:w-3/4 ${googleLoading ? 'pointer-events-none opacity-70' : ''}`}>
                    <p className="mb-3 text-sm font-semibold text-white/85">Continue with your Xavier Google account</p>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => showLoginError('Google login failed')}
                      text="signin_with"
                      shape="rectangular"
                      size="large"
                      width="100%"
                    />
                    <button
                      type="button"
                      onClick={() => setUsePasswordLogin(true)}
                      className="mt-4 text-sm font-semibold text-white/85 hover:text-white hover:underline"
                    >
                      Use password login instead
                    </button>
                  </div>
                ) : (
                  <>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="mx-auto w-full text-left sm:w-3/4">
                        <label className="mb-1 block text-sm font-medium text-white">School Email</label>
                        <input
                          type="email"
                          required
                          className="h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-blue-900"
                          placeholder={currentAccount.placeholder}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="mx-auto w-full text-left sm:w-3/4">
                        <label className="mb-1 block text-sm font-medium text-white">Password</label>
                        <input
                          type="password"
                          required
                          className="h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-blue-900"
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={openForgotPassword}
                          className="mt-2 text-sm font-semibold text-white/85 hover:text-white hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="mx-auto flex h-12 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-bold uppercase tracking-wide text-[#24366f] transition hover:bg-[#f3c846] disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
                      >
                        {loading ? 'Signing in...' : 'Log In'}
                      </button>
                    </form>

                    {googleConfigured && (
                      <button
                        type="button"
                        onClick={() => setUsePasswordLogin(false)}
                        className="mt-4 text-sm font-semibold text-white/85 hover:text-white hover:underline"
                      >
                        Back to Google login
                      </button>
                    )}
                  </>
                )}

                <div className="mx-auto mt-5 w-full border-t border-white/15 pt-4 text-center sm:w-3/4">
                  <p className="text-sm font-semibold text-white">Test Accounts</p>
                  <p className="mt-1 text-xs text-white/70">Formator: formator@xu.edu.ph / password123</p>
                  <p className="text-xs text-white/70">Admin: dfabela@xu.edu.ph / admin123</p>
                </div>

              </div>
            )}
          </div>
        </div>

        <div className="hidden min-h-screen w-1/2 items-center justify-center bg-blue-950 px-10 md:flex">
          <img className="h-48 w-full object-contain" src="/assets/XU_Logotype.png" alt="Xavier University" />
        </div>
      </div>

      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg border-2 border-blue-950 bg-white p-7 shadow-2xl">
            <div className="mb-5 text-center">
              <img className="mx-auto h-16 w-full object-contain" src="/assets/CMO_Seal.png" alt="CMO Seal" />
              <h2 className="mt-2 text-xl font-semibold text-blue-950">RESET PASSWORD</h2>
              <p className="mt-1 text-sm text-gray-500">Enter your school email to generate a reset code.</p>
            </div>

            {!resetCodeReady ? (
              <form className="space-y-4" onSubmit={handleForgotPassword}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-blue-950">School Email</label>
                  <input
                    type="email"
                    required
                    className="h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-900"
                    placeholder={currentAccount?.placeholder || 'name@xu.edu.ph'}
                    value={resetData.email}
                    onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="h-11 flex-1 border border-gray-300 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="h-11 flex-1 bg-blue-900 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:opacity-60"
                  >
                    {forgotLoading ? 'Sending...' : 'Get Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-blue-950">Reset Code</label>
                  <input
                    type="text"
                    required
                    className="h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-900"
                    value={resetData.token}
                    onChange={(e) => setResetData({ ...resetData, token: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">Demo mode shows the reset code here because email delivery is not configured.</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-blue-950">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-900"
                    placeholder="At least 6 characters"
                    value={resetData.password}
                    onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-blue-950">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="h-11 w-full bg-sky-100 px-3 text-blue-950 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-900"
                    placeholder="Re-enter new password"
                    value={resetData.confirmPassword}
                    onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="h-11 flex-1 border border-gray-300 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="h-11 flex-1 bg-blue-900 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:opacity-60"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
