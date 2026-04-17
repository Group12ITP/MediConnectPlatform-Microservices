// routes/analyzeReportRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createReport,
  getReports,
  getReferenceRanges,
} = require('../controllers/AnalyzeReportController');
const { protectPatient } = require('../middleware/patientAuthMiddleware');

// Apply patient protection middleware
router.use(protectPatient);

// POST   /api/patient/:patientId/health-reports
router.post('/', createReport);

// GET    /api/patient/:patientId/health-reports
router.get('/', getReports);

// GET    /api/patient/:patientId/health-reports/reference
router.get('/reference', getReferenceRanges);

module.exports = router;