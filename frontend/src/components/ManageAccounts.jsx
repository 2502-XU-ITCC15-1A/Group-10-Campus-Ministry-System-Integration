import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const emptyAccount = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'staff',
  status: 'active'
};

const MAIN_ADMIN_EMAIL = 'dfabela@xu.edu.ph';

const displayRole = (role) => {
  if (role === 'admin') return 'Admin';
  if (role === 'staff') return 'Formator';
  return role || 'Formator';
};

const ManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', user: null });
  const [confirmChange, setConfirmChange] = useState(null);
  const [formData, setFormData] = useState(emptyAccount);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers((response.data || []).filter((user) => ['admin', 'staff'].includes(user.role)));
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [user.fullName, user.email, user.role].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [users, search]);

  const openAdd = () => {
    setFormData(emptyAccount);
    setModal({ open: true, mode: 'add', user: null });
  };

  const openEdit = (user) => {
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      role: user.role === 'admin' ? 'admin' : 'staff',
      status: user.status || 'active'
    });
    setModal({ open: true, mode: 'edit', user });
  };

  const closeModal = () => {
    setFormData(emptyAccount);
    setModal({ open: false, mode: 'add', user: null });
    setConfirmChange(null);
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email) {
      toast.error('Please fill in name and email');
      return false;
    }

    if (!['admin', 'staff'].includes(formData.role)) {
      toast.error('Please select a valid account role');
      return false;
    }

    if (!String(formData.email).toLowerCase().endsWith('@xu.edu.ph')) {
      toast.error('Admin and formator accounts must use @xu.edu.ph email');
      return false;
    }

    if (modal.mode === 'add' && !formData.password) {
      toast.error('Password is required for new accounts');
      return false;
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const saveAccount = async (payload) => {
    setSaving(true);
    try {
      if (modal.mode === 'edit' && modal.user?._id) {
        await api.put(`/admin/users/${modal.user._id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/admin/users', payload);
        toast.success('User created successfully');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
      setConfirmChange(null);
    }
  };

  const getSensitiveChanges = () => {
    if (modal.mode !== 'edit' || !modal.user) return [];
    const changes = [];
    const currentRole = modal.user.role === 'admin' ? 'admin' : 'staff';
    const currentStatus = modal.user.status || 'active';

    if (formData.role !== currentRole) {
      changes.push(`Role: ${displayRole(currentRole)} to ${displayRole(formData.role)}`);
    }

    if (formData.status !== currentStatus) {
      changes.push(`Status: ${currentStatus === 'active' ? 'Active' : 'Inactive'} to ${formData.status === 'active' ? 'Active' : 'Inactive'}`);
    }

    return changes;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = { ...formData };
    delete payload.confirmPassword;
    if (!payload.password) delete payload.password;

    const sensitiveChanges = getSensitiveChanges();
    if (sensitiveChanges.length > 0) {
      setConfirmChange({ payload, changes: sensitiveChanges });
      return;
    }

    await saveAccount(payload);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const isMainAdmin = (user) => String(user.email || '').toLowerCase() === MAIN_ADMIN_EMAIL;

  if (loading) {
    return (
      <div className="-m-6 flex min-h-screen items-center justify-center bg-[#edf0f7]">
        <div className="h-24 w-24 animate-spin rounded-full border-b-2 border-[#3a53a5]" />
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        MANAGE ACCOUNTS
      </h1>

      <div className="mx-6 space-y-8 lg:mx-9">
        <div>
          <button onClick={openAdd} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]">
            Add Account
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 border-b px-6 py-4 lg:flex-row lg:items-center">
            <h2 className="text-xl font-semibold text-gray-900">System Accounts</h2>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5] sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{user.fullName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{displayRole(user.role)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`rounded px-3 py-1 text-xs font-semibold ${
                        (user.status || 'active') === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {(user.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button onClick={() => openEdit(user)} className="mr-4 font-semibold text-[#3a53a5] hover:underline">Edit</button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        disabled={isMainAdmin(user)}
                        className="font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <div className="py-10 text-center text-gray-500">No system accounts found.</div>}
          </div>
        </section>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">{modal.mode === 'edit' ? 'Edit Account' : 'Add New Account'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} placeholder="Name" className="h-10 w-full border px-3" />
              <input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="Email" className="h-10 w-full border px-3" />
              <input type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} placeholder={modal.mode === 'edit' ? 'New password (optional)' : 'Password'} className="h-10 w-full border px-3" />
              <input type="password" value={formData.confirmPassword} onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })} placeholder="Confirm Password" className="h-10 w-full border px-3" />
              <select
                value={formData.role}
                onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                disabled={modal.mode === 'edit' && modal.user && isMainAdmin(modal.user)}
                className="h-10 w-full border px-3 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="staff">Formator</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                disabled={modal.mode === 'edit' && modal.user && isMainAdmin(modal.user)}
                className="h-10 w-full border px-3 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Cancel</button>
                <button type="submit" disabled={saving} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-60">
                  {saving ? 'Saving...' : modal.mode === 'edit' ? 'Update Account' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmChange && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">Confirm Account Change</h2>
            <p className="mt-2 text-sm text-gray-600">
              This will change the account access for {modal.user?.fullName || 'this user'}. Please confirm before saving.
            </p>
            <div className="mt-5 rounded-lg bg-[#edf0f7] p-4">
              <p className="text-sm font-semibold text-gray-700">Changes to apply:</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {confirmChange.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmChange(null)}
                disabled={saving}
                className="bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-60"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={() => saveAccount(confirmChange.payload)}
                disabled={saving}
                className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Confirm Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccounts;
