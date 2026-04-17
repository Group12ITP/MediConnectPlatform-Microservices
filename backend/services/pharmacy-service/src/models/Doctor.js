// models/Doctor.js  (pharmacy-service stub)
// ─────────────────────────────────────────────────────────────────────────────
// Doctors authenticate through the user-service, not the pharmacy-service.
// This stub only exists so that the auth middleware can verify tokens signed
// with role:"doctor" or role:"admin" (admins use Doctor collection) against
// the SHARED MongoDB database.  All fields match the upstream Doctor model
// so cross-service ObjectId lookups succeed.
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const doctorSchema = new mongoose.Schema(
  {
    name:           { type: String, trim: true },
    email:          { type: String, lowercase: true, trim: true },
    password:       { type: String, select: false },
    specialization: { type: String },
    licenseNumber:  { type: String, trim: true },
    qualification:  { type: String, trim: true },
    experience:     { type: Number },
    hospital:       { type: String, trim: true },
    phoneNumber:    { type: String },

    // Auth middleware properties
    isActive:   { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },  // doctors are treated as approved for auth purposes

    // Token versioning (logout-all)
    tokenVersion: { type: Number, default: 0, select: false },

    role: { type: String, default: "doctor" },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Password verification (read-only in this service — no registration here)
doctorSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Safe model registration (hot-reload safe) ──────────────────────────────
const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
