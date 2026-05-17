import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    college: '',
    department: '',
    yearLevel: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const colleges = [
    {
      name: 'AGRICULTURE',
      value: 'Agriculture',
      departments: ['BS Agribusiness', 'BS Agriculture', 'BS Agricultural & Biosystems Engineering', 'BS Food Technology', 'BS Development Communication'],
      legacyDepartments: ['Agriculture']
    },
    {
      name: 'ARTS & SCIENCES',
      value: 'Arts Science',
      departments: ['AB Economics', 'AB History', 'AB Interdisciplinary Studies', 'AB International Studies', 'AB English Language', 'AB Literature', 'AB Philosophy', 'AB Psychology', 'AB Sociology', 'BS Biology', 'BS Chemistry', 'BS Marine Biology', 'BS Mathematics', 'BS Psychology'],
      legacyDepartments: ['Arts and Science', 'Arts and Sciences']
    },
    {
      name: 'BUSINESS MANAGEMENT',
      value: 'Business Management',
      departments: ['BS Accountancy', 'BS Business Administration', 'BS Management Accounting'],
      legacyDepartments: ['Business Management']
    },
    {
      name: 'COMPUTER STUDIES',
      value: 'Computer Studies',
      departments: ['BS Computer Science', 'BS Information Systems', 'BS Information Technology', 'BS Entertainment & Multimedia Computing'],
      legacyDepartments: ['Computer Studies']
    },
    {
      name: 'EDUCATION',
      value: 'Education',
      departments: ['Bachelor of Early Childhood Education', 'Bachelor of Elementary Education', 'Bachelor of Special Needs Education', 'Bachelor of Technology and Livelihood Education', 'Bachelor of Secondary Education'],
      legacyDepartments: ['Education']
    },
    {
      name: 'ENGINEERING',
      value: 'Engineering',
      departments: ['BS Chemical Engineering', 'BS Civil Engineering', 'BS Electrical Engineering', 'BS Electronics Engineering', 'BS Industrial Engineering', 'BS Mechanical Engineering'],
      legacyDepartments: ['Engineering']
    },
    {
      name: 'NURSING',
      value: 'Nursing',
      departments: ['BS Nursing'],
      legacyDepartments: ['Nursing']
    }
  ];

  const yearLevelLabels = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year'
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      setProfile(response.data);
      setFormData({
        college: response.data.college || '',
        department: response.data.department || '',
        yearLevel: response.data.yearLevel || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'college' ? { department: '' } : {})
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.college || !formData.department || !formData.yearLevel) {
      toast.error('Please complete your college, department, and year level');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/student/profile', formData);
      setProfile(response.data.profile);
      updateUser(response.data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedCollege = colleges.find((college) => college.value === formData.college);
  const departmentOptions = selectedCollege
    ? [...(selectedCollege.legacyDepartments || []), ...selectedCollege.departments]
    : [];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Student Profile
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Manage your academic details for evaluations, certificates, and recollection schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="p-3 bg-blue-100 rounded-xl w-fit mb-5">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 18a8 8 0 1116 0H2z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">Student</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{user.fullName}</p>
          <p className="text-sm text-gray-500 mt-2">{profile?.email}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="p-3 bg-green-100 rounded-xl w-fit mb-5">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.053a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.69-.824V9.397zM6 14.683V10.55l3.212 1.377a2 2 0 001.576 0L14 10.55v4.133A8.998 8.998 0 016 14.683zM15 14.222V10.12l1.69-.724v4.002a8.969 8.969 0 00-1.69.824z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">College</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{profile?.college || 'Not set'}</p>
          <p className="text-sm text-gray-500 mt-2">{yearLevelLabels[profile?.yearLevel] || 'Year level required'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="p-3 bg-indigo-100 rounded-xl w-fit mb-5">
            <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v14l-6-3-6 3V4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">Department</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{profile?.department || 'Not set'}</p>
          <p className="text-sm text-gray-500 mt-2">Used for schedule matching</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className={`p-3 rounded-xl w-fit mb-5 ${profile?.profileComplete ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <svg className={`w-8 h-8 ${profile?.profileComplete ? 'text-green-600' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">Status</p>
          <p className={`text-2xl font-bold mt-1 ${profile?.profileComplete ? 'text-green-700' : 'text-yellow-700'}`}>
            {profile?.profileComplete ? 'Complete' : 'Required'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Google accounts may need manual setup</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Academic Details</h2>
          <p className="text-gray-600 mt-2">
            Choose the values that match your school record.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="college" className="block text-sm font-medium text-gray-700">College</label>
            <select
              id="college"
              name="college"
              value={formData.college}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select College</option>
              {colleges.map((college) => (
                <option key={college.value} value={college.value}>{college.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={!formData.college}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Department</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700">Year Level</label>
            <select
              id="yearLevel"
              name="yearLevel"
              value={formData.yearLevel}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Year</option>
              {Object.entries(yearLevelLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
