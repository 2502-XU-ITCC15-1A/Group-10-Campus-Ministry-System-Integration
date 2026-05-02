const express = require('express');
const jwt = require('jsonwebtoken');
const Evaluation = require('../models/Evaluation');
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

// Get evaluation by ID (requires authentication)
router.get('/:id', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('createdBy', 'fullName');
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check if student is assigned to this evaluation
    const isAssigned = evaluation.assignedStudents.some(
      studentId => studentId.toString() === req.user.id
    );

    // Also allow if it's a public evaluation (no specific students assigned)
    const isPublic = evaluation.assignedStudents.length === 0;

    if (!isAssigned && !isPublic) {
      return res.status(403).json({ message: 'You are not assigned to this evaluation' });
    }

    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;