const mongoose = require('mongoose');
const { getIdentityConnection } = require('../../config/identityDb');

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    specialization: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    qualification: { type: String, trim: true },
    hospital: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: 'doctor' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const conn = getIdentityConnection();

module.exports = conn.models.Doctor || conn.model('Doctor', doctorSchema);
