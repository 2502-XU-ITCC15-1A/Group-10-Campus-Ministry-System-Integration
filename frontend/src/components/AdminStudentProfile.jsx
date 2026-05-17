import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminStudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await api.get(`/admin/student-profile/${studentId}`);
        setStudentData(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const certificatesTotal = studentData?.certificatesTotal || 0;
  const status = certificatesTotal > 4 ? 'SPECIAL' : certificatesTotal === 4 ? 'COMPLETE' : 'INCOMPLETE';
  const statusClass = certificatesTotal > 4 ? 'bg-blue-500' : certificatesTotal === 4 ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        STUDENT RECORDS
      </h1>

      <div className="mx-6 rounded-lg bg-white p-6 shadow-lg lg:mx-9">
        <button onClick={() => navigate('/admin/student-records')} className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#3a53a5] hover:underline">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          COLLEGE RECORDS
        </button>

        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="h-20 w-20 animate-spin rounded-full border-b-2 border-[#3a53a5]" />
          </div>
        ) : !studentData ? (
          <div className="py-20 text-center text-gray-500">Student profile not found.</div>
        ) : (
          <>
            <section className="mb-8 flex items-center rounded-lg bg-blue-100 p-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[#3a53a5] shadow">
                <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 18a8 8 0 1116 0H2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-5">
                <h2 className="text-2xl font-bold text-gray-900">{studentData.studentName}</h2>
                <p className="text-sm text-gray-700">{studentData.studentId} - {studentData.departmentYearStanding}</p>
                <button className={`mt-3 rounded px-4 py-2 text-sm font-semibold text-white ${statusClass}`} disabled>
                  {status}
                </button>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">CERTIFICATES ({certificatesTotal})</h3>
              <div className="flex gap-4 overflow-x-auto pb-3">
                {studentData.certificates.map((certificate) => (
                  <div key={certificate.certificateId} className="w-36 flex-shrink-0">
                    <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-300 text-[#3a53a5]">
                      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="mt-2 w-32 text-center text-xs">
                      <p className="font-semibold text-[#3a53a5]">{certificate.certificateId}</p>
                      <p className="mt-1 text-gray-500">{certificate.eventName}</p>
                    </div>
                  </div>
                ))}
                {certificatesTotal === 0 && (
                  <div className="rounded border border-dashed border-gray-300 px-6 py-10 text-gray-500">
                    No certificates generated yet.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminStudentProfile;
