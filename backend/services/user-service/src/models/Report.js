// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    sharedWithDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
    },
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    category: {
      type: String,
      enum: ['Blood Test', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'ECG', 'Pathology', 'Other'],
      default: 'Other',
    },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

reportSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);

