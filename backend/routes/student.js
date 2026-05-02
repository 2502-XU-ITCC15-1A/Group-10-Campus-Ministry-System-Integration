const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const router = express.Router();

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

    res.json({
      announcements: [
        "Welcome back to Campus Ministry!",
        "Complete your evaluations before the deadline",
        "Check your certificates below"
      ],
      pendingEvaluations: evaluations,
      availableEvaluations: availableEvaluations,
      certificates: user.certificates || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
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
    if (evaluation.assignedStudents.includes(req.user.id)) {
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
    if (!evaluation.assignedStudents.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
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

module.exports = router;