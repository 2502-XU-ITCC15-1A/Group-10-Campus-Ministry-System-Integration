import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const emptyTemplate = {
  templateTitle: '',
  certBgImgKey: '',
  certEventYearLevel: '',
  certEventType: '',
  certEventTheme: '',
  certEventDate: '',
  certEventVenue: '',
  certDirectorName: '',
  certSigImgKey: ''
};

const eventTypes = ['Onsite event', 'Online event', 'Onsite Recollection', 'Online Recollection', 'Onsite Retreat', 'Online Retreat'];

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const formatTemplateDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const CertificateTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', template: null });
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [formData, setFormData] = useState(emptyTemplate);

  const fetchTemplates = async (keywordOverride = search) => {
    try {
      const params = new URLSearchParams();
      if (keywordOverride.trim()) params.append('keyword', keywordOverride.trim());
      const response = await api.get(`/admin/certificate-templates?${params.toString()}`);
      setTemplates(response.data || []);
    } catch (error) {
      toast.error('Failed to load certificate templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return templates;
    return templates.filter((template) =>
      [template.templateTitle, template.certEventType, template.certEventTheme].some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      )
    );
  }, [templates, search]);

  const openAdd = () => {
    setFormData(emptyTemplate);
    setModal({ open: true, mode: 'add', template: null });
  };

  const openEdit = (template) => {
    setFormData({
      templateTitle: template.templateTitle || '',
      certBgImgKey: template.certBgImgKey || '',
      certEventYearLevel: template.certEventYearLevel || '',
      certEventType: template.certEventType || '',
      certEventTheme: template.certEventTheme || '',
      certEventDate: toDateTimeLocalValue(template.certEventDate),
      certEventVenue: template.certEventVenue || '',
      certDirectorName: template.certDirectorName || '',
      certSigImgKey: template.certSigImgKey || ''
    });
    setModal({ open: true, mode: 'edit', template });
  };

  const closeModal = () => {
    setFormData(emptyTemplate);
    setModal({ open: false, mode: 'add', template: null });
  };

  const handleImageUpload = (field, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({ ...current, [field]: reader.result || '' }));
      toast.success('Image uploaded');
    };
    reader.onerror = () => toast.error('Failed to read image file');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const required = ['templateTitle', 'certEventYearLevel', 'certEventType', 'certEventTheme', 'certEventDate', 'certEventVenue', 'certDirectorName'];
    if (required.some((field) => !formData[field])) {
      toast.error('Please fill in all required template fields');
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === 'edit' && modal.template?._id) {
        const response = await api.put(`/admin/certificate-templates/${modal.template._id}`, formData);
        setTemplates((current) => current.map((template) => template._id === response.data._id ? response.data : template));
        toast.success('Template updated successfully');
      } else {
        const response = await api.post('/admin/certificate-templates', formData);
        setTemplates((current) => [response.data, ...current.filter((template) => template._id !== response.data._id)]);
        toast.success('Template created successfully');
      }
      setSearch('');
      closeModal();
      await fetchTemplates('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/certificate-templates/${templateId}`);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete template');
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
        CERTIFICATE TEMPLATES
      </h1>

      <div className="mx-6 space-y-8 lg:mx-9">
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 border-b px-6 py-4 lg:flex-row lg:items-center">
            <button onClick={openAdd} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]">
              Add Template
            </button>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5] sm:w-64" />
          </div>

          <div className="grid grid-cols-1 gap-5 bg-[#D9D9D9] p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div key={template._id} className="relative min-h-44 rounded-md border border-[#3a53a5] bg-white p-6 shadow">
                <div className="absolute right-3 top-3 flex gap-3">
                  <button onClick={() => setPreviewTemplate(template)} className="text-sm font-semibold text-[#3a53a5] hover:underline">Preview</button>
                  <button onClick={() => openEdit(template)} className="text-sm font-semibold text-[#3a53a5] hover:underline">Edit</button>
                  <button onClick={() => handleDelete(template._id)} className="text-sm font-semibold text-red-600 hover:underline">Delete</button>
                </div>
                <div className="mb-4 mt-8 overflow-hidden border border-gray-200 bg-[#f8fafc]">
                  <TemplatePreview template={template} compact />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{template.templateTitle}</h2>
                <p className="mt-2 text-sm text-gray-600">{template.certEventType}</p>
                <p className="text-sm text-gray-600">{template.certEventTheme}</p>
                <p className="mt-3 text-xs font-semibold uppercase text-[#3a53a5]">{formatTemplateDate(template.certEventDate)}</p>
              </div>
            ))}
            {filteredTemplates.length === 0 && <div className="col-span-full py-10 text-center text-gray-600">No certificate templates found.</div>}
          </div>
        </section>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">{modal.mode === 'edit' ? 'Edit Template' : 'Add Template'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={formData.templateTitle} onChange={(event) => setFormData({ ...formData, templateTitle: event.target.value })} placeholder="Template Title" className="h-10 w-full border px-3" />
              <label className="relative flex h-28 w-full cursor-pointer items-center justify-center overflow-hidden border border-gray-300 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#3a53a5]">
                {formData.certBgImgKey ? (
                  <img src={formData.certBgImgKey} alt="Certificate background preview" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span>Upload Background Image</span>
                )}
                <span className="absolute bottom-2 right-2 bg-white/90 px-3 py-1 text-xs font-semibold text-[#3a53a5] shadow">
                  Choose Image
                </span>
                <input type="file" accept="image/*" onChange={(event) => handleImageUpload('certBgImgKey', event.target.files?.[0])} className="hidden" />
              </label>
              <select value={formData.certEventYearLevel} onChange={(event) => setFormData({ ...formData, certEventYearLevel: event.target.value })} className="h-10 w-full border px-3">
                <option value="">Select Year Level</option>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="4th">4th</option>
              </select>
              <select value={formData.certEventType} onChange={(event) => setFormData({ ...formData, certEventType: event.target.value })} className="h-10 w-full border px-3">
                <option value="">Select Event Type</option>
                {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input value={formData.certEventTheme} onChange={(event) => setFormData({ ...formData, certEventTheme: event.target.value })} placeholder="Event Theme" className="h-10 w-full border px-3" />
              <input type="datetime-local" value={formData.certEventDate} onChange={(event) => setFormData({ ...formData, certEventDate: event.target.value })} className="h-10 w-full border px-3" />
              <input value={formData.certEventVenue} onChange={(event) => setFormData({ ...formData, certEventVenue: event.target.value })} placeholder="Event Venue" className="h-10 w-full border px-3" />
              <input value={formData.certDirectorName} onChange={(event) => setFormData({ ...formData, certDirectorName: event.target.value })} placeholder="Director Name" className="h-10 w-full border px-3" />
              <label className="relative flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden border border-gray-300 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#3a53a5]">
                {formData.certSigImgKey ? (
                  <img src={formData.certSigImgKey} alt="Director signature preview" className="absolute inset-0 h-full w-full object-contain p-2" />
                ) : (
                  <span>Upload Director Signature</span>
                )}
                <span className="absolute bottom-2 right-2 bg-white/90 px-3 py-1 text-xs font-semibold text-[#3a53a5] shadow">
                  Choose Image
                </span>
                <input type="file" accept="image/*" onChange={(event) => handleImageUpload('certSigImgKey', event.target.files?.[0])} className="hidden" />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Cancel</button>
                <button type="submit" disabled={saving} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-60">
                  {saving ? 'Saving...' : modal.mode === 'edit' ? 'Update Template' : 'Add Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">{previewTemplate.templateTitle}</h2>
              <button onClick={() => setPreviewTemplate(null)} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]">
                Close
              </button>
            </div>
            <TemplatePreview template={previewTemplate} />
          </div>
        </div>
      )}
    </div>
  );
};

const TemplatePreview = ({ template, compact = false }) => {
  const aspectRatio = useImageAspectRatio(template.certBgImgKey);
  const sizeClass = compact ? 'w-full' : 'mx-auto w-full max-w-5xl';
  const titleClass = compact ? 'text-base' : 'text-4xl';
  const bodyClass = compact ? 'text-[10px]' : 'text-lg';

  return (
    <div
      className={`relative flex ${sizeClass} flex-col items-center justify-center overflow-hidden bg-white p-6 text-center text-gray-900`}
      style={{
        aspectRatio,
        ...(template.certBgImgKey ? { backgroundImage: `url(${template.certBgImgKey})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
      }}
    >
      <div className="absolute inset-0 bg-white/70" />
      <div className="relative z-10 max-w-3xl">
        <p className={`${bodyClass} font-semibold uppercase tracking-wide text-[#3a53a5]`}>Certificate of Participation</p>
        <h3 className={`${titleClass} mt-3 font-serif font-bold text-gray-900`}>{template.certEventType || 'Event Type'}</h3>
        <p className={`${bodyClass} mt-4 text-gray-700`}>This certifies that</p>
        <p className={`${compact ? 'text-lg' : 'text-5xl'} mt-2 font-serif font-bold text-[#24366f]`}>Student Name</p>
        <p className={`${bodyClass} mt-4 text-gray-700`}>
          has participated in {template.certEventTheme || 'Event Theme'} for {template.certEventYearLevel || 'Year Level'} students.
        </p>
        <p className={`${bodyClass} mt-3 text-gray-700`}>
          {formatTemplateDate(template.certEventDate)} {template.certEventVenue ? `at ${template.certEventVenue}` : ''}
        </p>
        <div className={`${compact ? 'mt-4' : 'mt-16'} flex flex-col items-center`}>
          {template.certSigImgKey && <img src={template.certSigImgKey} alt="Director signature" className={`${compact ? 'h-8' : 'h-20'} object-contain`} />}
          <div className="mt-1 w-48 border-t border-gray-700" />
          <p className={`${bodyClass} mt-1 font-semibold`}>{template.certDirectorName || 'Director Name'}</p>
        </div>
      </div>
    </div>
  );
};

const useImageAspectRatio = (src) => {
  const [ratio, setRatio] = useState('297 / 210');

  useEffect(() => {
    if (!src) {
      setRatio('297 / 210');
      return undefined;
    }

    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth && image.naturalHeight) {
        setRatio(`${image.naturalWidth} / ${image.naturalHeight}`);
      }
    };
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src]);

  return ratio;
};

export default CertificateTemplates;
