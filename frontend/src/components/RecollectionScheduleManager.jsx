import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const RecollectionScheduleManager = () => {
  const { user } = useContext(AuthContext);
  const facultyYearLevel = user?.batch?.match(/-(\d)/)?.[1] || '1';
  const [recollections, setRecollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    department: user?.role === 'staff' ? user.department || 'Computer Studies' : 'Computer Studies',
    yearLevel: user?.role === 'staff' ? facultyYearLevel : '1',
    facilitator: '',
    slots: 40
  });

  const departments = [
    'Agriculture',
    'Arts and Science',
    'Business Management',
    'Computer Studies',
    'Education',
    'Engineering',
    'Nursing',
    'BS Agribusiness',
    'BS Agriculture',
    'BS Agricultural & Biosystems Engineering',
    'BS Food Technology',
    'BS Development Communication',
    'AB Economics',
    'AB History',
    'AB Interdisciplinary Studies',
    'AB International Studies',
    'AB English Language',
    'AB Literature',
    'AB Philosophy',
    'AB Psychology',
    'AB Sociology',
    'BS Biology',
    'BS Chemistry',
    'BS Marine Biology',
    'BS Mathematics',
    'BS Psychology',
    'BS Accountancy',
    'BS Business Administration',
    'BS Management Accounting',
    'BS Computer Science',
    'BS Information Systems',
    'BS Information Technology',
    'BS Entertainment & Multimedia Computing',
    'Bachelor of Early Childhood Education',
    'Bachelor of Elementary Education',
    'Bachelor of Special Needs Education',
    'Bachelor of Technology and Livelihood Education',
    'Bachelor of Secondary Education',
    'BS Chemical Engineering',
    'BS Civil Engineering',
    'BS Electrical Engineering',
    'BS Electronics Engineering',
    'BS Industrial Engineering',
    'BS Mechanical Engineering',
    'BS Nursing'
  ];

  const yearLevelLabels = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year'
  };

  useEffect(() => {
    fetchRecollections();
  }, []);

  const fetchRecollections = async () => {
    try {
      const response = await api.get('/admin/recollections');
      setRecollections(response.data || []);
    } catch (error) {
      toast.error('Failed to load recollection schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCreating(true);

    try {
      const response = await api.post('/admin/recollections', formData);
      setRecollections((current) => [...current, response.data].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setFormData({
        title: '',
        description: '',
        date: '',
        venue: '',
        department: user?.role === 'staff' ? user.department || 'Computer Studies' : 'Computer Studies',
        yearLevel: user?.role === 'staff' ? facultyYearLevel : '1',
        facilitator: '',
        slots: 40
      });
      const notification = response.data?.emailNotification;
      if (notification) {
        const notified = notification.sent + notification.previewed;
        toast.success(`Recollection schedule created. ${notified}/${notification.matchedStudents} student emails prepared.`);
      } else {
        toast.success('Recollection schedule created');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create recollection schedule');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/recollections/${id}`);
      setRecollections((current) => current.filter((recollection) => recollection._id !== id));
      toast.success('Recollection schedule deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete recollection schedule');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-2xl rounded-3xl p-12 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
            Create Recollection Schedule
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Publish department and year-level recollection sessions for students
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {user?.role === 'staff' && (
            <div className="rounded-2xl bg-yellow-100 p-5 text-yellow-900 font-medium">
              Formator access: you can create recollection schedules for your assigned department/year only. Delete actions remain admin-only.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-3">Title *</label>
              <input
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., First Year Recollection"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Date and Time *</label>
              <input
                type="datetime-local"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Venue *</label>
              <input
                name="venue"
                required
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., Xavier University Chapel"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Facilitator</label>
              <input
                name="facilitator"
                value={formData.facilitator}
                onChange={handleChange}
                placeholder="Campus Ministries Office"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Department *</label>
              <select
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                disabled={user?.role === 'staff'}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Assigned Year Level *</label>
              <select
                name="yearLevel"
                required
                value={formData.yearLevel}
                onChange={handleChange}
                disabled={user?.role === 'staff' && Boolean(user.batch)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Slots</label>
              <input
                type="number"
                min="1"
                name="slots"
                value={formData.slots}
                onChange={handleChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Short description students will see"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Schedule'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Recollections</h2>
          <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
            {recollections.length}
          </span>
        </div>

        {recollections.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No recollection schedules created yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recollections.map((recollection) => {
              const participantCount = recollection.participants?.length || 0;
              return (
                <div key={recollection._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{recollection.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{recollection.description}</p>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <span>Date: {new Date(recollection.date).toLocaleString()}</span>
                        <span>Venue: {recollection.venue}</span>
                        <span>Department: {recollection.department || 'Not set'}</span>
                        <span>Year Level: {yearLevelLabels[recollection.yearLevel] || 'Not set'}</span>
                        <span>Participants: {participantCount}/{recollection.slots || 0}</span>
                        {recollection.facilitator && <span>Facilitator: {recollection.facilitator}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Link
                        to={`/admin/recollections/${recollection._id}/registrants`}
                        className="px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        Registrants
                      </Link>
                      {user?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(recollection._id)}
                          className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecollectionScheduleManager;
