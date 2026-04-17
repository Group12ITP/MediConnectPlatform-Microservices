const mongoose = require('mongoose');
const { getIdentityConnection } = require('../../config/identityDb');

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    specialization: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    qualification: { type: String, trim: true },
    experience: { type: Number, default: null },
    hospital: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    bio: { type: String, trim: true },
    location: { type: String, trim: true },
    consultationFee: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0, select: false },
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
