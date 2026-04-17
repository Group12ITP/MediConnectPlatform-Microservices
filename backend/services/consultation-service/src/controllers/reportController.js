// controllers/reportController.js
const fs = require('fs');
const mongoose = require('mongoose');
const { saveReport, getPatientReports, getReportById, deleteReport } = require('../services/reportService');
const Report = require('../models/Report');
// Import PatientAppointment that's connected to identity DB
const PatientAppointment = require('../models/PatientAppointment');

async function doctorCanAccessPatientReports(doctorId, patientId) {
  try {
    // Convert to strings for consistent comparison
    const doctorIdStr = doctorId.toString();
    const patientIdStr = patientId.toString();
    
    const exists = await PatientAppointment.exists({
      doctor: doctorIdStr,
      patient: patientIdStr,
      status: { $nin: ['cancelled', 'rejected'] },
    });
    
    console.log(`Access check - Doctor: ${doctorIdStr}, Patient: ${patientIdStr}, Exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error('Error checking patient access:', error);
    return false;
  }
}

exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { category, description } = req.body;
    const report = await saveReport({ patientId: req.patient.id, file: req.file, category, description });
    res.status(201).json({ success: true, data: report });
  } catch (e) {
    console.error('uploadReport error:', e);
    res.status(500).json({ success: false, message: e.message || 'Upload failed' });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await getPatientReports(req.patient.id);
    res.json({ success: true, data: reports });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Error fetching reports' });
  }
};

exports.getPatientReportsForDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID' });
    }
    const allowed = await doctorCanAccessPatientReports(req.doctor.id, patientId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'No access to this patient\'s reports' });
    }
    const reports = await Report.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: reports });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Error fetching reports' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await deleteReport(req.patient.id, req.params.id);
    res.json({ success: true, message: 'Report deleted' });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Report not found' });
    console.error(e);
    res.status(500).json({ success: false, message: 'Error deleting report' });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const report = await getReportById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    console.log('Download request - Report patient:', report.patient.toString());
    console.log('Request patient:', req.patient?.id);
    console.log('Request doctor:', req.doctor?.id);

    const isOwner = req.patient && String(report.patient) === String(req.patient.id);
    
    if (isOwner) {
      console.log('Access granted: Patient is owner');
      // proceed
    } else if (req.doctor) {
      console.log('Checking doctor access...');
      const allowed = await doctorCanAccessPatientReports(req.doctor.id, report.patient);
      if (!allowed) {
        console.log('Access denied: No valid appointment');
        return res.status(403).json({ success: false, message: 'Forbidden - No valid appointment with this patient' });
      }
      console.log('Access granted: Doctor has valid appointment');
    } else {
      console.log('Access denied: No valid user context');
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!fs.existsSync(report.path)) {
      console.error(`File not found: ${report.path}`);
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }
    
    res.download(report.path, report.originalName);
  } catch (e) {
    console.error('Download error:', e);
    res.status(500).json({ success: false, message: 'Error downloading report' });
  }
};