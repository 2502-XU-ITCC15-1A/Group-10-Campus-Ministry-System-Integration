import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const emptyStudent = {
  studentId: '',
  college: '',
  department: '',
  email: '',
  firstName: '',
  lastName: '',
  yearStanding: ''
};

const colleges = [
  {
    key: 'Agriculture',
    name: 'AGRICULTURE',
    value: 'Agriculture',
    departments: ['BS Agribusiness', 'BS Agriculture', 'BS Agricultural & Biosystems Engineering', 'BS Food Technology', 'BS Development Communication'],
    legacyDepartments: ['Agriculture']
  },
  {
    key: 'ArtsScience',
    name: 'ARTS & SCIENCES',
    value: 'Arts Science',
    departments: ['AB Economics', 'AB History', 'AB Interdisciplinary Studies', 'AB International Studies', 'AB English Language', 'AB Literature', 'AB Philosophy', 'AB Psychology', 'AB Sociology', 'BS Biology', 'BS Chemistry', 'BS Marine Biology', 'BS Mathematics', 'BS Psychology'],
    legacyDepartments: ['Arts and Science', 'Arts and Sciences']
  },
  {
    key: 'BusinessManagement',
    name: 'BUSINESS MANAGEMENT',
    value: 'Business Management',
    departments: ['BS Accountancy', 'BS Business Administration', 'BS Management Accounting'],
    legacyDepartments: ['Business Management']
  },
  {
    key: 'ComputerStudies',
    name: 'COMPUTER STUDIES',
    value: 'Computer Studies',
    departments: ['BS Computer Science', 'BS Information Systems', 'BS Information Technology', 'BS Entertainment & Multimedia Computing'],
    legacyDepartments: ['Computer Studies']
  },
  {
    key: 'Education',
    name: 'EDUCATION',
    value: 'Education',
    departments: ['Bachelor of Early Childhood Education', 'Bachelor of Elementary Education', 'Bachelor of Special Needs Education', 'Bachelor of Technology and Livelihood Education', 'Bachelor of Secondary Education'],
    legacyDepartments: ['Education']
  },
  {
    key: 'Engineering',
    name: 'ENGINEERING',
    value: 'Engineering',
    departments: ['BS Chemical Engineering', 'BS Civil Engineering', 'BS Electrical Engineering', 'BS Electronics Engineering', 'BS Industrial Engineering', 'BS Mechanical Engineering'],
    legacyDepartments: ['Engineering', 'BS Civil Engineerring']
  },
  {
    key: 'Nursing',
    name: 'NURSING',
    value: 'Nursing',
    departments: ['BS Nursing'],
    legacyDepartments: ['Nursing']
  }
];

const departmentBelongsToCollege = (student, college) => {
  if (!college) return true;
  const allowed = [...college.departments, ...(college.legacyDepartments || [])];
  return allowed.includes(student.department) || student.college === college.value || student.college === college.key;
};

const getDepartmentOptions = (college) => college?.departments || [];

const getCollegeForStudent = (student) => {
  if (!student) return null;
  return colleges.find((college) => departmentBelongsToCollege(student, college)) || null;
};

const StudentRecords = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [modal, setModal] = useState({ open: false, mode: 'add', student: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(emptyStudent);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data || []);
    } catch (error) {
      toast.error('Failed to load student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesCollege = departmentBelongsToCollege(student, selectedCollege);
      const matchesDepartment = departmentFilter ? student.department === departmentFilter : true;
      const matchesSearch = keyword
        ? [student.fullName, student.email, student.studentId, student.department].some((value) =>
            String(value || '').toLowerCase().includes(keyword)
          )
        : true;
      return matchesCollege && matchesDepartment && matchesSearch;
    });
  }, [students, search, departmentFilter, selectedCollege]);

  const selectedCollegeStudents = students.filter((student) => (
    departmentBelongsToCollege(student, selectedCollege)
  ));

  const stats = [
    ['Student Records', selectedCollegeStudents.length],
    ['Complete', selectedCollegeStudents.filter((student) => (student.certificateCount || 0) >= 4).length],
    ['Incomplete', selectedCollegeStudents.filter((student) => (student.certificateCount || 0) < 4).length],
    ['Departments', new Set(selectedCollegeStudents.map((student) => student.department).filter(Boolean)).size]
  ];

  const openAdd = () => {
    setFormData({
      ...emptyStudent,
      college: selectedCollege?.value || '',
      department: ''
    });
    setModal({ open: true, mode: 'add', student: null });
  };

  const openEdit = (student) => {
    const studentCollege = getCollegeForStudent(student) || selectedCollege;
    setFormData({
      studentId: student.studentId || '',
      college: studentCollege?.value || student.college || '',
      department: student.department || '',
      email: student.email || '',
      firstName: student.firstName || String(student.fullName || '').split(' ').slice(0, -1).join(' '),
      lastName: student.lastName || String(student.fullName || '').split(' ').slice(-1)[0] || '',
      yearStanding: student.yearStanding || String(student.batch || '').match(/-(\d)/)?.[1] || ''
    });
    setModal({ open: true, mode: 'edit', student });
  };

  const closeModal = () => {
    setFormData(emptyStudent);
    setModal({ open: false, mode: 'add', student: null });
  };

  const validateForm = () => {
    if (!formData.studentId || !formData.department || !formData.email || !formData.firstName || !formData.lastName || !formData.yearStanding) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (!/^\d+$/.test(formData.studentId)) {
      toast.error('Student ID must contain only numbers');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = { ...formData, college: selectedCollege?.value || formData.college, major: '' };
      if (modal.mode === 'edit' && modal.student?._id) {
        await api.put(`/admin/students/${modal.student._id}`, payload);
        toast.success('Student updated successfully');
      } else {
        await api.post('/admin/students', payload);
        toast.success('Student created successfully');
      }
      closeModal();
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await api.delete(`/admin/students/${deleteTarget._id}`);
      toast.success('Student deleted successfully');
      setDeleteTarget(null);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    }
  };

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
        STUDENT RECORDS
      </h1>

      <div className="mx-6 space-y-8 lg:mx-9">
        {!selectedCollege ? (
          <section className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Colleges</h2>
              <p className="text-sm text-gray-500">Select a college to view and manage its student records.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
              {colleges.map((college) => (
                <button
                  key={college.value}
                  type="button"
                  onClick={() => {
                    setSelectedCollege(college);
                    setDepartmentFilter('');
                    setSearch('');
                  }}
                  className="relative flex h-40 flex-col items-center justify-center overflow-hidden rounded bg-white p-4 text-xl font-semibold text-gray-900 shadow-lg ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf0f7]">
                    <img src="/assets/CMO_Seal.png" alt="" className="h-12 w-12 object-contain opacity-80" />
                  </div>
                  <span>{college.name}</span>
                  <span className="mt-2 text-sm font-medium text-[#3a53a5]">
                    {students.filter((student) => departmentBelongsToCollege(student, college)).length} records
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <>
            <div className="rounded-lg bg-white p-5 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setSelectedCollege(null);
                  setDepartmentFilter('');
                  setSearch('');
                }}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#3a53a5] hover:underline"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Colleges
              </button>
              <div>
                <p className="text-sm font-semibold uppercase text-gray-500">Selected College</p>
                <h2 className="text-2xl font-bold text-[#3a53a5]">{selectedCollege.name}</h2>
              </div>
            </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border-l-4 border-[#3a53a5] bg-white p-6 shadow-lg">
              <div>
                <div className="text-sm font-semibold uppercase text-gray-500">{label}</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
              </div>
              <svg className="h-9 w-9 text-[#3a53a5]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4C3.567 4 2 4.895 2 6v9c0 1.105 1.567 2 3.5 2 1.292 0 2.42-.4 3-1 .58.6 1.708 1 3 1 1.933 0 3.5-.895 3.5-2V6c0-1.105-1.567-2-3.5-2a7.968 7.968 0 00-3.5.804z" />
              </svg>
            </div>
          ))}
        </div>

        <div>
          <button onClick={openAdd} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]">
            Add Student
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 border-b px-6 py-4 xl:flex-row xl:items-center">
            <h2 className="text-xl font-semibold text-gray-900">Student List</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5] md:w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Student ID', 'Last Name', 'First Name', 'Department', 'Year Standing', 'Certificates', 'Actions'].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#3a53a5]">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/student-records/profile/${student.studentId}`)}
                        className="text-left text-[#3a53a5] underline hover:text-[#2a3a85]"
                      >
                        {student.studentId}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.lastName || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.firstName || student.fullName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.department || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.yearStanding || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.certificateCount || 0}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button onClick={() => openEdit(student)} className="mr-4 font-semibold text-[#3a53a5] hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(student)} className="font-semibold text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && <div className="py-10 text-center text-gray-500">No students found.</div>}
          </div>
        </section>
          </>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">{modal.mode === 'edit' ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={formData.studentId} onChange={(event) => setFormData({ ...formData, studentId: event.target.value })} disabled={modal.mode === 'edit'} placeholder="Student ID" className="h-10 w-full border px-3 disabled:bg-gray-100" />
              <input value={selectedCollege?.name || formData.college} readOnly className="h-10 w-full border bg-gray-100 px-3 text-gray-600" />
              <select value={formData.department} onChange={(event) => setFormData({ ...formData, department: event.target.value })} className="h-10 w-full border px-3">
                <option value="">Select Department</option>
                {getDepartmentOptions(selectedCollege || getCollegeForStudent({ ...modal.student, department: formData.department, college: formData.college })).map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
              <input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="Email" className="h-10 w-full border px-3" />
              <input value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} placeholder="First Name" className="h-10 w-full border px-3" />
              <input value={formData.lastName} onChange={(event) => setFormData({ ...formData, lastName: event.target.value })} placeholder="Last Name" className="h-10 w-full border px-3" />
              <select value={formData.yearStanding} onChange={(event) => setFormData({ ...formData, yearStanding: event.target.value })} className="h-10 w-full border px-3">
                <option value="">Select Year Level</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
              </select>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Cancel</button>
                <button type="submit" disabled={saving} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-60">
                  {saving ? 'Saving...' : modal.mode === 'edit' ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 19h14.14a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16a2 2 0 001.73 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delete Student Account?</h2>
            <p className="mt-2 text-sm text-gray-600">
              This will remove {deleteTarget.fullName || `${deleteTarget.firstName || ''} ${deleteTarget.lastName || ''}`.trim() || 'this student'} from the student records.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} className="bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRecords;
