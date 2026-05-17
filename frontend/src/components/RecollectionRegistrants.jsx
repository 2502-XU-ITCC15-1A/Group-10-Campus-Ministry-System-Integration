import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const RecollectionRegistrants = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [recollection, setRecollection] = useState(null);
  const [loading, setLoading] = useState(true);

  const yearLevelLabels = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year'
  };

  useEffect(() => {
    const fetchRecollection = async () => {
      try {
        const response = await api.get(`/admin/recollections/${id}`);
        setRecollection(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load registrants');
      } finally {
        setLoading(false);
      }
    };

    fetchRecollection();
  }, [id]);

  if (loading) {
    return (
      <div className="-m-6 flex min-h-screen items-center justify-center bg-[#edf0f7]">
        <div className="h-24 w-24 animate-spin rounded-full border-b-2 border-[#3a53a5]" />
      </div>
    );
  }

  const registrants = recollection?.participants || [];
  const dashboardPath = user?.role === 'staff' ? '/formator/dashboard' : '/admin/dashboard';

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        RECOLLECTION REGISTRANTS
      </h1>

      <div className="mx-6 space-y-8 lg:mx-9">
        <Link to={dashboardPath} className="inline-flex items-center gap-2 text-sm font-semibold text-[#3a53a5] hover:underline">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {!recollection ? (
          <section className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-lg">
            Recollection schedule not found.
          </section>
        ) : (
          <>
            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <p className="text-sm font-semibold uppercase text-gray-500">
                    {recollection.sourceType === 'cmo-event' ? 'CMO Event Date' : 'Recollection Schedule'}
                  </p>
                  <h2 className="mt-1 text-3xl font-bold text-[#3a53a5]">{recollection.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm text-gray-600">{recollection.description || 'No description provided.'}</p>
                </div>
                <span className="w-fit rounded bg-[#edf0f7] px-4 py-2 text-sm font-semibold text-[#3a53a5]">
                  {registrants.length}{recollection.slots ? `/${recollection.slots}` : ''} registrants
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Date and Time', new Date(recollection.date).toLocaleString()],
                  ['Venue', recollection.venue || 'Not set'],
                  ['Department', recollection.department || 'Not set'],
                  ['Year Level', yearLevelLabels[recollection.yearLevel] || 'Not set'],
                  ['Person in Charge', recollection.facilitator || recollection.inCharge || 'Not set']
                ].map(([label, value]) => (
                  <div key={label} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Registered Students</h2>
                <span className="rounded bg-[#edf0f7] px-3 py-1 text-xs font-semibold text-[#3a53a5]">{registrants.length}</span>
              </div>

              {registrants.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No students have registered for this schedule yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Name', 'Student ID', 'Email', 'Department', 'Batch'].map((heading) => (
                          <th key={heading} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {registrants.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{student.fullName}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.studentId || '-'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.email || '-'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.department || '-'}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{student.batch || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default RecollectionRegistrants;
