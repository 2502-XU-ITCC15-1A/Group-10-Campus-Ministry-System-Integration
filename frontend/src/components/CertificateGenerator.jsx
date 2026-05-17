import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const collegeDepartments = {
  Agriculture: ['BS Agribusiness', 'BS Agriculture', 'BS Agricultural & Biosystems Engineering', 'BS Food Technology', 'BS Development Communication'],
  ArtsScience: ['AB Economics', 'AB History', 'AB Interdisciplinary Studies', 'AB International Studies', 'AB English Language', 'AB Literature', 'AB Philosophy', 'AB Psychology', 'AB Sociology', 'BS Biology', 'BS Chemistry', 'BS Marine Biology', 'BS Mathematics', 'BS Psychology'],
  BusinessManagement: ['BS Accountancy', 'BS Business Administration', 'BS Management Accounting'],
  ComputerStudies: ['BS Computer Science', 'BS Information Systems', 'BS Information Technology', 'BS Entertainment & Multimedia Computing'],
  Education: ['Bachelor of Early Childhood Education', 'Bachelor of Elementary Education', 'Bachelor of Special Needs Education', 'Bachelor of Technology and Livelihood Education', 'Bachelor of Secondary Education'],
  Engineering: ['BS Chemical Engineering', 'BS Civil Engineering', 'BS Electrical Engineering', 'BS Electronics Engineering', 'BS Industrial Engineering', 'BS Mechanical Engineering'],
  Nursing: ['BS Nursing']
};

const emptyStudent = {
  studentId: '',
  firstName: '',
  lastName: '',
  college: '',
  department: '',
  yearStanding: '',
  email: ''
};

const collegeAliases = {
  Agriculture: 'Agriculture',
  'Arts Science': 'ArtsScience',
  'Arts and Science': 'ArtsScience',
  'Arts and Sciences': 'ArtsScience',
  ArtsScience: 'ArtsScience',
  'Business Management': 'BusinessManagement',
  BusinessManagement: 'BusinessManagement',
  'Computer Studies': 'ComputerStudies',
  ComputerStudies: 'ComputerStudies',
  Education: 'Education',
  Engineering: 'Engineering',
  Nursing: 'Nursing'
};

const normalizeCollegeKey = (value, department) => {
  if (collegeAliases[value]) return collegeAliases[value];
  if (collegeAliases[department]) return collegeAliases[department];
  const match = Object.entries(collegeDepartments).find(([, departments]) => departments.includes(department));
  return match?.[0] || '';
};

const parseCsv = (text) => {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = headerLine.split(',').map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce((row, header, index) => ({ ...row, [header]: values[index] || '' }), {});
  });
};

const normalizeYearLevel = (value = '') => {
  const text = String(value || '').trim();
  const match = text.match(/[1-4]/);
  return match ? match[0] : text;
};

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const getDuplicateWarnings = (rows) => {
  const seenStudentIds = new Map();
  const seenEmails = new Map();
  const duplicateMessages = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const studentId = String(row.studentId || '').trim();
    const email = normalizeEmail(row.email);

    if (studentId) {
      if (seenStudentIds.has(studentId)) {
        duplicateMessages.push(`Student ID ${studentId} appears more than once in the CSV, rows ${seenStudentIds.get(studentId)} and ${rowNumber}.`);
      } else {
        seenStudentIds.set(studentId, rowNumber);
      }
    }

    if (email) {
      if (seenEmails.has(email)) {
        duplicateMessages.push(`Email ${email} appears more than once in the CSV, rows ${seenEmails.get(email)} and ${rowNumber}.`);
      } else {
        seenEmails.set(email, rowNumber);
      }
    }
  });

  return [...new Set(duplicateMessages)];
};

const CertificateGenerator = () => {
  const [mode, setMode] = useState('generate');
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stagedStudents, setStagedStudents] = useState([]);
  const [mailData, setMailData] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [csvFileName, setCsvFileName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState({ open: false, rows: [], messages: [] });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    const [studentResponse, templateResponse] = await Promise.all([
      api.get('/admin/students'),
      api.get('/admin/certificate-templates')
    ]);
    setStudents(studentResponse.data || []);
    setTemplates(templateResponse.data || []);
  };

  useEffect(() => {
    fetchData().catch(() => toast.error('Failed to load certificate data'));
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template._id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const studentSuggestions = useMemo(() => {
    const keyword = [
      studentForm.studentId,
      studentForm.firstName,
      studentForm.lastName,
      studentForm.email
    ].join(' ').trim().toLowerCase();

    if (keyword.length < 2) return [];

    return students
      .filter((student) => (
        [student.studentId, student.firstName, student.lastName, student.fullName, student.email]
          .some((value) => String(value || '').toLowerCase().includes(keyword))
      ))
      .slice(0, 5);
  }, [students, studentForm.email, studentForm.firstName, studentForm.lastName, studentForm.studentId]);

  const resetContext = () => {
    setMode('generate');
    setStagedStudents([]);
    setMailData([]);
    setSelectedTemplateId('');
    setStudentForm(emptyStudent);
    setCsvFileName('');
  };

  const validateStudent = (student) => {
    if (!student.studentId || !student.firstName || !student.lastName || !student.college || !student.department || !student.yearStanding || !student.email) {
      toast.error('Please fill out all student fields');
      return false;
    }
    if (!/^\d+$/.test(student.studentId)) {
      toast.error('Student ID must contain only numbers');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const buildStudentForm = (student) => {
    const nameParts = String(student.fullName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = student.firstName || nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
    const lastName = student.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
    const college = normalizeCollegeKey(student.college, student.department);
    return {
      studentId: student.studentId || '',
      firstName,
      lastName,
      college,
      department: student.department || '',
      yearStanding: normalizeYearLevel(student.yearStanding || String(student.batch || '').match(/-(\d)/)?.[1] || ''),
      email: student.email || ''
    };
  };

  const applyStudentSuggestion = (student) => {
    setStudentForm(buildStudentForm(student));
    toast.success('Student details filled');
  };

  const handleSoloFieldChange = (field, value) => {
    const nextForm = { ...studentForm, [field]: value };
    if (field === 'college') nextForm.department = '';

    if (field === 'studentId' || field === 'email') {
      const exactMatch = students.find((student) =>
        String(student[field] || '').toLowerCase() === String(value || '').trim().toLowerCase()
      );
      if (exactMatch) {
        setStudentForm(buildStudentForm(exactMatch));
        return;
      }
    }

    setStudentForm(nextForm);
  };

  const handleUploadSolo = () => {
    if (!validateStudent(studentForm)) return;
    setStagedStudents([{ ...studentForm, id: studentForm.studentId }]);
    toast.success('Upload successful');
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const text = await file.text();
    const rows = parseCsv(text).map((row) => ({
      id: row.studentId || row.StudentID || row['Student ID'],
      studentId: row.studentId || row.StudentID || row['Student ID'] || '',
      firstName: row.firstName || row.FirstName || row['First Name'] || '',
      lastName: row.lastName || row.LastName || row['Last Name'] || '',
      college: row.college || row.College || '',
      department: row.department || row.Department || '',
      yearStanding: normalizeYearLevel(row.yearStanding || row.YearStanding || row['Year Standing'] || row.yearLevel || row.YearLevel || row['Year Level'] || ''),
      email: normalizeEmail(row.email || row.Email || '')
    })).filter((row) => row.studentId);

    const missingRequired = rows.filter((row) => !row.firstName || !row.lastName || !row.email || !row.yearStanding);
    if (missingRequired.length > 0) {
      toast.error('Some CSV rows are missing name, email, or year level');
      event.target.value = '';
      return;
    }

    const duplicateMessages = getDuplicateWarnings(rows);
    if (duplicateMessages.length > 0) {
      setDuplicateWarning({ open: true, rows, messages: duplicateMessages });
      event.target.value = '';
      return;
    }

    setStagedStudents(rows);
    toast.success(`${rows.length} student${rows.length === 1 ? '' : 's'} uploaded`);
    event.target.value = '';
  };

  const confirmDuplicateUpload = () => {
    setStagedStudents(duplicateWarning.rows);
    toast.success(`${duplicateWarning.rows.length} student${duplicateWarning.rows.length === 1 ? '' : 's'} uploaded`);
    setDuplicateWarning({ open: false, rows: [], messages: [] });
  };

  const confirmRemoveUploadedStudent = () => {
    if (!deleteTarget) return;
    const isSameStudent = (student) => (
      (deleteTarget.certificateId && student.certificateId === deleteTarget.certificateId) ||
      (deleteTarget.studentId && student.studentId === deleteTarget.studentId) ||
      (deleteTarget.email && normalizeEmail(student.email) === normalizeEmail(deleteTarget.email))
    );
    setStagedStudents((current) => current.filter((student) => !isSameStudent(student)));
    setMailData((current) => current.filter((student) => !isSameStudent(student)));
    setDeleteTarget(null);
    toast.success('Student removed from batch');
  };

  const assignCertificateIds = () => {
    if (stagedStudents.length === 0) {
      toast.error('Upload student data first');
      return;
    }

    const duplicateMessages = getDuplicateWarnings(stagedStudents);
    if (duplicateMessages.length > 0) {
      toast.error('Please remove duplicate students or emails before assigning certificate IDs');
      return;
    }

    setMailData(stagedStudents.map((student) => ({
      ...student,
      certificateId: `CERT-${student.studentId}-${Date.now()}`
    })));
    setMode('mail');
    toast.success('Certificates have been assigned successfully');
  };

  const findOrCreateStudent = async (student) => {
    const existing = students.find((item) => item.studentId === student.studentId || normalizeEmail(item.email) === normalizeEmail(student.email));
    if (existing) return existing;

    const response = await api.post('/admin/students', student);
    await fetchData();
    return response.data;
  };

  const generateCertificates = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a certificate template');
      return;
    }

    setGenerating(true);
    try {
      const eventName = selectedTemplate.certEventType || selectedTemplate.templateTitle;
      const eventDate = selectedTemplate.certEventDate || new Date().toISOString().slice(0, 10);

      for (const student of mailData) {
        const savedStudent = await findOrCreateStudent(student);
        await api.post('/admin/certificates', {
          studentId: savedStudent._id,
          eventName,
          eventDate,
          templateId: selectedTemplate._id
        });
      }

      toast.success('Certificates generated. Emails will be sent out shortly.');
      resetContext();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate certificates');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        GENERATE CERTIFICATE
      </h1>

      <div className="mx-auto max-w-5xl px-6">
        <section className="rounded-lg bg-white p-8 shadow-lg">
          {mode === 'generate' && (
            <>
              <h2 className="mb-10 text-center text-2xl font-semibold">GENERATION MODE</h2>
              <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
                <button onClick={() => setMode('solo')} className="flex h-56 w-56 flex-col items-center justify-center rounded-lg bg-[#3a53a5] p-6 text-white shadow-lg hover:bg-[#2a3a85]">
                  <svg className="mb-4 h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
                  </svg>
                  <span className="text-xl font-semibold">SOLO</span>
                </button>
                <span className="text-xl text-gray-600">OR</span>
                <button onClick={() => setMode('batch')} className="flex h-56 w-56 flex-col items-center justify-center rounded-lg bg-[#3a53a5] p-6 text-white shadow-lg hover:bg-[#2a3a85]">
                  <svg className="mb-4 h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20.25a5.25 5.25 0 00-10.5 0M12 12.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM20.25 19.5a4.5 4.5 0 00-3.75-4.43M3.75 19.5a4.5 4.5 0 013.75-4.43" />
                  </svg>
                  <span className="text-xl font-semibold">BATCH</span>
                </button>
              </div>
            </>
          )}

          {mode === 'solo' && (
            <>
              <div className="mb-4 flex items-center">
                <button onClick={resetContext} className="text-[#3a53a5] hover:underline">Back</button>
                <h2 className="flex-grow text-center text-2xl font-semibold">SOLO GENERATION</h2>
              </div>
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <input placeholder="STUDENT ID NO." value={studentForm.studentId} onChange={(event) => handleSoloFieldChange('studentId', event.target.value)} className="rounded-lg border-2 p-3" />
                <input placeholder="FIRST NAME" value={studentForm.firstName} onChange={(event) => handleSoloFieldChange('firstName', event.target.value)} className="rounded-lg border-2 p-3" />
                <input placeholder="LAST NAME" value={studentForm.lastName} onChange={(event) => handleSoloFieldChange('lastName', event.target.value)} className="rounded-lg border-2 p-3" />
                {studentSuggestions.length > 0 && (
                  <div className="rounded-lg border border-[#3a53a5]/30 bg-[#edf0f7] p-3 md:col-span-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Student Suggestions</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {studentSuggestions.map((student) => (
                        <button
                          key={student._id || student.studentId}
                          type="button"
                          onClick={() => applyStudentSuggestion(student)}
                          className="rounded border bg-white px-3 py-2 text-left text-sm hover:border-[#3a53a5]"
                        >
                          <span className="block font-semibold text-gray-900">{student.fullName || `${student.firstName || ''} ${student.lastName || ''}`}</span>
                          <span className="block text-xs text-gray-500">{student.studentId} • {student.email}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <select value={studentForm.college} onChange={(event) => handleSoloFieldChange('college', event.target.value)} className="rounded-lg border-2 p-3">
                  <option value="">Select College</option>
                  {Object.keys(collegeDepartments).map((college) => <option key={college} value={college}>{college.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
                <select value={studentForm.department} onChange={(event) => handleSoloFieldChange('department', event.target.value)} className="rounded-lg border-2 p-3" disabled={!studentForm.college}>
                  <option value="">Select Department</option>
                  {(collegeDepartments[studentForm.college] || []).map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
                <select value={studentForm.yearStanding} onChange={(event) => handleSoloFieldChange('yearStanding', event.target.value)} className="rounded-lg border-2 p-3">
                  <option value="">Select Year Level</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
                <input placeholder="XU EMAIL" value={studentForm.email} onChange={(event) => handleSoloFieldChange('email', event.target.value)} className="rounded-lg border-2 p-3 md:col-span-2" />
              </div>
              <button onClick={handleUploadSolo} disabled={stagedStudents.length > 0} className="rounded-lg bg-[#3a53a5] px-4 py-2 font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-50">Upload</button>
              <StudentPreview rows={stagedStudents} onRemove={setDeleteTarget} />
              <div className="text-right">
                <button onClick={assignCertificateIds} disabled={stagedStudents.length === 0} className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50">Assign Certificate IDs</button>
              </div>
            </>
          )}

          {mode === 'batch' && (
            <>
              <div className="mb-4 flex items-center">
                <button onClick={resetContext} className="text-[#3a53a5] hover:underline">Back</button>
                <h2 className="flex-grow text-center text-2xl font-semibold">BATCH GENERATION</h2>
              </div>
              <label className="mb-2 block text-sm font-bold text-gray-700">Please upload CSV file</label>
              <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="rounded border px-3 py-2" />
              {csvFileName && <p className="mt-2 text-sm text-gray-500">{csvFileName}</p>}
              <div className="mt-4 flex gap-3">
                <button onClick={() => document.querySelector('input[type=file]')?.click()} className="rounded bg-[#3a53a5] px-4 py-2 font-semibold text-white hover:bg-[#2a3a85]">Upload</button>
                <button onClick={assignCertificateIds} disabled={stagedStudents.length === 0} className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50">Create Certificates</button>
              </div>
              <StudentPreview rows={stagedStudents} onRemove={setDeleteTarget} />
            </>
          )}

          {mode === 'mail' && (
            <>
              <div className="mb-5 flex items-center justify-between rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <input value={selectedTemplateId} readOnly placeholder="Selected Template ID" className="h-11 flex-1 border px-3" />
                <button onClick={() => setTemplateModalOpen(true)} className="ml-4 rounded bg-[#3a53a5] px-4 py-2 font-semibold text-white hover:bg-[#2a3a85]">Select Template</button>
              </div>
              <StudentPreview rows={mailData} showCertificate onRemove={setDeleteTarget} />
              <div className="mt-5 text-right">
                <button onClick={generateCertificates} disabled={generating || !selectedTemplateId} className="rounded bg-[#3a53a5] px-4 py-2 font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate Certificates'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Select Template</h2>
              <button onClick={() => setTemplateModalOpen(false)} className="text-sm font-semibold text-red-600">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {templates.map((template) => (
                <button
                  key={template._id}
                  onClick={() => {
                    setSelectedTemplateId(template._id);
                    setTemplateModalOpen(false);
                  }}
                  className="relative min-h-40 rounded-md border border-[#3a53a5] bg-white p-8 text-center hover:bg-blue-50"
                  style={template.certBgImgKey ? { backgroundImage: `url(${template.certBgImgKey})`, backgroundSize: 'cover' } : undefined}
                >
                  <span className="absolute inset-0 bg-white/60" />
                  <span className="relative font-bold text-gray-900">{template.templateTitle}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {duplicateWarning.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">Duplicate Students Found</h2>
            <p className="mt-2 text-sm text-gray-600">
              Some student IDs or emails are already in the CSV or student records. Are you sure you want to upload this batch?
            </p>
            <div className="mt-4 max-h-52 overflow-y-auto bg-[#edf0f7] p-3 text-sm text-gray-700">
              {duplicateWarning.messages.map((message) => (
                <p key={message} className="mb-2">{message}</p>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDuplicateWarning({ open: false, rows: [], messages: [] })}
                className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDuplicateUpload}
                className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]"
              >
                Upload Anyway
              </button>
            </div>
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
            <h2 className="text-xl font-bold text-gray-900">Delete Selected Student?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to remove {deleteTarget.firstName} {deleteTarget.lastName} from this certificate batch?
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={confirmRemoveUploadedStudent} className="bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentPreview = ({ rows, showCertificate = false, onRemove }) => (
  <div className="my-4 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 border">
      <thead className="bg-gray-50">
        <tr>
          {(showCertificate ? ['Certificate ID', 'Student ID', 'First Name', 'Last Name', 'Year Level', 'Email', 'Actions'] : ['Student ID', 'First Name', 'Last Name', 'Year Level', 'Email', 'Actions']).map((heading) => (
            <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{heading}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {rows.map((student) => (
          <tr key={student.certificateId || student.id || student.studentId}>
            {showCertificate && <td className="px-4 py-3 text-sm font-mono">{student.certificateId}</td>}
            <td className="px-4 py-3 text-sm">{student.studentId}</td>
            <td className="px-4 py-3 text-sm">{student.firstName}</td>
            <td className="px-4 py-3 text-sm">{student.lastName}</td>
            <td className="px-4 py-3 text-sm">{student.yearStanding}</td>
            <td className="px-4 py-3 text-sm">{student.email}</td>
            <td className="px-4 py-3 text-sm">
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(student)}
                  className="font-semibold text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {rows.length === 0 && <div className="border border-t-0 py-10 text-center text-gray-500">No uploaded students yet.</div>}
  </div>
);

export default CertificateGenerator;
