import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const EvaluationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const { register, handleSubmit, formState: { errors }, getValues, reset } = useForm();

  useEffect(() => {
    fetchEvaluation();
    // Auto-save draft every 30 seconds
    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [id]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      setShowExitModal(true);
    };
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchEvaluation = async () => {
    try {
      const response = await api.get(`/evaluation/${id}`);
      setEvaluation(response.data);
      // Load saved draft if exists
      const savedDraft = localStorage.getItem(`draft_${id}`);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        reset(draftData);
        setDraftSaved(true);
        toast.success('Draft restored from previous session');
      }
    } catch (error) {
      toast.error('Failed to load evaluation');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      const formData = getValues();
      localStorage.setItem(`draft_${id}`, JSON.stringify(formData));
      setDraftSaved(true);
      toast.success('Draft saved automatically');
    } catch (error) {
      console.error('Draft save error:', error);
    }
  };

  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setShowExitModal(false);
    // Determine where to go based on previous location
    const fromAdmin = location.state?.from === 'admin';
    if (fromAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post(`/student/evaluations/${id}/submit`, { answers: data });
      toast.success('Evaluation submitted successfully!');
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!evaluation) {
    return <div>Evaluation not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl p-12">
          {/* X Button for Exit */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleExitClick}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Exit Evaluation"
            >
              <svg className="w-6 h-6 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="text-center mb-12">
            {draftSaved && (
              <div className="mb-4 inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                </svg>
                Draft saved
              </div>
            )}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-4">
              {evaluation.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {evaluation.description}
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
              <p className="text-sm font-medium text-blue-800">
                📅 Due: {new Date(evaluation.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {evaluation.questions.map((question, index) => (
              <div key={question._id || index} className="bg-gray-50 p-8 rounded-2xl border-2 border-gray-100">
                <label className="block text-lg font-semibold text-gray-900 mb-6">
                  Q{index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {question.type === 'text' && (
                  <textarea
                    {...register(`q${index}`, { required: question.required })}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[120px]"
                    placeholder="Enter your response here..."
                  />
                )}

                {question.type === 'radio' && (
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => (
                      <label key={optIndex} className="flex items-center p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                        <input
                          type="radio"
                          value={option}
                          {...register(`q${index}`, { required: question.required })}
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className="flex items-center space-x-2">
                    {[1,2,3,4,5].map((star) => (
                      <label key={star} className="cursor-pointer">
                        <input
                          type="radio"
                          value={star}
                          {...register(`q${index}`, { required: question.required })}
                          className="sr-only"
                        />
                        <svg
                          className="w-8 h-8 text-yellow-400 hover:text-yellow-500 transition-colors"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </label>
                    ))}
                  </div>
                )}

                {errors[`q${index}`] && (
                  <p className="mt-2 text-sm text-red-600">This field is required</p>
                )}
              </div>
            ))}

            <div className="flex justify-between pt-8 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/student/dashboard')}
                  className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="px-8 py-3 border border-yellow-300 text-yellow-700 font-medium rounded-xl hover:bg-yellow-50 transition-colors"
                >
                  Save Draft
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-12 py-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>

          {/* Exit Confirmation Modal */}
          {showExitModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Exit Evaluation?</h3>
                  <p className="text-gray-600 mb-6">
                    Your progress has been auto-saved. You can continue later from where you left off.
                  </p>
                  <div className="flex space-x-3 justify-center">
                    <button
                      onClick={() => setShowExitModal(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Continue
                    </button>
                    <button
                      onClick={confirmExit}
                      className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;