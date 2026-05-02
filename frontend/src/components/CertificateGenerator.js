import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const CertificateGenerator = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    eventName: '',
    eventDate: ''
  });
  const [generatedCert, setGeneratedCert] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    
    try {
      const response = await api.post('/admin/certificates', {
        studentId: formData.studentId,
        eventName: formData.eventName,
        eventDate: formData.eventDate
      });
      
      setGeneratedCert(response.data);
      toast.success('Certificate generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({ studentId: '', eventName: '', eventDate: '' });
    setGeneratedCert(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-2xl rounded-3xl p-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
            Generate Certificate
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Create QR-enabled certificates for students
          </p>
        </div>

        {!generatedCert ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-3">Select Student *</label>
              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a Student --</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.fullName} ({student.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Event Name *</label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                required
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Spiritual Retreat 2024"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3">Event Date *</label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Certificate'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-8 mb-8">
              <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-2xl font-bold text-green-800 mb-2">Certificate Generated!</h3>
              <p className="text-green-700">The certificate has been issued to the student.</p>
            </div>

            {/* QR Code Display */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 inline-block">
              <h4 className="text-lg font-semibold mb-4">QR Code</h4>
              {generatedCert.qrCode ? (
                <img 
                  src={generatedCert.qrCode} 
                  alt="Certificate QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500">No QR Code</span>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4">
                Scan to verify certificate
              </p>
            </div>

            <div className="mt-8">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateGenerator;