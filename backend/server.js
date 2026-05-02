const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/student'));
app.use('/api/evaluation', require('./routes/evaluation'));

// Seed test users on startup
const seedUsers = async () => {
  try {
    const adminExists = await User.findOne({ email: 'dfabela@xu.edu.ph' });
    if (!adminExists) {
      const adminHash = await bcrypt.hash('admin123', 12);
      await User.create({
        email: 'dfabela@xu.edu.ph',
        password: adminHash,
        role: 'admin',
        fullName: 'Dean Fabela',
        studentId: 'ADMIN001'
      });
      console.log('✅ Admin user created: dfabela@xu.edu.ph');
    }
    
    const studentExists = await User.findOne({ studentId: '20230028369' });
    if (!studentExists) {
      const studentHash = await bcrypt.hash('password123', 12);
      await User.create({
        email: '20230028369@my.xu.edu.ph',
        password: studentHash,
        role: 'student',
        fullName: 'John Doe',
        studentId: '20230028369',
        batch: 'BSIT-1A'
      });
      console.log('✅ Student user created: 20230028369@my.xu.edu.ph');
    }
    
    console.log('ℹ️ Test users ready');
  } catch (error) {
    console.log('ℹ️ Users may already exist');
  }
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedUsers();
  })
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
