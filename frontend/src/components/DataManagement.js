import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DataManagement = () => {
  const [stats, setStats] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, submissionsRes] = await Promise.all([
        api.get('/admin/stats-detailed'),
        api.get('/admin/submissions')
      ]);
      setStats(statsRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get('/admin/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ecms-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('Report exported!');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Data Management</h1>
        <p className="text-xl text-gray-600">Analytics, submissions, and exports</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-6">
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-8">
        <button
          onClick={exportCSV}
          disabled={exporting}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : '📥 Export All Data (CSV)'}
        </button>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Recent Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Evaluation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Submitted</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.slice(0, 10).map((submission) => (
                <tr key={submission._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{submission.studentName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{submission.evaluationTitle}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(submission.submittedAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Reviewed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {submissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No submissions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
