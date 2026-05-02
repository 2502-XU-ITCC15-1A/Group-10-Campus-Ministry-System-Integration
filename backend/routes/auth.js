const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Register new user (student or admin)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, studentId, password, role, batch } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if studentId already exists (for students)
    if (studentId) {
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).json({ message: 'Student ID already registered' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      studentId: studentId || `ADMIN${Date.now()}`,
      password: hashedPassword,
      role: role || 'student',
      batch: batch || ''
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'Registration successful',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
        studentId: newUser.studentId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
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

    const studentHash = await bcrypt.hash('password123', 12);
    await User.findOneAndUpdate(
      { studentId: '20230028369' },
      {
        email: '20230028369@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'John Doe',
        studentId: '20230028369',
        batch: 'BSIT-1A'
      },
      { upsert: true, new: true }
    );

    // Also create a few more test students for different batches
    await User.findOneAndUpdate(
      { studentId: '20230028370' },
      {
        email: '20230028370@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'Jane Smith',
        studentId: '20230028370',
        batch: 'BSIT-1B'
      },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { studentId: '20230028371' },
      {
        email: '20230028371@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'Bob Wilson',
        studentId: '20230028371',
        batch: 'BSIT-2A'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Test users auto-created!');
    res.json({ message: 'Test users created' });
  } catch (error) {
    console.error('Auto-seed error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Auto-create test users if they don't exist (for demo purposes)
    const testUser = await User.findOne({ email });
    if (!testUser) {
      // Check if it's a test account - create it on the fly
      if (email === '20230028369@my.xu.edu.ph' || email === 'dfabela@xu.edu.ph') {
        const hashedPassword = await bcrypt.hash('password123', 12);
        await User.findOneAndUpdate(
          { email },
          {
            email,
            password: hashedPassword,
            role: email.includes('xu.edu.ph') ? 'admin' : 'student',
            fullName: email.includes('dfabela') ? 'Dean Fabela' : 'Test User',
            studentId: email.includes('dfabela') ? 'ADMIN001' : '20230028369',
            batch: 'BSIT-1A'
          },
          { upsert: true, new: true }
        );
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }
    
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
        batch: user.batch || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const studentHash = await bcrypt.hash('password123', 12);
    const student = await User.findOneAndUpdate(
      { studentId: '20230028369' },
      {
        email: '20230028369@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'John Doe',
        studentId: '20230028369',
        batch: 'BSIT-1A'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Test users created!');
    console.log(`👨‍💼 Admin: dfabela@xu.edu.ph / admin123`);
    console.log(`👨‍🎓 Student: 20230028369@my.xu.edu.ph / password123`);

    res.json({ 
      message: 'Test users created successfully!',
      admin: admin.email,
      student: student.email 
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;