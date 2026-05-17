const express = require('express');
const router = express.Router();

const adminRouter = (() => {
const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const User = require('../models/userSchema');
const Certificate = require('../models/certificatesSchema');
const Recollection = require('../models/Recollection');
const CmoEvent = require('../models/eventsSchema');
const CertificateTemplate = require('../models/certTemplateSchema');
const QRCode = require('qrcode');
const { sendEmail } = require('../services/emailService');
const router = express.Router();
const departments = [
  'Agriculture',
  'Arts and Science',
  'Business Management',
  'Computer Studies',
  'Education',
  'Engineering',
  'Nursing',
  'BS Agribusiness',
  'BS Agriculture',
  'BS Agricultural & Biosystems Engineering',
  'BS Food Technology',
  'BS Development Communication',
  'AB Economics',
  'AB History',
  'AB Interdisciplinary Studies',
  'AB International Studies',
  'AB English Language',
  'AB Literature',
  'AB Philosophy',
  'AB Psychology',
  'AB Sociology',
  'BS Biology',
  'BS Chemistry',
  'BS Marine Biology',
  'BS Mathematics',
  'BS Psychology',
  'BS Accountancy',
  'BS Business Administration',
  'BS Management Accounting',
  'BS Computer Science',
  'BS Information Systems',
  'BS Information Technology',
  'BS Entertainment & Multimedia Computing',
  'Bachelor of Early Childhood Education',
  'Bachelor of Elementary Education',
  'Bachelor of Special Needs Education',
  'Bachelor of Technology and Livelihood Education',
  'Bachelor of Secondary Education',
  'BS Chemical Engineering',
  'BS Civil Engineering',
  'BS Electrical Engineering',
  'BS Electronics Engineering',
  'BS Industrial Engineering',
  'BS Mechanical Engineering',
  'BS Nursing'
];

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const adminOrFacultyAuth = (req, res, next) => {
  if (!['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or formator access required' });
  }
  next();
};

const adminFacultyOrAssistantAuth = (req, res, next) => {
  if (!['admin', 'staff', 'student_assistant'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin, formator, or student assistant access required' });
  }
  next();
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getFacultyScope = async (req) => {
  if (req.user.role !== 'staff') return null;
  return User.findById(req.user.id).select('department batch').lean();
};

const applyFacultyStudentScope = (query, faculty) => {
  if (!faculty) return query;
  if (faculty.department) query.department = faculty.department;
  if (faculty.batch) query.batch = { $regex: `^${escapeRegex(faculty.batch)}` };
  return query;
};

const ensureFacultyBatchAccess = (faculty, batch) => {
  if (!faculty || !faculty.batch || !batch || batch === 'General') return true;
  return String(batch).startsWith(faculty.batch);
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const applyCertificateTemplateFallback = async (certificate) => {
  const certificateObject = typeof certificate.toObject === 'function' ? certificate.toObject() : { ...certificate };
  if (certificateObject.certBgImgKey || certificateObject.certSigImgKey) return certificateObject;

  const template = await CertificateTemplate.findOne({
    $or: [
      { templateTitle: certificateObject.eventName },
      { certEventType: certificateObject.eventName }
    ]
  }).lean();

  if (!template) return certificateObject;

  return {
    ...certificateObject,
    templateTitle: certificateObject.templateTitle || template.templateTitle || '',
    certBgImgKey: certificateObject.certBgImgKey || template.certBgImgKey || '',
    certEventYearLevel: certificateObject.certEventYearLevel || template.certEventYearLevel || '',
    certEventType: certificateObject.certEventType || template.certEventType || '',
    certEventTheme: certificateObject.certEventTheme || template.certEventTheme || '',
    certEventVenue: certificateObject.certEventVenue || template.certEventVenue || '',
    certDirectorName: certificateObject.certDirectorName || template.certDirectorName || '',
    certSigImgKey: certificateObject.certSigImgKey || template.certSigImgKey || ''
  };
};

const departmentGroups = [
  ['Agriculture', 'BS Agribusiness', 'BS Agriculture', 'BS Agricultural & Biosystems Engineering', 'BS Food Technology', 'BS Development Communication'],
  ['Arts and Science', 'Arts and Sciences', 'AB Economics', 'AB History', 'AB Interdisciplinary Studies', 'AB International Studies', 'AB English Language', 'AB Literature', 'AB Philosophy', 'AB Psychology', 'AB Sociology', 'BS Biology', 'BS Chemistry', 'BS Marine Biology', 'BS Mathematics', 'BS Psychology'],
  ['Business Management', 'BS Accountancy', 'BS Business Administration', 'BS Management Accounting'],
  ['Computer Studies', 'BS Computer Science', 'BS Information Systems', 'BS Information Technology', 'BS Entertainment & Multimedia Computing'],
  ['Education', 'Bachelor of Early Childhood Education', 'Bachelor of Elementary Education', 'Bachelor of Special Needs Education', 'Bachelor of Technology and Livelihood Education', 'Bachelor of Secondary Education'],
  ['Engineering', 'BS Chemical Engineering', 'BS Civil Engineering', 'BS Civil Engineerring', 'BS Electrical Engineering', 'BS Electronics Engineering', 'BS Industrial Engineering', 'BS Mechanical Engineering'],
  ['Nursing', 'BS Nursing']
];

const getDepartmentMatchValues = (department = '') => {
  const group = departmentGroups.find((items) => items.includes(department));
  return [...new Set(group || [department])];
};

const departmentsAreInSameGroup = (first = '', second = '') => (
  getDepartmentMatchValues(first).includes(second) || getDepartmentMatchValues(second).includes(first)
);

const getStudentsForRecollection = async (recollection) => {
  const yearPattern = `-${escapeRegex(recollection.yearLevel)}`;
  return User.find({
    role: 'student',
    department: { $in: getDepartmentMatchValues(recollection.department) },
    batch: { $regex: yearPattern },
    email: { $exists: true, $ne: '' }
  })
    .select('fullName email studentId batch department')
    .lean();
};

const notifyStudentsForRecollection = async (recollection) => {
  const students = await getStudentsForRecollection(recollection);
  if (students.length === 0) {
    return { matchedStudents: 0, sent: 0, previewed: 0, failed: 0 };
  }

  const scheduleDate = new Date(recollection.date);
  const formattedDate = scheduleDate.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const subject = `New Recollection Schedule: ${recollection.title}`;
  const results = await Promise.allSettled(students.map((student) => {
    const text = [
      `Hello ${student.fullName},`,
      '',
      'A recollection schedule has been posted for your department and year level.',
      '',
      `Title: ${recollection.title}`,
      `Date and Time: ${formattedDate}`,
      `Venue: ${recollection.venue}`,
      `Department: ${recollection.department}`,
      `Year Level: ${recollection.yearLevel}`,
      recollection.facilitator ? `Facilitator: ${recollection.facilitator}` : '',
      '',
      recollection.description || '',
      '',
      'Please log in to the Campus Ministries System to view the schedule and register if needed.'
    ].filter(Boolean).join('\n');

    const html = `
      <p>Hello ${escapeHtml(student.fullName)},</p>
      <p>A recollection schedule has been posted for your department and year level.</p>
      <ul>
        <li><strong>Title:</strong> ${escapeHtml(recollection.title)}</li>
        <li><strong>Date and Time:</strong> ${formattedDate}</li>
        <li><strong>Venue:</strong> ${escapeHtml(recollection.venue)}</li>
        <li><strong>Department:</strong> ${escapeHtml(recollection.department)}</li>
        <li><strong>Year Level:</strong> ${escapeHtml(recollection.yearLevel)}</li>
        ${recollection.facilitator ? `<li><strong>Facilitator:</strong> ${escapeHtml(recollection.facilitator)}</li>` : ''}
      </ul>
      ${recollection.description ? `<p>${escapeHtml(recollection.description)}</p>` : ''}
      <p>Please log in to the Campus Ministries System to view the schedule and register if needed.</p>
    `;

    return sendEmail({
      to: student.email,
      subject,
      text,
      html
    });
  }));

  return results.reduce((summary, result) => {
    if (result.status === 'rejected') {
      return { ...summary, failed: summary.failed + 1 };
    }
    if (result.value.preview) {
      return { ...summary, previewed: summary.previewed + 1 };
    }
    return { ...summary, sent: summary.sent + 1 };
  }, { matchedStudents: students.length, sent: 0, previewed: 0, failed: 0 });
};

const mapCmoEventToRecollection = (event) => {
  if (!event) return null;
  const plainEvent = typeof event.toObject === 'function' ? event.toObject() : event;
  return {
    ...plainEvent,
    title: plainEvent.description || 'CMO Recollection Schedule',
    description: plainEvent.description || '',
    date: plainEvent.eventDate,
    facilitator: plainEvent.inCharge || '',
    slots: plainEvent.slots || 0,
    participants: plainEvent.participants || [],
    sourceType: 'cmo-event'
  };
};

const buildEventQuery = ({ keyword, date, startDate, endDate } = {}) => {
  const query = {};
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), 'i');
    query.$or = [
      { department: regex },
      { description: regex },
      { batch: regex },
      { yearLevel: regex },
      { venue: regex },
      { inCharge: regex }
    ];
  }

  if (date) {
    const selected = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.eventDate = { $gte: selected, $lte: end };
  } else if (startDate || endDate) {
    query.eventDate = {};
    if (startDate) query.eventDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.eventDate.$lte = end;
    }
  }

  return query;
};

const normalizeRole = (role = '') => {
  const value = String(role).toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'staff' || value === 'formator') return 'staff';
  if (value === 'student_assistant' || value === 'student assistant' || value === 'assistant') return 'student_assistant';
  return 'student';
};

const MAIN_ADMIN_EMAIL = 'dfabela@xu.edu.ph';
const managedAccountRoles = ['admin', 'staff'];
const studentRecordRoles = ['student', 'student_assistant'];

const isMainAdminAccount = (user = {}) => String(user.email || '').toLowerCase() === MAIN_ADMIN_EMAIL;

const validateManagedAccountEmail = (email, role) => {
  const normalizedEmail = String(email || '').toLowerCase();
  return normalizedEmail.endsWith('@xu.edu.ph');
};

const splitName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
};

router.get('/dashboard-cards', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [totalStudents, totalCertificates, eventsNextWeek, eventsThisMonth] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Certificate.countDocuments(),
      CmoEvent.countDocuments({ eventDate: { $gte: now, $lte: nextWeek } }),
      CmoEvent.countDocuments({ eventDate: { $gte: monthStart, $lte: monthEnd } })
    ]);

    res.json({ totalStudents, totalCertificates, eventsNextWeek, eventsThisMonth });
  } catch (error) {
    console.error('Dashboard cards error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/events', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const query = buildEventQuery(req.query);

    const [events, totalCount] = await Promise.all([
      CmoEvent.find(query)
        .sort({ eventDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CmoEvent.countDocuments(query)
    ]);

    res.json({ data: events, totalCount, page, limit });
  } catch (error) {
    console.error('Events list error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/events', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const required = ['eventDate', 'department', 'description', 'batch', 'yearLevel', 'venue', 'inCharge'];
    const missing = required.filter((field) => !req.body[field]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    const event = await CmoEvent.create({
      eventDate: new Date(req.body.eventDate),
      department: req.body.department,
      description: req.body.description,
      batch: req.body.batch,
      yearLevel: req.body.yearLevel,
      venue: req.body.venue,
      inCharge: req.body.inCharge,
      slots: Math.max(Number(req.body.slots) || 40, 0),
      createdBy: req.user.id
    });

    try {
      await notifyStudentsForRecollection(mapCmoEventToRecollection(event));
    } catch (notificationError) {
      console.error('CMO event notification error:', notificationError);
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/events/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const event = await CmoEvent.findByIdAndUpdate(
      req.params.id,
      {
        eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
        department: req.body.department,
        description: req.body.description,
        batch: req.body.batch,
        yearLevel: req.body.yearLevel,
        venue: req.body.venue,
        inCharge: req.body.inCharge,
        slots: req.body.slots !== undefined ? Math.max(Number(req.body.slots) || 0, 0) : undefined
      },
      { new: true, runValidators: true }
    );

    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/events/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const event = await CmoEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await User.updateMany(
      { registeredRecollections: req.params.id },
      { $pull: { registeredRecollections: req.params.id } }
    );
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/certificate-templates', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const keyword = String(req.query.keyword || '').trim();
    const query = keyword
      ? { templateTitle: { $regex: escapeRegex(keyword), $options: 'i' } }
      : {};

    const templates = await CertificateTemplate.find(query).sort({ createdAt: -1 }).lean();
    res.json(templates);
  } catch (error) {
    console.error('Certificate templates error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/certificate-templates', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const required = ['templateTitle', 'certEventYearLevel', 'certEventType', 'certEventTheme', 'certEventDate', 'certEventVenue', 'certDirectorName'];
    const missing = required.filter((field) => !req.body[field]);
    if (missing.length) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });

    const template = await CertificateTemplate.create({
      templateTitle: req.body.templateTitle,
      certBgImgKey: req.body.certBgImgKey || '',
      certEventYearLevel: req.body.certEventYearLevel,
      certEventType: req.body.certEventType,
      certEventTheme: req.body.certEventTheme,
      certEventDate: req.body.certEventDate,
      certEventVenue: req.body.certEventVenue,
      certDirectorName: req.body.certDirectorName,
      certSigImgKey: req.body.certSigImgKey || '',
      createdBy: req.user.id
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create certificate template error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/certificate-templates/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const template = await CertificateTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    console.error('Update certificate template error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/certificate-templates/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const template = await CertificateTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete certificate template error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/student-profile/:studentId', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const student = await User.findOne({
      role: { $in: studentRecordRoles },
      studentId: req.params.studentId
    })
      .populate({
        path: 'certificates',
        populate: { path: 'issuedBy', select: 'fullName email' }
      })
      .lean();

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const certificates = (student.certificates || []).map((certificate) => ({
      certificateId: certificate._id,
      certificateURL: certificate.qrCode || '',
      qrCode: certificate.qrCode || '',
      qrData: certificate.qrData || '',
      eventName: certificate.eventName,
      eventDate: certificate.eventDate,
      DateGenerated: certificate.createdAt,
      CreatedBy: certificate.issuedBy?.fullName || 'Campus Ministries',
      status: certificate.status,
      templateTitle: certificate.templateTitle || '',
      certBgImgKey: certificate.certBgImgKey || '',
      certEventYearLevel: certificate.certEventYearLevel || '',
      certEventType: certificate.certEventType || '',
      certEventTheme: certificate.certEventTheme || '',
      certEventVenue: certificate.certEventVenue || '',
      certDirectorName: certificate.certDirectorName || '',
      certSigImgKey: certificate.certSigImgKey || ''
    }));

    res.json({
      studentName: student.fullName,
      studentId: student.studentId,
      college: student.college || '',
      department: student.department || '',
      major: student.major || '',
      yearStanding: student.yearStanding || String(student.batch || '').match(/-(\d)/)?.[1] || '',
      departmentYearStanding: `${student.department || 'No Department'} - ${student.yearStanding || String(student.batch || '').match(/-(\d)/)?.[1] || 'No Year'}`,
      certificatesTotal: certificates.length,
      certificates
    });
  } catch (error) {
    console.error('Student profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 🔥 FIXED: Create Evaluation (Removes invalid _id from questions)
router.post('/evaluations', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    console.log('📝 Creating evaluation:', req.body.title);
    const faculty = await getFacultyScope(req);
    
    // ✅ CRITICAL FIX: Remove _id from questions (frontend timestamp bug)
    const cleanQuestions = (req.body.questions || []).map(question => {
      const { _id, id, ...cleanQuestion } = question;
      return {
        ...cleanQuestion,
        required: cleanQuestion.required ?? true
      };
    });

    const batch = req.body.batch || 'General';
    let assignedStudents = req.body.assignedStudents || [];

    if (!ensureFacultyBatchAccess(faculty, batch)) {
      return res.status(403).json({ message: 'Formator can only create evaluations for their assigned course/year scope' });
    }
    
    // Auto-assign students based on batch if no specific students selected
    if (assignedStudents.length === 0 && batch && batch !== 'General') {
      const studentQuery = applyFacultyStudentScope({ role: 'student', batch: { $regex: `^${escapeRegex(batch)}` } }, faculty);
      const batchStudents = await User.find(studentQuery).select('_id');
      assignedStudents = batchStudents.map(s => s._id);
      console.log(`🎯 Auto-assigning ${assignedStudents.length} students from batch: ${batch}`);
    } else if (faculty && assignedStudents.length > 0) {
      const scopedStudents = await User.find(applyFacultyStudentScope({
        role: 'student',
        _id: { $in: assignedStudents }
      }, faculty)).select('_id');
      if (scopedStudents.length !== assignedStudents.length) {
        return res.status(403).json({ message: 'Formator can only assign students in their assigned scope' });
      }
    }

    const evaluationData = {
      title: req.body.title,
      description: req.body.description || '',
      questions: cleanQuestions,
      assignedStudents: assignedStudents,
      batch: batch,
      dueDate: new Date(req.body.dueDate),
      createdBy: req.user.id
    };

    console.log('✅ Cleaned questions:', cleanQuestions.length);

    const evaluation = new Evaluation(evaluationData);
    await evaluation.save();

    console.log(`🎉 Evaluation created: ${evaluation._id}`);

    // Assign to students
    if (assignedStudents && assignedStudents.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedStudents } },
        { $addToSet: { assignedEvaluations: evaluation._id } }
      );
      console.log(`👥 Assigned to ${assignedStudents.length} students`);
    }

    const populatedEval = await Evaluation.findById(evaluation._id)
      .populate('createdBy', 'fullName')
      .populate('assignedStudents', 'fullName studentId');

    res.status(201).json(populatedEval);
  } catch (error) {
    console.error('❌ Create evaluation ERROR:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      message: 'Failed to create evaluation',
      error: error.message,
      details: error.errors ? Object.keys(error.errors) : 'Unknown'
    });
  }
});

// Get evaluations
router.get('/evaluations', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const faculty = await getFacultyScope(req);
    const query = faculty?.batch ? { batch: { $regex: `^${escapeRegex(faculty.batch)}` } } : {};
    const evaluations = await Evaluation.find(query)
      .populate('createdBy', 'fullName')
      .populate('assignedStudents', 'fullName studentId')
      .sort({ createdAt: -1 });
    res.json(evaluations);
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete evaluation
router.delete('/evaluations/:id', [auth, adminAuth], async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Remove evaluation from all students' assignedEvaluations
    await User.updateMany(
      { assignedEvaluations: req.params.id },
      { $pull: { assignedEvaluations: req.params.id } }
    );

    // Delete the evaluation
    await Evaluation.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Evaluation deleted: ${req.params.id}`);
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get recollection schedules
router.get('/recollections', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const faculty = await getFacultyScope(req);
    const query = faculty
      ? {
          ...(faculty.department ? { department: faculty.department } : {}),
          ...(faculty.batch ? { yearLevel: String(faculty.batch).match(/-(\d)/)?.[1] || undefined } : {})
        }
      : {};
    if (query.yearLevel === undefined) delete query.yearLevel;

    const recollections = await Recollection.find(query)
      .populate('participants', 'fullName studentId batch department')
      .sort({ date: 1 });

    res.json(recollections);
  } catch (error) {
    console.error('Get recollections error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get one recollection schedule with registrants
router.get('/recollections/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    let recollection = await Recollection.findById(req.params.id)
      .populate('participants', 'fullName studentId email batch department')
      .sort({ date: 1 });

    if (!recollection) {
      const event = await CmoEvent.findById(req.params.id)
        .populate('participants', 'fullName studentId email batch department')
        .lean();

      if (!event) {
        return res.status(404).json({ message: 'Recollection schedule not found' });
      }

      recollection = mapCmoEventToRecollection(event);
    }

    res.json(recollection);
  } catch (error) {
    console.error('Get recollection error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create recollection schedule
router.post('/recollections', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const faculty = await getFacultyScope(req);
    if (!['1', '2', '3', '4'].includes(req.body.yearLevel)) {
      return res.status(400).json({ message: 'Please select a valid year level' });
    }

    if (!departments.includes(req.body.department)) {
      return res.status(400).json({ message: 'Please select a valid department' });
    }

    if (faculty) {
      const facultyYearLevel = String(faculty.batch || '').match(/-(\d)/)?.[1] || '';
      if ((faculty.department && req.body.department !== faculty.department) ||
        (facultyYearLevel && req.body.yearLevel !== facultyYearLevel)) {
        return res.status(403).json({ message: 'Formator can only create recollections in their assigned scope' });
      }
    }

    const recollection = new Recollection({
      title: req.body.title,
      description: req.body.description || '',
      date: new Date(req.body.date),
      venue: req.body.venue,
      department: req.body.department,
      yearLevel: req.body.yearLevel,
      facilitator: req.body.facilitator || '',
      slots: Number(req.body.slots) || 40
    });

    await recollection.save();
    let emailNotification = { matchedStudents: 0, sent: 0, previewed: 0, failed: 0 };
    try {
      emailNotification = await notifyStudentsForRecollection(recollection);
    } catch (notificationError) {
      console.error('Recollection email notification error:', notificationError);
      emailNotification = {
        ...emailNotification,
        failed: 1,
        error: 'Schedule was created, but email notifications failed.'
      };
    }

    res.status(201).json({
      ...recollection.toObject(),
      emailNotification
    });
  } catch (error) {
    console.error('Create recollection error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete recollection schedule
router.delete('/recollections/:id', [auth, adminAuth], async (req, res) => {
  try {
    const recollection = await Recollection.findById(req.params.id);
    if (!recollection) {
      return res.status(404).json({ message: 'Recollection schedule not found' });
    }

    await User.updateMany(
      { registeredRecollections: req.params.id },
      { $pull: { registeredRecollections: req.params.id } }
    );
    await Recollection.findByIdAndDelete(req.params.id);

    res.json({ message: 'Recollection schedule deleted successfully' });
  } catch (error) {
    console.error('Delete recollection error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate certificate
router.post('/certificates', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const { studentId, eventName, eventDate, templateId } = req.body;
    
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const template = templateId ? await CertificateTemplate.findById(templateId).lean() : null;

    const certificate = new Certificate({
      student: studentId,
      eventName,
      eventDate: new Date(eventDate),
      issuedBy: req.user.id,
      status: 'issued',
      templateTitle: template?.templateTitle || '',
      certBgImgKey: template?.certBgImgKey || '',
      certEventYearLevel: template?.certEventYearLevel || '',
      certEventType: template?.certEventType || '',
      certEventTheme: template?.certEventTheme || '',
      certEventVenue: template?.certEventVenue || '',
      certDirectorName: template?.certDirectorName || '',
      certSigImgKey: template?.certSigImgKey || ''
    });

    certificate.qrData = `CERT:${certificate._id}:${student._id}:Xavier-eCMS`;
    certificate.qrCode = await QRCode.toDataURL(certificate.qrData, {
      margin: 1,
      color: {
        dark: '#111111',
        light: '#00000000'
      }
    });

    await certificate.save();
    await User.findByIdAndUpdate(studentId, { $push: { certificates: certificate._id } });

    const populatedCert = await Certificate.findById(certificate._id)
      .populate('student', 'fullName studentId')
      .populate('issuedBy', 'fullName');

    res.status(201).json(populatedCert);
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify certificate QR code
router.post('/certificates/verify', [auth, adminFacultyOrAssistantAuth], async (req, res) => {
  try {
    const { code } = req.body;
    const scannedCode = String(code || '').trim();

    if (!scannedCode) {
      return res.status(400).json({ message: 'QR code data is required' });
    }

    const query = {
      $or: [
        { qrData: scannedCode },
        { qrCode: scannedCode }
      ]
    };

    if (/^[0-9a-fA-F]{24}$/.test(scannedCode)) {
      query.$or.push({ _id: scannedCode });
    }

    if (scannedCode.startsWith('CERT:')) {
      const [, firstPart, secondPart] = scannedCode.split(':');
      if (firstPart && secondPart) {
        query.$or.push({ qrData: { $regex: `^CERT:${escapeRegex(firstPart)}:${escapeRegex(secondPart)}:` } });
      }
    }

    const certificate = await Certificate.findOne(query)
      .populate('student', 'fullName studentId email batch department')
      .populate('issuedBy', 'fullName email');

    if (!certificate) {
      return res.status(404).json({ valid: false, message: 'Certificate not found or QR code is invalid' });
    }

    if (certificate.status !== 'verified') {
      certificate.status = 'verified';
      await certificate.save();
    }

    const certificateWithTemplate = await applyCertificateTemplateFallback(certificate);

    res.json({
      valid: true,
      message: 'Certificate verified successfully',
      certificate: certificateWithTemplate
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Stats
router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const [evaluations, students, certificates] = await Promise.all([
      Evaluation.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Certificate.countDocuments()
    ]);

    const pendingEvaluations = await Evaluation.countDocuments({
      'submissions.0': { $exists: false }
    });

    const totalSubmissions = await Evaluation.aggregate([
      { $unwind: '$submissions' },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).then(result => result[0]?.count || 0);

    res.json({
      totalEvaluations: evaluations,
      totalStudents: students,
      totalCertificates: certificates,
      pendingEvaluations,
      totalSubmissions
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

const getSubmissionRows = async () => {
  const evaluations = await Evaluation.find({ 'submissions.0': { $exists: true } })
    .populate('submissions.student', 'fullName studentId email batch')
    .sort({ updatedAt: -1 });

  return evaluations.flatMap((evaluation) =>
    evaluation.submissions.map((submission) => ({
      _id: submission._id,
      studentId: submission.student?._id,
      studentName: submission.student?.fullName || 'Unknown student',
      studentNumber: submission.student?.studentId || '',
      studentEmail: submission.student?.email || '',
      batch: submission.student?.batch || '',
      evaluationId: evaluation._id,
      evaluationTitle: evaluation.title,
      submittedAt: submission.submittedAt,
      answers: submission.answers || {}
    }))
  ).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

// Detailed analytics for the data management page
router.get('/stats-detailed', [auth, adminAuth], async (req, res) => {
  try {
    const [totalEvaluations, totalStudents, totalCertificates, totalUsers, submissionRows] = await Promise.all([
      Evaluation.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Certificate.countDocuments(),
      User.countDocuments(),
      getSubmissionRows()
    ]);

    res.json({
      totalEvaluations,
      totalStudents,
      totalCertificates,
      totalUsers,
      totalSubmissions: submissionRows.length
    });
  } catch (error) {
    console.error('Detailed stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Recent evaluation submissions
router.get('/submissions', [auth, adminAuth], async (req, res) => {
  try {
    const submissions = await getSubmissionRows();
    res.json(submissions);
  } catch (error) {
    console.error('Submissions error:', error);
    res.status(500).json({ message: error.message });
  }
});

const csvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

// Export submissions as CSV
router.get('/export-csv', [auth, adminAuth], async (req, res) => {
  try {
    const submissions = await getSubmissionRows();
    const header = [
      'Student Name',
      'Student ID',
      'Email',
      'Batch',
      'Evaluation',
      'Submitted At',
      'Answers'
    ];

    const rows = submissions.map((submission) => [
      submission.studentName,
      submission.studentNumber,
      submission.studentEmail,
      submission.batch,
      submission.evaluationTitle,
      submission.submittedAt ? new Date(submission.submittedAt).toISOString() : '',
      JSON.stringify(submission.answers)
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvValue).join(','))
      .join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`ecms-report-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Students list
router.get('/students', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const { batch, yearLevel, completionStatus } = req.query;
    const query = { role: { $in: studentRecordRoles } };

    if (batch) {
      query.batch = { $regex: `^${escapeRegex(batch)}` };
    } else if (yearLevel) {
      query.batch = { $regex: `-${yearLevel}` };
    }

    let students = await User.find(query)
      .select('fullName firstName lastName studentId email role batch college department major yearStanding certificates')
      .sort({ fullName: 1 })
      .limit(200)
      .lean();

    const studentIds = students.map((student) => student._id);
    const submissionCounts = await Evaluation.aggregate([
      { $unwind: '$submissions' },
      { $match: { 'submissions.student': { $in: studentIds } } },
      {
        $group: {
          _id: '$submissions.student',
          completedEvaluations: { $sum: 1 },
          latestSubmissionAt: { $max: '$submissions.submittedAt' }
        }
      }
    ]);

    const completionByStudent = new Map(
      submissionCounts.map((submission) => [submission._id.toString(), submission])
    );

    students = students.map((student) => {
      const completion = completionByStudent.get(student._id.toString());
      return {
        ...student,
        firstName: student.firstName || splitName(student.fullName).firstName,
        lastName: student.lastName || splitName(student.fullName).lastName,
        yearStanding: student.yearStanding || String(student.batch || '').match(/-(\d)/)?.[1] || '',
        certificateCount: student.certificates?.length || 0,
        completedEvaluations: completion?.completedEvaluations || 0,
        latestSubmissionAt: completion?.latestSubmissionAt || null
      };
    });

    if (completionStatus === 'completed') {
      students = students.filter((student) => student.completedEvaluations > 0);
    }

    res.json(students);
  } catch (error) {
    console.error('Students error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/formators', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const formators = await User.find({ role: 'staff', status: { $ne: 'inactive' } })
      .select('fullName email department batch')
      .sort({ fullName: 1, email: 1 })
      .lean();
    res.json(formators);
  } catch (error) {
    console.error('Formators error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const role = req.query.role ? normalizeRole(req.query.role) : null;
    const query = role ? { role } : {};
    const users = await User.find(query)
      .select('fullName email role status batch department studentId createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/users', [auth, adminAuth], async (req, res) => {
  try {
    const { fullName, username, email, password, role, status, department, batch } = req.body;
    if (!email || !password || !(fullName || username)) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const displayName = fullName || username;
    const accountRole = normalizeRole(role);
    if (!managedAccountRoles.includes(accountRole)) {
      return res.status(400).json({ message: 'Please select a valid system account role' });
    }
    if (!validateManagedAccountEmail(email, accountRole)) {
      return res.status(400).json({
        message: 'Admin and formator accounts must use @xu.edu.ph email'
      });
    }
    const newUser = new User({
      fullName: displayName,
      email: String(email).toLowerCase(),
      password,
      role: accountRole,
      status: ['active', 'inactive'].includes(status) ? status : 'active',
      department: department || '',
      batch: batch || '',
      studentId: req.body.studentId || `USR${Date.now()}`
    });

    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      batch: newUser.batch,
      department: newUser.department,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id', [auth, adminAuth], async (req, res) => {
  try {
    const { fullName, username, email, password, role, status, department, batch } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isMainAdminAccount(user)) {
      if (String(req.user.id) !== String(user._id)) {
        return res.status(403).json({ message: 'Only the main admin can update the main admin account' });
      }

      const nextEmail = email ? String(email).toLowerCase() : user.email;
      const nextRole = role ? normalizeRole(role) : user.role;
      const nextStatus = status && ['active', 'inactive'].includes(status) ? status : user.status;

      if (nextEmail !== user.email || nextRole !== 'admin' || nextStatus !== 'active') {
        return res.status(403).json({ message: 'Main admin role, email, and active status cannot be changed' });
      }
    }

    const normalizedRole = role ? normalizeRole(role) : user.role;
    if (role && !managedAccountRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Please select a valid system account role' });
    }
    if (email && !validateManagedAccountEmail(email, normalizedRole)) {
      return res.status(400).json({
        message: 'Admin and formator accounts must use @xu.edu.ph email'
      });
    }

    const updates = {
      ...(fullName || username ? { fullName: fullName || username } : {}),
      ...(email ? { email: String(email).toLowerCase() } : {}),
      ...(role ? { role: normalizedRole } : {}),
      ...(status && ['active', 'inactive'].includes(status) ? { status } : {}),
      ...(department !== undefined ? { department } : {}),
      ...(batch !== undefined ? { batch } : {})
    };

    Object.assign(user, updates);
    if (password) user.password = password;
    await user.save();

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      batch: user.batch,
      department: user.department,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/users/:id', [auth, adminAuth], async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isMainAdminAccount(user)) {
      return res.status(403).json({ message: 'Main admin account cannot be deleted' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/students', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const { studentId, college, department, major, email, firstName, lastName, yearStanding } = req.body;
    if (!studentId || !department || !email || !firstName || !lastName || !yearStanding) {
      return res.status(400).json({ message: 'Student ID, name, email, department, and year standing are required' });
    }

    const existing = await User.findOne({ $or: [{ studentId }, { email: String(email).toLowerCase() }] });
    if (existing) return res.status(400).json({ message: 'Student ID or email already exists' });

    const student = new User({
      studentId,
      college: college || '',
      department,
      major: major || '',
      email: String(email).toLowerCase(),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      yearStanding,
      batch: `${department}-${yearStanding}`,
      role: 'student',
      password: 'password123'
    });

    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/students/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const { college, department, major, email, firstName, lastName, yearStanding } = req.body;
    const student = await User.findById(req.params.id);
    if (!student || !studentRecordRoles.includes(student.role)) return res.status(404).json({ message: 'Student not found' });

    const names = splitName(req.body.fullName || student.fullName);
    student.college = college ?? student.college;
    student.department = department ?? student.department;
    student.major = major ?? student.major;
    student.email = email ? String(email).toLowerCase() : student.email;
    student.firstName = firstName || names.firstName;
    student.lastName = lastName || names.lastName;
    student.fullName = `${student.firstName} ${student.lastName}`.trim();
    student.yearStanding = yearStanding ?? student.yearStanding;
    if (student.department && student.yearStanding) student.batch = `${student.department}-${student.yearStanding}`;
    await student.save();

    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.patch('/students/:id/assistant-role', [auth, adminAuth], async (req, res) => {
  try {
    const { enabled } = req.body;
    const student = await User.findById(req.params.id);
    if (!student || !studentRecordRoles.includes(student.role)) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!String(student.email || '').toLowerCase().endsWith('@my.xu.edu.ph')) {
      return res.status(400).json({ message: 'Student assistant must use a student @my.xu.edu.ph email' });
    }

    student.role = enabled ? 'student_assistant' : 'student';
    await student.save();

    res.json({
      _id: student._id,
      role: student.role,
      fullName: student.fullName,
      email: student.email,
      studentId: student.studentId
    });
  } catch (error) {
    console.error('Update student assistant role error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/students/:id', [auth, adminOrFacultyAuth], async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: { $in: studentRecordRoles } });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get certificates
router.get('/certificates', [auth, adminAuth], async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('student', 'fullName studentId')
      .populate('issuedBy', 'fullName')
      .sort({ createdAt: -1 });
    res.json(certificates);
  } catch (error) {
    console.error('Certificates error:', error);
    res.status(500).json({ message: error.message });
  }
});

return router;
})();

const facultyRouter = (() => {
const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const User = require('../models/userSchema');
const Recollection = require('../models/Recollection');
const CertificateRecommendation = require('../models/CertificateRecommendation');

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const facultyAuth = (req, res, next) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ message: 'Formator access required' });
  }
  next();
};

const getYearLevelFromBatch = (batch = '') => {
  const match = String(batch).match(/-(\d)/);
  return match ? match[1] : '';
};

const buildStudentScope = (faculty) => {
  const scope = { role: 'student' };
  if (faculty.department) scope.department = faculty.department;
  if (faculty.batch) scope.batch = { $regex: `^${faculty.batch}` };
  return scope;
};

router.get('/dashboard', [auth, facultyAuth], async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id).select('fullName email department batch');
    if (!faculty) return res.status(404).json({ message: 'Formator not found' });

    const studentScope = buildStudentScope(faculty);
    const students = await User.find(studentScope)
      .select('fullName studentId email batch department certificates')
      .sort({ fullName: 1 })
      .lean();

    const studentIds = students.map((student) => student._id);
    const evaluations = await Evaluation.find({
      $or: [
        { assignedStudents: { $in: studentIds } },
        ...(faculty.batch ? [{ batch: { $regex: `^${faculty.batch}` } }] : [])
      ]
    })
      .populate('createdBy', 'fullName')
      .sort({ dueDate: 1 })
      .lean();

    const completionByStudent = new Map(students.map((student) => [student._id.toString(), 0]));
    evaluations.forEach((evaluation) => {
      (evaluation.submissions || []).forEach((submission) => {
        const studentId = submission.student?.toString();
        if (completionByStudent.has(studentId)) {
          completionByStudent.set(studentId, completionByStudent.get(studentId) + 1);
        }
      });
    });

    const studentsWithProgress = students.map((student) => {
      const completedEvaluations = completionByStudent.get(student._id.toString()) || 0;
      return {
        ...student,
        completedEvaluations,
        certificateCount: student.certificates?.length || 0
      };
    });

    const completedStudents = studentsWithProgress.filter((student) => student.completedEvaluations > 0).length;
    const pendingStudents = Math.max(studentsWithProgress.length - completedStudents, 0);

    const yearLevel = getYearLevelFromBatch(faculty.batch);
    const recollectionQuery = {
      date: { $gte: new Date() },
      ...(faculty.department ? { department: faculty.department } : {}),
      ...(yearLevel ? { yearLevel } : {})
    };
    const recollections = await Recollection.find(recollectionQuery)
      .populate('participants', 'fullName studentId batch department')
      .sort({ date: 1 })
      .lean();

    const recommendations = await CertificateRecommendation.find({ recommendedBy: req.user.id })
      .populate('student', 'fullName studentId batch department')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      faculty: {
        fullName: faculty.fullName,
        email: faculty.email,
        department: faculty.department || '',
        batch: faculty.batch || ''
      },
      stats: {
        assignedStudents: studentsWithProgress.length,
        completedStudents,
        pendingStudents,
        scopedEvaluations: evaluations.length,
        upcomingRecollections: recollections.length,
        recommendations: recommendations.length
      },
      students: studentsWithProgress,
      evaluations: evaluations.map((evaluation) => ({
        _id: evaluation._id,
        title: evaluation.title,
        batch: evaluation.batch,
        dueDate: evaluation.dueDate,
        assignedCount: evaluation.assignedStudents?.length || 0,
        submissionCount: evaluation.submissions?.length || 0,
        createdBy: evaluation.createdBy
      })),
      recollections: recollections.map((recollection) => ({
        ...recollection,
        participantCount: recollection.participants?.length || 0
      })),
      recommendations
    });
  } catch (error) {
    console.error('Formator dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/certificate-recommendations', [auth, facultyAuth], async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id).select('department batch');
    const student = await User.findOne({
      _id: req.body.studentId,
      ...buildStudentScope(faculty)
    });

    if (!student) {
      return res.status(404).json({ message: 'Student is not in your assigned scope' });
    }

    const recommendation = await CertificateRecommendation.findOneAndUpdate(
      { student: student._id, recommendedBy: req.user.id, status: 'pending' },
      {
        student: student._id,
        recommendedBy: req.user.id,
        reason: req.body.reason || 'Completed assigned evaluation requirements',
        status: 'pending'
      },
      { upsert: true, new: true }
    ).populate('student', 'fullName studentId batch department');

    res.status(201).json({
      message: 'Certificate recommendation sent to admin',
      recommendation
    });
  } catch (error) {
    console.error('Certificate recommendation error:', error);
    res.status(500).json({ message: error.message });
  }
});

return router;
})();

const studentRouter = (() => {
const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const Certificate = require('../models/certificatesSchema');
const CertificateTemplate = require('../models/certTemplateSchema');
const User = require('../models/userSchema');
const Recollection = require('../models/Recollection');
const CmoEvent = require('../models/eventsSchema');
const router = express.Router();

const getYearLevelFromBatch = (batch = '') => {
  const match = String(batch).match(/-(\d)/);
  return match ? match[1] : '';
};

const inferDepartmentFromBatch = (batch = '') => {
  if (/^BSIT-|^BSCS-|^BSIS-/.test(batch)) return 'Computer Studies';
  if (/^ABCom-/.test(batch)) return 'Arts and Science';
  return '';
};

const getStudentDepartment = (user) => user?.department || inferDepartmentFromBatch(user?.batch || '');

const departments = [
  'Agriculture',
  'Arts and Science',
  'Business Management',
  'Computer Studies',
  'Education',
  'Engineering',
  'Nursing',
  'BS Agribusiness',
  'BS Agriculture',
  'BS Agricultural & Biosystems Engineering',
  'BS Food Technology',
  'BS Development Communication',
  'AB Economics',
  'AB History',
  'AB Interdisciplinary Studies',
  'AB International Studies',
  'AB English Language',
  'AB Literature',
  'AB Philosophy',
  'AB Psychology',
  'AB Sociology',
  'BS Biology',
  'BS Chemistry',
  'BS Marine Biology',
  'BS Mathematics',
  'BS Psychology',
  'BS Accountancy',
  'BS Business Administration',
  'BS Management Accounting',
  'BS Computer Science',
  'BS Information Systems',
  'BS Information Technology',
  'BS Entertainment & Multimedia Computing',
  'Bachelor of Early Childhood Education',
  'Bachelor of Elementary Education',
  'Bachelor of Special Needs Education',
  'Bachelor of Technology and Livelihood Education',
  'Bachelor of Secondary Education',
  'BS Chemical Engineering',
  'BS Civil Engineering',
  'BS Electrical Engineering',
  'BS Electronics Engineering',
  'BS Industrial Engineering',
  'BS Mechanical Engineering',
  'BS Nursing'
];

const courses = ['BSIT', 'BSCS', 'BSIS', 'ABCom'];
const RECENT_SCHEDULE_WINDOW_HOURS = 168;

const getCourseFromBatch = (batch = '') => {
  const match = String(batch).match(/^([A-Za-z]+)-/);
  return match ? match[1] : '';
};

const studentColleges = [
  {
    value: 'Agriculture',
    departments: ['BS Agribusiness', 'BS Agriculture', 'BS Agricultural & Biosystems Engineering', 'BS Food Technology', 'BS Development Communication', 'Agriculture']
  },
  {
    value: 'Arts Science',
    departments: ['AB Economics', 'AB History', 'AB Interdisciplinary Studies', 'AB International Studies', 'AB English Language', 'AB Literature', 'AB Philosophy', 'AB Psychology', 'AB Sociology', 'BS Biology', 'BS Chemistry', 'BS Marine Biology', 'BS Mathematics', 'BS Psychology', 'Arts and Science', 'Arts and Sciences']
  },
  {
    value: 'Business Management',
    departments: ['BS Accountancy', 'BS Business Administration', 'BS Management Accounting', 'Business Management']
  },
  {
    value: 'Computer Studies',
    departments: ['BS Computer Science', 'BS Information Systems', 'BS Information Technology', 'BS Entertainment & Multimedia Computing', 'Computer Studies']
  },
  {
    value: 'Education',
    departments: ['Bachelor of Early Childhood Education', 'Bachelor of Elementary Education', 'Bachelor of Special Needs Education', 'Bachelor of Technology and Livelihood Education', 'Bachelor of Secondary Education', 'Education']
  },
  {
    value: 'Engineering',
    departments: ['BS Chemical Engineering', 'BS Civil Engineering', 'BS Civil Engineerring', 'BS Electrical Engineering', 'BS Electronics Engineering', 'BS Industrial Engineering', 'BS Mechanical Engineering', 'Engineering']
  },
  {
    value: 'Nursing',
    departments: ['BS Nursing', 'Nursing']
  }
];

const getCollegeForStudentDepartment = (department = '') => (
  studentColleges.find((college) => college.departments.includes(department))?.value || ''
);

const isValidCollegeDepartment = (college = '', department = '') => (
  studentColleges.some((item) => item.value === college && item.departments.includes(department))
);

const studentDepartmentGroups = [
  ['Agriculture', 'BS Agribusiness', 'BS Agriculture', 'BS Agricultural & Biosystems Engineering', 'BS Food Technology', 'BS Development Communication'],
  ['Arts and Science', 'Arts and Sciences', 'AB Economics', 'AB History', 'AB Interdisciplinary Studies', 'AB International Studies', 'AB English Language', 'AB Literature', 'AB Philosophy', 'AB Psychology', 'AB Sociology', 'BS Biology', 'BS Chemistry', 'BS Marine Biology', 'BS Mathematics', 'BS Psychology'],
  ['Business Management', 'BS Accountancy', 'BS Business Administration', 'BS Management Accounting'],
  ['Computer Studies', 'BS Computer Science', 'BS Information Systems', 'BS Information Technology', 'BS Entertainment & Multimedia Computing'],
  ['Education', 'Bachelor of Early Childhood Education', 'Bachelor of Elementary Education', 'Bachelor of Special Needs Education', 'Bachelor of Technology and Livelihood Education', 'Bachelor of Secondary Education'],
  ['Engineering', 'BS Chemical Engineering', 'BS Civil Engineering', 'BS Civil Engineerring', 'BS Electrical Engineering', 'BS Electronics Engineering', 'BS Industrial Engineering', 'BS Mechanical Engineering'],
  ['Nursing', 'BS Nursing']
];

const getStudentDepartmentMatchValues = (department = '') => {
  const group = studentDepartmentGroups.find((items) => items.includes(department));
  return [...new Set(group || [department])];
};

const mapStudentCmoEventToSchedule = (event, studentId) => {
  const participants = event.participants || [];
  return {
    ...event.toObject(),
    title: event.description || 'CMO Recollection Schedule',
    description: event.description || '',
    date: event.eventDate,
    facilitator: event.inCharge || '',
    slots: event.slots || 0,
    participantCount: participants.length,
    isRegistered: participants.some((participantId) => participantId.toString() === studentId),
    sourceType: 'cmo-event'
  };
};

const buildStudentProfile = (user) => {
  const batch = user?.batch || '';
  const department = getStudentDepartment(user);
  const yearLevel = getYearLevelFromBatch(batch);
  const college = user?.college || getCollegeForStudentDepartment(department);

  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
    college,
    department,
    yearLevel,
    batch,
    profileComplete: Boolean(college && department && yearLevel)
  };
};

const applyStudentCertificateTemplateFallback = async (certificate) => {
  const certificateObject = typeof certificate.toObject === 'function' ? certificate.toObject() : { ...certificate };
  if (certificateObject.certBgImgKey || certificateObject.certSigImgKey) return certificateObject;

  const template = await CertificateTemplate.findOne({
    $or: [
      { templateTitle: certificateObject.eventName },
      { certEventType: certificateObject.eventName }
    ]
  }).lean();

  if (!template) return certificateObject;

  return {
    ...certificateObject,
    templateTitle: certificateObject.templateTitle || template.templateTitle || '',
    certBgImgKey: certificateObject.certBgImgKey || template.certBgImgKey || '',
    certEventYearLevel: certificateObject.certEventYearLevel || template.certEventYearLevel || '',
    certEventType: certificateObject.certEventType || template.certEventType || '',
    certEventTheme: certificateObject.certEventTheme || template.certEventTheme || '',
    certEventVenue: certificateObject.certEventVenue || template.certEventVenue || '',
    certDirectorName: certificateObject.certDirectorName || template.certDirectorName || '',
    certSigImgKey: certificateObject.certSigImgKey || template.certSigImgKey || ''
  };
};

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('assignedEvaluations certificates');
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentYearLevel = getYearLevelFromBatch(user?.batch);
    const studentDepartment = getStudentDepartment(user);
    const matchingDepartments = getStudentDepartmentMatchValues(studentDepartment);
    
    // Get evaluations assigned to this student that haven't been submitted
    const evaluations = await Evaluation.find({
      assignedStudents: req.user.id,
      submissions: { $not: { $elemMatch: { student: req.user.id } } }
    }).populate('createdBy', 'fullName');

    // Also get evaluations that might be available for self-enrollment
    const availableEvaluations = await Evaluation.find({
      _id: { $nin: user.assignedEvaluations || [] },
      dueDate: { $gte: new Date() }
    }).populate('createdBy', 'fullName');

    const cmoEvents = await CmoEvent.find({
      eventDate: { $gte: new Date() },
      department: { $in: matchingDepartments },
      yearLevel: studentYearLevel
    }).sort({ eventDate: 1 });

    const cmoEventSchedules = cmoEvents.map((event) => mapStudentCmoEventToSchedule(event, req.user.id));
    const recollectionSchedules = cmoEventSchedules
      .sort((first, second) => new Date(first.date) - new Date(second.date));

    const recentScheduleThreshold = new Date(Date.now() - RECENT_SCHEDULE_WINDOW_HOURS * 60 * 60 * 1000);
    const newScheduleNotifications = recollectionSchedules
      .filter((schedule) => new Date(schedule.createdAt) >= recentScheduleThreshold)
      .map((schedule) => ({
        _id: schedule._id,
        title: schedule.title,
        date: schedule.date,
        venue: schedule.venue,
        description: schedule.description || '',
        message: `New recollection available for ${schedule.department} Year ${schedule.yearLevel}.`,
        isRegistered: schedule.isRegistered
      }));

    const certificateRows = await Promise.all((user.certificates || []).map(async (certificate) => {
      const certificateWithTemplate = await applyStudentCertificateTemplateFallback(certificate);
      return {
      ...certificateWithTemplate,
      studentName: user.fullName,
      studentId: user.studentId,
      studentEmail: user.email,
      studentDepartment: user.department,
      studentCollege: user.college,
      studentYearStanding: user.yearStanding || getYearLevelFromBatch(user.batch)
      };
    }));

    res.json({
      profile: buildStudentProfile(user),
      announcements: [
        "Welcome back to Campus Ministries!",
        "Complete your evaluations before the deadline",
        "Check your certificates below"
      ],
      pendingEvaluations: evaluations,
      availableEvaluations: availableEvaluations,
      recollectionSchedules,
      newScheduleNotifications,
      certificates: certificateRows
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(buildStudentProfile(user));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { college, department, yearLevel } = req.body;

    if (!studentColleges.some((item) => item.value === college)) {
      return res.status(400).json({ message: 'Please select a valid college' });
    }

    if (!isValidCollegeDepartment(college, department)) {
      return res.status(400).json({ message: 'Please select a valid department for the selected college' });
    }

    if (!['1', '2', '3', '4'].includes(String(yearLevel))) {
      return res.status(400).json({ message: 'Please select a valid year level' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        college,
        department,
        yearStanding: String(yearLevel),
        batch: `${department}-${yearLevel}`
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: buildStudentProfile(user),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
        college: user.college || '',
        department: user.department || '',
        batch: user.batch || ''
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Participate in a recollection schedule
router.post('/recollections/:id/participate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('batch department');
    const studentYearLevel = getYearLevelFromBatch(user?.batch);
    const studentDepartment = getStudentDepartment(user);
    const matchingDepartments = getStudentDepartmentMatchValues(studentDepartment);
    let recollection = await Recollection.findById(req.params.id);
    let scheduleType = 'recollection';

    if (!recollection) {
      recollection = await CmoEvent.findById(req.params.id);
      scheduleType = 'cmo-event';
    }

    if (!recollection) {
      return res.status(404).json({ message: 'Recollection schedule not found' });
    }

    const scheduleDate = recollection.date || recollection.eventDate;
    const participants = recollection.participants || [];

    if (new Date(scheduleDate) < new Date()) {
      return res.status(400).json({ message: 'This recollection schedule has already passed' });
    }

    if (recollection.yearLevel !== studentYearLevel) {
      return res.status(403).json({ message: 'This recollection is not assigned to your year level' });
    }

    if (!matchingDepartments.includes(recollection.department)) {
      return res.status(403).json({ message: 'This recollection is not assigned to your department' });
    }

    const alreadyRegistered = participants.some(
      participantId => participantId.toString() === req.user.id
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this recollection' });
    }

    if (recollection.slots && participants.length >= recollection.slots) {
      return res.status(400).json({ message: 'This recollection schedule is already full' });
    }

    recollection.participants = participants;
    recollection.participants.push(req.user.id);
    await recollection.save();

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { registeredRecollections: recollection._id }
    });

    res.json({
      message: 'Successfully registered for recollection',
      recollection: scheduleType === 'cmo-event' ? {
        ...recollection.toObject(),
        date: recollection.eventDate,
        title: recollection.description,
        facilitator: recollection.inCharge,
        sourceType: scheduleType
      } : recollection
    });
  } catch (error) {
    console.error('Participate recollection error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Self-enroll in an evaluation
router.post('/evaluations/:id/enroll', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if already enrolled
    const alreadyEnrolled = evaluation.assignedStudents.some(
      studentId => studentId.toString() === req.user.id
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this evaluation' });
    }

    // Add student to evaluation
    evaluation.assignedStudents.push(req.user.id);
    await evaluation.save();

    // Add evaluation to student's assigned list
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { assignedEvaluations: evaluation._id }
    });

    res.json({ message: 'Successfully enrolled in evaluation', evaluation });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/evaluations/:id/submit', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    const isAssigned = evaluation.assignedStudents.some(
      studentId => studentId.toString() === req.user.id
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const alreadySubmitted = evaluation.submissions.some(
      submission => submission.student?.toString() === req.user.id
    );

    if (alreadySubmitted) {
      return res.status(400).json({ message: 'Evaluation already submitted' });
    }

    evaluation.submissions.push({
      student: req.user.id,
      answers: req.body.answers
    });

    await evaluation.save();
    
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { assignedEvaluations: req.params.id }
    });

    res.json({ message: 'Evaluation submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

return router;
})();

router.get('/', (req, res) => {
  res.json({
    message: 'User route is live.',
    routes: {
      admin: '/api/user/admin',
      faculty: '/api/user/faculty',
      formator: '/api/user/formator',
      student: '/api/user/student'
    }
  });
});

router.use('/admin', adminRouter);
router.use('/faculty', facultyRouter);
router.use('/formator', facultyRouter);
router.use('/student', studentRouter);

router.adminRouter = adminRouter;
router.facultyRouter = facultyRouter;
router.studentRouter = studentRouter;

module.exports = router;
