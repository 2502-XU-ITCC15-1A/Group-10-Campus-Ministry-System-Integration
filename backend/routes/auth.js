const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userSchema');
const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const inferDepartmentFromBatch = (batch = '') => {
  if (/^BSIT-|^BSCS-|^BSIS-/.test(batch)) return 'Computer Studies';
  if (/^ABCom-/.test(batch)) return 'Arts and Science';
  return '';
};

const createAuthResponse = (user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      studentId: user.studentId,
      department: user.department || inferDepartmentFromBatch(user.batch || ''),
      batch: user.batch || ''
    }
  };
};

const accountEmailRules = {
  admin: {
    label: 'Admin',
    domains: ['@xu.edu.ph'],
    roles: ['admin']
  },
  staff: {
    label: 'Formators',
    domains: ['@xu.edu.ph'],
    roles: ['staff']
  },
  student: {
    label: 'Students',
    domains: ['@my.xu.edu.ph'],
    roles: ['student']
  }
};

const allXavierDomains = Object.values(accountEmailRules).flatMap((rule) => rule.domains);

const validateXavierEmail = (email, accountType) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const rule = accountEmailRules[accountType];
  const allowedDomains = rule ? rule.domains : allXavierDomains;
  const isAllowed = allowedDomains.some((domain) => normalizedEmail.endsWith(domain));

  if (!isAllowed) {
    return {
      valid: false,
      message: rule
        ? `${rule.label} must use ${allowedDomains.join(' or ')} email.`
        : 'Only Xavier University email accounts are allowed.'
    };
  }

  return { valid: true, email: normalizedEmail };
};

const validateAccountRole = (user, accountType) => {
  if (user.status === 'inactive') {
    return {
      valid: false,
      message: 'This account is inactive. Please contact the administrator.'
    };
  }

  const rule = accountEmailRules[accountType];
  if (!rule || !rule.roles || rule.roles.includes(user.role)) {
    return { valid: true };
  }

  return {
    valid: false,
    message: `Please use the ${rule.label} login option for ${rule.label.toLowerCase()} accounts only.`
  };
};

// Auth route health check
router.get('/', (req, res) => {
  res.json({
    message: 'Auth route is live. Use POST /login, POST /autoseed, or POST /seed.'
  });
});

// Auto-seed on first login attempt
router.post('/autoseed', async (req, res) => {
  try {
    console.log('🌱 Auto-creating test users...');

    const adminHash = await bcrypt.hash('admin123', 12);
    await User.findOneAndUpdate(
      { email: 'dfabela@xu.edu.ph' },
      {
        email: 'dfabela@xu.edu.ph',
        password: adminHash,
        role: 'admin',
        fullName: 'Dean Fabela',
        studentId: 'ADMIN001'
      },
      { upsert: true, new: true }
    );

    const formatorHash = await bcrypt.hash('password123', 12);
    await User.findOneAndUpdate(
      { email: 'formator@xu.edu.ph' },
      {
        email: 'formator@xu.edu.ph',
        password: formatorHash,
        role: 'staff',
        fullName: 'Formator Adviser',
        studentId: 'FAC001',
        department: 'Computer Studies',
        batch: 'BSIT-1'
      },
      { upsert: true, new: true }
    );

    await User.deleteMany({
      $or: [
        { studentId: { $in: ['20230028369', '20230028370', '20230028371'] } },
        { email: { $in: ['20230028369@my.xu.edu.ph', '20230028370@my.xu.edu.ph', '20230028371@my.xu.edu.ph'] } }
      ]
    });

    console.log('✅ Test users auto-created!');
    res.json({ message: 'Test users created' });
  } catch (error) {
    console.error('Auto-seed error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, accountType } = req.body;
    const emailValidation = validateXavierEmail(email, accountType);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }
    
    // Auto-create test users if they don't exist (for demo purposes)
    let user = await User.findOne({ email: emailValidation.email });
    
    // If user doesn't exist, check if it's a test account.
    if (!user) {
      // Check if it's a test account and create it with the documented password.
      if (emailValidation.email === 'dfabela@xu.edu.ph' || emailValidation.email === 'formator@xu.edu.ph' || emailValidation.email === 'faculty@xu.edu.ph') {
        const isAdminTestUser = emailValidation.email === 'dfabela@xu.edu.ph';
        const isFacultyTestUser = emailValidation.email === 'formator@xu.edu.ph' || emailValidation.email === 'faculty@xu.edu.ph';
        const hashedPassword = await bcrypt.hash(isAdminTestUser ? 'admin123' : 'password123', 12);
        user = await User.findOneAndUpdate(
          { email: emailValidation.email },
          {
            email: emailValidation.email,
            password: hashedPassword,
            role: isAdminTestUser ? 'admin' : 'staff',
            fullName: isAdminTestUser ? 'Dean Fabela' : 'Formator Adviser',
            studentId: isAdminTestUser ? 'ADMIN001' : 'FAC001',
            department: isAdminTestUser ? '' : 'Computer Studies',
            batch: isAdminTestUser ? '' : 'BSIT-1'
          },
          { upsert: true, new: true }
        );
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const roleValidation = validateAccountRole(user, accountType);
    if (!roleValidation.valid) {
      return res.status(403).json({ message: roleValidation.message });
    }

    res.json(createAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.json({ message: 'If this email is registered, a reset code has been prepared.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    res.json({
      message: 'Password reset code generated. It expires in 15 minutes.',
      resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Reset code and new password are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential, accountType } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google login is not configured on the server' });
    }

    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Google account email is not verified' });
    }

    const emailValidation = validateXavierEmail(payload.email, accountType);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    const email = emailValidation.email;
    const studentId = email.endsWith('@my.xu.edu.ph')
      ? email.split('@')[0]
      : `GOOGLE-${payload.sub}`;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }
    } else {
      user = await User.create({
        email,
        googleId: payload.sub,
        password: crypto.randomBytes(32).toString('hex'),
        role: 'student',
        fullName: payload.name || email,
        studentId,
        department: '',
        batch: ''
      });
    }

    const roleValidation = validateAccountRole(user, accountType);
    if (!roleValidation.valid) {
      return res.status(403).json({ message: roleValidation.message });
    }

    res.json(createAuthResponse(user));
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Google login failed' });
  }
});

router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Creating test users...');

    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await User.findOneAndUpdate(
      { email: 'dfabela@xu.edu.ph' },
      {
        email: 'dfabela@xu.edu.ph',
        password: adminHash,
        role: 'admin',
        fullName: 'Dean Fabela',
        studentId: 'ADMIN001'
      },
      { upsert: true, new: true }
    );

    const formatorHash = await bcrypt.hash('password123', 12);
    const faculty = await User.findOneAndUpdate(
      { email: 'formator@xu.edu.ph' },
      {
        email: 'formator@xu.edu.ph',
        password: formatorHash,
        role: 'staff',
        fullName: 'Formator Adviser',
        studentId: 'FAC001',
        department: 'Computer Studies',
        batch: 'BSIT-1'
      },
      { upsert: true, new: true }
    );

    await User.deleteMany({
      $or: [
        { studentId: { $in: ['20230028369', '20230028370', '20230028371'] } },
        { email: { $in: ['20230028369@my.xu.edu.ph', '20230028370@my.xu.edu.ph', '20230028371@my.xu.edu.ph'] } }
      ]
    });

    console.log('✅ Test users created!');
    console.log(`👨‍💼 Admin: dfabela@xu.edu.ph / admin123`);
    console.log(`👩‍🏫 Formator: formator@xu.edu.ph / password123`);

    res.json({ 
      message: 'Test users created successfully!',
      admin: admin.email,
      faculty: faculty.email
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
