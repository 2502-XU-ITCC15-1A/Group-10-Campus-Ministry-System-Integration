import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const emptyEvent = {
  eventDate: '',
  college: '',
  department: '',
  description: '',
  batch: '',
  yearLevel: '',
  venue: '',
  inCharge: '',
  slots: 40
};

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
    legacyDepartments: ['Engineering', 'BS Civil Engineerring']
  },
  {
    name: 'NURSING',
    value: 'Nursing',
    departments: ['BS Nursing'],
    legacyDepartments: ['Nursing']
  }
];

const getCollegeByValue = (value) => colleges.find((college) => college.value === value);

const getCollegeForDepartment = (department) => colleges.find((college) => (
  college.departments.includes(department) || (college.legacyDepartments || []).includes(department)
));

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCertificates: 0,
    eventsNextWeek: 0,
    eventsThisMonth: 0
  });
  const [events, setEvents] = useState([]);
  const [formators, setFormators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', event: null });
  const [formData, setFormData] = useState(emptyEvent);

  const fetchDashboard = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('keyword', search.trim());
      if (selectedDate) params.append('date', selectedDate);
      params.append('limit', '100');

      const [statsRes, eventsRes, formatorRes] = await Promise.all([
        api.get('/admin/dashboard-cards'),
        api.get(`/admin/events?${params.toString()}`),
        api.get('/admin/formators')
      ]);

      setStats(statsRes.data || {});
      setEvents(eventsRes.data?.data || []);
      setFormators(formatorRes.data || []);
    } catch (error) {
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, [search, selectedDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const statCards = [
    ['Active Students', stats.totalStudents || 0, 'M10 10a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 1114 0H3z'],
    ['Active Certificates', stats.totalCertificates || 0, 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'],
    ['Events - Next Week', stats.eventsNextWeek || 0, 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z'],
    ['Events - This Month', stats.eventsThisMonth || 0, 'M3 4a2 2 0 012-2h1V1a1 1 0 112 0v1h4V1a1 1 0 112 0v1h1a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm2 4v8h10V8H5zm2 2h2v2H7v-2zm4 0h2v2h-2v-2z']
  ];

  const openAddModal = () => {
    setFormData(emptyEvent);
    setModal({ open: true, mode: 'add', event: null });
  };

  const openEditModal = (event) => {
    const eventCollege = getCollegeForDepartment(event.department);
    setFormData({
      eventDate: toDateTimeLocalValue(event.eventDate),
      college: eventCollege?.value || '',
      department: event.department || '',
      description: event.description || '',
      batch: event.batch || '',
      yearLevel: event.yearLevel || '',
      venue: event.venue || '',
      inCharge: event.inCharge || '',
      slots: event.slots ?? 40
    });
    setModal({ open: true, mode: 'edit', event });
  };

  const closeModal = () => {
    setModal({ open: false, mode: 'add', event: null });
    setFormData(emptyEvent);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const required = ['eventDate', 'department', 'description', 'batch', 'yearLevel', 'venue', 'inCharge'];
    const missing = required.some((field) => !formData[field]);
    if (missing) {
      toast.error('Please fill in all event fields');
      return;
    }

    setSaving(true);
    try {
      const { college, ...payload } = formData;
      if (modal.mode === 'edit' && modal.event?._id) {
        await api.put(`/admin/events/${modal.event._id}`, payload);
        toast.success('Event updated successfully');
      } else {
        await api.post('/admin/events', payload);
        toast.success('Event created successfully');
      }
      closeModal();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const filteredEvents = useMemo(() => events, [events]);
  const selectedCollege = getCollegeByValue(formData.college);
  const departmentOptions = selectedCollege
    ? [...(selectedCollege.legacyDepartments || []), ...selectedCollege.departments]
    : [];

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
        DASHBOARD
      </h1>

      <div className="mx-6 space-y-8 lg:mx-9">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(([label, value, icon]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg">
              <div>
                <div className="text-sm font-semibold uppercase text-gray-500">{label}</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
              </div>
              <svg className="h-9 w-9 text-[#3a53a5]" fill="currentColor" viewBox="0 0 20 20">
                <path d={icon} />
              </svg>
            </div>
          ))}
        </div>

        <div>
          <button
            type="button"
            onClick={openAddModal}
            className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a3a85]"
          >
            Add Event
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 border-b px-6 py-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">CMO Event Dates</h2>
              <p className="text-sm text-gray-500">Create, search, filter, edit, and delete CMO events.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events"
                className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5] md:w-56"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-10 border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Department', 'Description', 'Batch', 'Year Level', 'Venue', 'Slots', 'Person in Charge', 'Actions'].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredEvents.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {new Date(event.eventDate).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{event.department}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{event.description}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{event.batch}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{event.yearLevel}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{event.venue}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{event.slots ?? 40}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{event.inCharge}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Link to={`/admin/recollections/${event._id}/registrants`} className="mr-4 font-semibold text-[#3a53a5] hover:underline">Registrants</Link>
                      <button onClick={() => openEditModal(event)} className="mr-4 font-semibold text-[#3a53a5] hover:underline">Edit</button>
                      <button onClick={() => handleDelete(event._id)} className="font-semibold text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEvents.length === 0 && (
              <div className="py-10 text-center text-gray-500">No CMO events found.</div>
            )}
          </div>
        </section>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {modal.mode === 'edit' ? 'Edit Event' : 'Add New Event'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="datetime-local" value={formData.eventDate} onChange={(event) => setFormData({ ...formData, eventDate: event.target.value })} className="h-10 w-full border px-3" />
              <select
                value={formData.college}
                onChange={(event) => setFormData({ ...formData, college: event.target.value, department: '' })}
                className="h-10 w-full border px-3"
              >
                <option value="">Select College</option>
                {colleges.map((college) => <option key={college.value} value={college.value}>{college.name}</option>)}
              </select>
              <select
                value={formData.department}
                onChange={(event) => setFormData({ ...formData, department: event.target.value })}
                disabled={!formData.college}
                className="h-10 w-full border px-3 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Select Department</option>
                {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
              <input placeholder="Description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="h-10 w-full border px-3" />
              <select value={formData.batch} onChange={(event) => setFormData({ ...formData, batch: event.target.value })} className="h-10 w-full border px-3">
                <option value="">Select Batch</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
              </select>
              <select value={formData.yearLevel} onChange={(event) => setFormData({ ...formData, yearLevel: event.target.value })} className="h-10 w-full border px-3">
                <option value="">Select Year Level</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
              </select>
              <input placeholder="Venue" value={formData.venue} onChange={(event) => setFormData({ ...formData, venue: event.target.value })} className="h-10 w-full border px-3" />
              <input type="number" min="0" placeholder="Available Slots" value={formData.slots} onChange={(event) => setFormData({ ...formData, slots: event.target.value })} className="h-10 w-full border px-3" />
              <input list="formator-options" placeholder="Person in Charge" value={formData.inCharge} onChange={(event) => setFormData({ ...formData, inCharge: event.target.value })} className="h-10 w-full border px-3" />
              <datalist id="formator-options">
                {formators.map((formator) => (
                  <option key={formator._id} value={formator.fullName || formator.email}>
                    {formator.email}
                  </option>
                ))}
              </datalist>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Cancel</button>
                <button type="submit" disabled={saving} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-60">
                  {saving ? 'Saving...' : modal.mode === 'edit' ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
