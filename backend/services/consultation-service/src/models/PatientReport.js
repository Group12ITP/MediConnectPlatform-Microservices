// models/PatientReport.js
const mongoose = require("mongoose");

const patientReportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Patient'  // Add reference for population
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },
    type: {
      type: String,
      enum: ["SUGAR", "CHOLESTEROL", "BLOOD_PRESSURE"],
      required: true,
    },
    value: {
      sugar: Number,
      cholesterol: Number,
      bp: {
        systolic: Number,
        diastolic: Number,
      },
    },
    unit: {
      type: String,
      required: true,
    },
    measuredAt: {
      type: Date,
      default: Date.now,
    },
    analysis: {
      type: Object,
      required: false,
    },
    classification: {
      type: String,
      enum: [
        "CRITICAL_LOW",
        "LOW",
        "LOW_WARNING",
        "NORMAL",
        "HIGH_WARNING",
        "HIGH",
        "CRITICAL_HIGH",
      ],
      required: true,
    },
    thresholdVersion: {
      type: String,
      default: 'WHO-ADA-AHA-2023'
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
patientReportSchema.index({ patientId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.models.PatientReport
  || mongoose.model("PatientReport", patientReportSchema);