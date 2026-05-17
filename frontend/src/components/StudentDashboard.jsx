import React, { useState, useEffect, useContext } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    announcements: [],
    recollectionSchedules: [],
    certificates: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const yearLevelLabels = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year'
  };

  useEffect(() => {
    fetchDashboardData();
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/student/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async (recollectionId) => {
    try {
      await api.post(`/student/recollections/${recollectionId}/participate`);
      toast.success('Successfully registered for recollection!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register for recollection');
    }
  };

  const downloadCertificate = async (certificate) => {
    try {
      const { widthMm, heightMm, widthPx } = await getCertificatePageSize(certificate.certBgImgKey);
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-10000px';
      wrapper.style.top = '0';
      wrapper.style.width = `${widthPx}px`;
      wrapper.innerHTML = buildCertificateDownloadMarkup(certificate, widthMm, heightMm);
      document.body.appendChild(wrapper);

      const certificateNode = wrapper.querySelector('.certificate-download');
      await waitForImages(certificateNode);
      const canvas = await html2canvas(certificateNode, {
        scale: 2,
        backgroundColor: null,
        useCORS: true
      });
      const pdf = new jsPDF({
        orientation: widthMm >= heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [widthMm, heightMm]
      });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, widthMm, heightMm);
      pdf.save(`${certificate.eventName || 'certificate'}-${certificate.studentId || 'student'}.pdf`.replace(/[^a-z0-9.-]+/gi, '-'));
      document.body.removeChild(wrapper);
    } catch (error) {
      toast.error('Failed to download certificate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-3 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        STUDENT DASHBOARD
      </h1>
      <p className="mx-6 mb-6 text-center text-sm font-semibold uppercase tracking-wide text-gray-500 lg:mx-9">
        {user.fullName} / {user.studentId || 'Student ID'}
      </p>

      <div className="mx-6 space-y-8 lg:mx-9">
        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Announcements</h2>
          {dashboardData.announcements && dashboardData.announcements.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.announcements.map((announcement, index) => (
                <div key={index} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4">
                  <p className="text-sm text-gray-800">{announcement}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">No announcements right now.</div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-3 border-b px-6 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recollection Schedules</h2>
              <p className="text-sm text-gray-500">Choose an available date and venue to participate.</p>
            </div>
          </div>

          {!dashboardData.recollectionSchedules || dashboardData.recollectionSchedules.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No recollection schedules available right now.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
              {dashboardData.recollectionSchedules.map((schedule) => {
                const date = new Date(schedule.date);
                const participantCount = schedule.participantCount || schedule.participants?.length || 0;
                const slots = schedule.slots || 0;
                const isFull = slots > 0 && participantCount >= slots;

                return (
                  <div key={schedule._id} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-5">
                    <h3 className="text-lg font-semibold text-gray-900">{schedule.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{schedule.description}</p>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                      <p>{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                      <p>{schedule.venue}</p>
                      <p>{schedule.department} / {yearLevelLabels[schedule.yearLevel] || 'Assigned year level'}</p>
                      {schedule.facilitator && <p>{schedule.facilitator}</p>}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-white pt-4">
                      <span className="text-sm font-semibold text-gray-600">
                        {slots > 0 ? `${Math.max(slots - participantCount, 0)} slots left` : 'Open slots'}
                      </span>
                      <button
                        type="button"
                        disabled={schedule.isRegistered || isFull}
                        onClick={() => handleParticipate(schedule._id)}
                        className={`px-4 py-2 text-sm font-semibold transition ${
                          schedule.isRegistered
                            ? 'bg-green-100 text-green-700'
                            : isFull
                              ? 'bg-gray-200 text-gray-500'
                              : 'bg-[#3a53a5] text-white hover:bg-[#2a3a85]'
                        } disabled:cursor-not-allowed`}
                      >
                        {schedule.isRegistered ? 'Registered' : isFull ? 'Full' : 'Participate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Your Certificates</h2>
          {!dashboardData.certificates || dashboardData.certificates.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No certificates yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboardData.certificates.map((cert) => (
                <div key={cert._id} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">{cert.eventName}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold ${
                      cert.status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cert.status?.toUpperCase() || 'ISSUED'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {new Date(cert.eventDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="mt-5 overflow-hidden border border-white bg-white">
                    <CertificateImage certificate={cert} compact />
                  </div>
                  <div className="mt-4 border-t border-white pt-4 text-center">
                    <p className="text-xs text-gray-500">QR code is printed on the certificate</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCertificate(cert);
                      }}
                      className="mt-2 bg-white px-4 py-2 text-sm font-semibold text-[#3a53a5] transition hover:bg-gray-50"
                    >
                      Open Certificate
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCertificate(cert)}
                      className="ml-2 mt-2 bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a3a85]"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCertificate.eventName}</h2>
                <p className="text-sm text-gray-500">Certificate preview with QR verification code</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadCertificate(selectedCertificate)}
                  className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(null)}
                  className="bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Close
                </button>
              </div>
            </div>

            <CertificateImage certificate={selectedCertificate} />
          </div>
        </div>
      )}
    </div>
  );
};

const CertificateImage = ({ certificate, compact = false }) => {
  const aspectRatio = useImageAspectRatio(certificate.certBgImgKey);
  const sizeClass = compact ? 'w-full' : 'mx-auto w-full max-w-5xl';
  const titleClass = compact ? 'text-lg' : 'text-4xl';
  const nameClass = compact ? 'text-xl' : 'text-5xl';
  const bodyClass = compact ? 'text-[11px]' : 'text-lg';
  const date = certificate.eventDate ? new Date(certificate.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <div
      className={`relative flex ${sizeClass} flex-col items-center justify-center overflow-hidden bg-white p-6 text-center text-gray-900 shadow-sm`}
      style={{
        aspectRatio,
        ...(certificate.certBgImgKey ? { backgroundImage: `url(${certificate.certBgImgKey})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
      }}
    >
      <div className={`absolute inset-0 ${certificate.certBgImgKey ? 'bg-white/35' : 'bg-white/75'}`} />
      <div className="relative z-10 max-w-3xl">
        <p className={`${bodyClass} font-semibold uppercase tracking-wide text-[#3a53a5]`}>Certificate of Participation</p>
        <h3 className={`${titleClass} mt-3 font-serif font-bold text-gray-900`}>{certificate.certEventType || certificate.eventName}</h3>
        <p className={`${bodyClass} mt-4 text-gray-700`}>This certifies that</p>
        <p className={`${nameClass} mt-2 font-serif font-bold text-[#24366f]`}>{certificate.studentName || 'Student Name'}</p>
        <p className={`${bodyClass} mt-4 text-gray-700`}>
          has participated in {certificate.certEventTheme || certificate.eventName}.
        </p>
        <p className={`${bodyClass} mt-3 text-gray-700`}>
          {date} {certificate.certEventVenue ? `at ${certificate.certEventVenue}` : ''}
        </p>
        <div className={`${compact ? 'mt-5' : 'mt-16'} flex flex-col items-center`}>
          {certificate.certSigImgKey && <img src={certificate.certSigImgKey} alt="Director signature" className={`${compact ? 'h-8' : 'h-20'} object-contain`} />}
          <div className="mt-1 w-48 border-t border-gray-700" />
          <p className={`${bodyClass} mt-1 font-semibold`}>{certificate.certDirectorName || 'Director'}</p>
        </div>
      </div>
      {certificate.qrCode && (
        <div className={`absolute bottom-5 right-5 z-20 p-1 ${compact ? 'w-16' : 'w-28'}`}>
          <img src={certificate.qrCode} alt="Certificate QR Code" className="h-full w-full object-contain" />
        </div>
      )}
    </div>
  );
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const DEFAULT_CERTIFICATE_RATIO = 297 / 210;

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

const getImageSize = (src) => new Promise((resolve) => {
  if (!src) {
    resolve(null);
    return;
  }

  const image = new Image();
  image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
  image.onerror = () => resolve(null);
  image.src = src;
});

const getCertificatePageSize = async (backgroundImage) => {
  const imageSize = await getImageSize(backgroundImage);
  const ratio = imageSize?.width && imageSize?.height ? imageSize.width / imageSize.height : DEFAULT_CERTIFICATE_RATIO;
  const widthMm = ratio >= 1 ? 297 : 210;
  const heightMm = widthMm / ratio;
  return {
    widthMm,
    heightMm,
    widthPx: ratio >= 1 ? 1400 : 990
  };
};

const waitForImages = async (root) => {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.onload = resolve;
      image.onerror = resolve;
    });
  }));
};

const buildCertificateDownloadMarkup = (certificate, widthMm, heightMm) => {
  const date = certificate.eventDate ? new Date(certificate.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return `<style>
    .certificate-download {
      position: relative;
      width: 100%;
      aspect-ratio: ${widthMm} / ${heightMm};
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      overflow: hidden;
      padding: 24mm;
      color: #111827;
      ${certificate.certBgImgKey ? `background-image: url("${certificate.certBgImgKey}"); background-size: cover; background-position: center;` : 'background: #fff;'}
    }
    .overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.35); }
    .content { position: relative; z-index: 1; max-width: 210mm; }
    .label { color: #3a53a5; text-transform: uppercase; font-weight: 700; letter-spacing: .08em; font-size: 18px; }
    h1 { font-family: Georgia, serif; font-size: 42px; margin: 12px 0 0; }
    .name { font-family: Georgia, serif; color: #24366f; font-size: 54px; font-weight: 700; margin: 14px 0; }
    p { font-size: 20px; margin: 12px 0; }
    .signature { margin-top: 38px; display: inline-flex; flex-direction: column; align-items: center; min-width: 62mm; }
    .signature img { height: 24mm; object-fit: contain; }
    .line { width: 62mm; border-top: 1px solid #111827; margin-top: 3mm; }
    .qr { position: absolute; z-index: 2; right: 14mm; bottom: 14mm; width: 30mm; }
    .qr img { width: 100%; display: block; }
  </style>
  <main class="certificate-download">
    <div class="overlay"></div>
    <section class="content">
      <div class="label">Certificate of Participation</div>
      <h1>${escapeHtml(certificate.certEventType || certificate.eventName || 'Certificate')}</h1>
      <p>This certifies that</p>
      <div class="name">${escapeHtml(certificate.studentName || 'Student Name')}</div>
      <p>has participated in ${escapeHtml(certificate.certEventTheme || certificate.eventName || 'the event')}.</p>
      <p>${escapeHtml(date)} ${certificate.certEventVenue ? `at ${escapeHtml(certificate.certEventVenue)}` : ''}</p>
      <div class="signature">
        ${certificate.certSigImgKey ? `<img src="${certificate.certSigImgKey}" alt="Director signature" />` : ''}
        <div class="line"></div>
        <p><strong>${escapeHtml(certificate.certDirectorName || 'Director')}</strong></p>
      </div>
    </section>
    ${certificate.qrCode ? `<aside class="qr"><img src="${certificate.qrCode}" alt="Certificate QR Code" /></aside>` : ''}
  </main>`;
};

export default StudentDashboard;
