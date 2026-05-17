const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  qrData: { type: String },
  qrCode: { type: String, required: true },
  templateTitle: { type: String },
  certBgImgKey: { type: String },
  certEventYearLevel: { type: String },
  certEventType: { type: String },
  certEventTheme: { type: String },
  certEventVenue: { type: String },
  certDirectorName: { type: String },
  certSigImgKey: { type: String },
  status: { type: String, enum: ['pending', 'issued', 'verified'], default: 'pending' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
