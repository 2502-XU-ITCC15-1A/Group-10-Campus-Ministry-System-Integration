const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/userSchema');
const Recollection = require('./models/Recollection');
const CmoEvent = require('./models/eventsSchema');

dotenv.config();

const app = express();
const userRoutes = require('./routes/userRoutes');

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', userRoutes);
app.use('/api/admin', userRoutes.adminRouter);
app.use('/api/faculty', userRoutes.facultyRouter);
app.use('/api/formator', userRoutes.facultyRouter);
app.use('/api/student', userRoutes.studentRouter);
app.use('/api/evaluation', require('./routes/evaluation'));

// Keep demo credentials usable even if older bad hashes already exist.
const seedUsers = async () => {
  try {
    await User.updateMany(
      {
        $or: [
          { department: { $exists: false } },
          { department: '' }
        ],
        batch: { $regex: /^(BSIT|BSCS|BSIS)-/ }
      },
      { $set: { department: 'Computer Studies' } }
    );

    await User.updateMany(
      {
        $or: [
          { department: { $exists: false } },
          { department: '' }
        ],
        batch: { $regex: /^ABCom-/ }
      },
      { $set: { department: 'Arts and Science' } }
    );

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
    console.log('Test admin ready: dfabela@xu.edu.ph');

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
    console.log('Test formator ready: formator@xu.edu.ph');

    await User.deleteMany({
      $or: [
        { studentId: { $in: ['20230028369', '20230028370', '20230028371'] } },
        { email: { $in: ['20230028369@my.xu.edu.ph', '20230028370@my.xu.edu.ph', '20230028371@my.xu.edu.ph'] } }
      ]
    });

    console.log('Test users ready');
  } catch (error) {
    console.log('Could not seed test users:', error.message);
  }
};

const seedRecollections = async () => {
  try {
    await Recollection.updateMany(
      { department: { $exists: false } },
      { $set: { department: 'Computer Studies' } }
    );

    const now = new Date();
    const makeDate = (daysFromNow, hour, minute = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() + daysFromNow);
      date.setHours(hour, minute, 0, 0);
      return date;
    };

    const recollections = [
      {
        title: 'First Year Recollection',
        description: 'A guided recollection for prayer, reflection, and community sharing.',
        date: makeDate(7, 8, 30),
        venue: 'Xavier University Chapel',
        department: 'Computer Studies',
        yearLevel: '1',
        facilitator: 'Campus Ministries Office',
        slots: 40
      },
      {
        title: 'Midyear Recollection',
        description: 'A half-day recollection focused on gratitude, purpose, and renewal.',
        date: makeDate(14, 13, 0),
        venue: 'AVR 1, Main Campus',
        department: 'Computer Studies',
        yearLevel: '2',
        facilitator: 'Fr. Campus Ministries Team',
        slots: 35
      },
      {
        title: 'Senior Students Recollection',
        description: 'A reflective session for students preparing for practicum and graduation.',
        date: makeDate(21, 9, 0),
        venue: 'Little Theater',
        department: 'Computer Studies',
        yearLevel: '4',
        facilitator: 'Campus Ministries Office',
        slots: 50
      }
    ];

    for (const recollection of recollections) {
      await Recollection.findOneAndUpdate(
        { title: recollection.title },
        recollection,
        { upsert: true, new: true }
      );
    }

    console.log('Recollection schedules ready');
  } catch (error) {
    console.log('Could not seed recollections:', error.message);
  }
};

const seedCmoEvents = async () => {
  try {
    const now = new Date();
    const makeDate = (daysFromNow) => {
      const date = new Date(now);
      date.setDate(date.getDate() + daysFromNow);
      date.setHours(9, 0, 0, 0);
      return date;
    };

    const events = [
      {
        eventDate: makeDate(3),
        department: 'Computer Studies',
        description: 'First Year Recollection',
        batch: '1',
        yearLevel: '1',
        venue: 'Xavier University Chapel',
        inCharge: 'Campus Ministries Office'
      },
      {
        eventDate: makeDate(10),
        department: 'Engineering',
        description: 'Formation Session',
        batch: '2',
        yearLevel: '2',
        venue: 'AVR 1',
        inCharge: 'Campus Ministries Office'
      }
    ];

    for (const event of events) {
      await CmoEvent.findOneAndUpdate(
        { description: event.description, department: event.department },
        event,
        { upsert: true, new: true }
      );
    }

    console.log('CMO events ready');
  } catch (error) {
    console.log('Could not seed CMO events:', error.message);
  }
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedUsers();
    await seedRecollections();
    await seedCmoEvents();
  })
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
