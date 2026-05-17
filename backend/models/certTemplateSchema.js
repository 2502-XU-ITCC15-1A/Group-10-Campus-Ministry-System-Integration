const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
  templateTitle: { type: String, required: true },
  certBgImgKey: { type: String },
  certEventYearLevel: { type: String, required: true },
  certEventType: { type: String, required: true },
  certEventTheme: { type: String, required: true },
  certEventDate: { type: String, required: true },
  certEventVenue: { type: String, required: true },
  certDirectorName: { type: String, required: true },
  certSigImgKey: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
