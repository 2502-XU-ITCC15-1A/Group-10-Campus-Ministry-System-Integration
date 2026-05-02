import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const EvaluationBuilder = () => {
  const [questions, setQuestions] = useState([{ id: Date.now(), question: '', type: 'text', options: [], required: true }]);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [batchFilter, setBatchFilter] = useState('');

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students by selected batch
  const filteredStudents = batchFilter 
    ? students.filter(s => s.batch === batchFilter)
    : students;

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      question: '', 
      type: 'text', 
      options: [], 
      required: true 
    }]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOptions = (id, options) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, options: options.split(',').map(o => o.trim()) } : q
    ));
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/admin/evaluations', {
        title: data.title,
        description: data.description,
        questions,
        assignedStudents: selectedStudents,
        batch: data.batch,
        dueDate: data.dueDate
      });
      toast.success('Evaluation created successfully!');
      reset();
      setQuestions([{ id: Date.now(), question: '', type: 'text', options: [], required: true }]);
      setSelectedStudents([]);
    } catch (error) {
      toast.error('Failed to create evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-2xl rounded-3xl p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Create New Evaluation Form
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-gray-50 rounded-2xl">
            <div>
              <label className="block text-lg font-semibold mb-3">Title *</label>
              <input
                {...register('title', { required: true })}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Recollection Feedback Form"
              />
            </div>
<div>
              <label className="block text-lg font-semibold mb-3">Course & Year *</label>
              <select
                {...register('batch', { required: true })}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Course & Year</option>
                <optgroup label="BSIT - Bachelor of Science in IT">
                  <option value="BSIT-1">BSIT - 1st Year</option>
                  <option value="BSIT-2">BSIT - 2nd Year</option>
                  <option value="BSIT-3">BSIT - 3rd Year</option>
                  <option value="BSIT-4">BSIT - 4th Year</option>
                </optgroup>
                <optgroup label="BSCS - Bachelor of Science in Computer Science">
                  <option value="BSCS-1">BSCS - 1st Year</option>
                  <option value="BSCS-2">BSCS - 2nd Year</option>
                  <option value="BSCS-3">BSCS - 3rd Year</option>
                  <option value="BSCS-4">BSCS - 4th Year</option>
                </optgroup>
                <optgroup label="BSIS - Bachelor of Science in Information Systems">
                  <option value="BSIS-1">BSIS - 1st Year</option>
                  <option value="BSIS-2">BSIS - 2nd Year</option>
                  <option value="BSIS-3">BSIS - 3rd Year</option>
                  <option value="BSIS-4">BSIS - 4th Year</option>
                </optgroup>
                <optgroup label="ABCom - AB Communication">
                  <option value="ABCom-1">ABCom - 1st Year</option>
                  <option value="ABCom-2">ABCom - 2nd Year</option>
                  <option value="ABCom-3">ABCom - 3rd Year</option>
                  <option value="ABCom-4">ABCom - 4th Year</option>
                </optgroup>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-lg font-semibold mb-3">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the evaluation..."
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-3">Due Date *</label>
              <input
                type="datetime-local"
                {...register('dueDate', { required: true })}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Questions ({questions.length})</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                + Add Question
              </button>
            </div>
            
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-300 group">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Question {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-500 hover:text-red-700 font-semibold text-lg"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                      placeholder="Enter your question here..."
                      className="w-full p-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Short Answer</option>
                      <option value="radio">Multiple Choice</option>
                      <option value="checkbox">Checkboxes</option>
                      <option value="rating">Rating (1-5)</option>
                    </select>

                    {question.type === 'radio' && (
                      <input
                        value={question.options.join(', ')}
                        onChange={(e) => updateOptions(question.id, e.target.value)}
                        placeholder="Option 1, Option 2, Option 3"
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">Required</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

{/* Student Selection */}
          <div className="p-8 bg-gray-50 rounded-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Assign Students</h2>
            {loadingStudents ? (
              <div className="animate-pulse flex items-center justify-center h-32">
                <div className="text-gray-500">Loading students...</div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students registered yet. Students will need to register first.
              </div>
            ) : (
              <>
                {/* Batch Filter */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Filter by Batch:</label>
                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Batches ({students.length} students)</option>
                    <option value="BSIT-1">BSIT - 1st Year</option>
                    <option value="BSIT-2">BSIT - 2nd Year</option>
                    <option value="BSIT-3">BSIT - 3rd Year</option>
                    <option value="BSIT-4">BSIT - 4th Year</option>
                    <option value="BSCS-1">BSCS - 1st Year</option>
                    <option value="BSCS-2">BSCS - 2nd Year</option>
                    <option value="BSCS-3">BSCS - 3rd Year</option>
                    <option value="BSCS-4">BSCS - 4th Year</option>
                    <option value="BSIS-1">BSIS - 1st Year</option>
                    <option value="BSIS-2">BSIS - 2nd Year</option>
                    <option value="BSIS-3">BSIS - 3rd Year</option>
                    <option value="BSIS-4">BSIS - 4th Year</option>
                    <option value="ABCom-1">ABCom - 1st Year</option>
                    <option value="ABCom-2">ABCom - 2nd Year</option>
                    <option value="ABCom-3">ABCom - 3rd Year</option>
                    <option value="ABCom-4">ABCom - 4th Year</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSelectedStudents(filteredStudents.map(s => s._id))}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                  >
                    Select Filtered ({filteredStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudents([])}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
                  >
                    Clear All
                  </button>
                  <span className="ml-2 text-sm text-gray-600 self-center">
                    {selectedStudents.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <label
                      key={student._id}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedStudents.includes(student._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student._id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                          }
                        }}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{student.fullName}</p>
                        <p className="text-sm text-gray-500">{student.studentId}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-8 border-t border-gray-200 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-16 py-4 bg-gradient-to-r from-blue-600 to-blue-600 text-white text-xl font-bold rounded-2xl hover:from-blue-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all disabled:opacity-50 shadow-2xl hover:shadow-3xl"
            >
              {loading ? 'Creating...' : 'Create & Post Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationBuilder;