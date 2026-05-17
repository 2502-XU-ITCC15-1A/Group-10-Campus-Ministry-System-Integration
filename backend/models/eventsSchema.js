const mongoose = require('mongoose');

const cmoEventSchema = new mongoose.Schema({
  eventDate: { type: Date, required: true },
  department: { type: String, required: true },
  description: { type: String, required: true },
  batch: { type: String, required: true },
  yearLevel: { type: String, required: true },
  venue: { type: String, required: true },
  inCharge: { type: String, required: true },
  slots: { type: Number, default: 40 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CmoEvent', cmoEventSchema);
