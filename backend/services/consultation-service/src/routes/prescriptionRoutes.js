// routes/prescriptionRoutes.js - Complete updated version
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getDoctorInfo,
  getDoctorPatients,
  issuePrescription,
  getDoctorPrescriptions,
  getPrescriptionById,
  cancelPrescription,
  downloadPrescriptionPdf,
  getPatientPrescriptions,
  getPatientPrescriptionById,
  getPatientPrescriptionByPrescriptionId,
  downloadPatientPrescriptionPdf,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const { protectPatient } = require('../middleware/patientAuthMiddleware');

const issuePrescriptionValidation = [
  body('patientId').optional(),
  body('patientName').optional().trim(),
  body('medicines')
    .isArray({ min: 1 })
    .withMessage('At least one medicine is required'),
  body('medicines.*.name').notEmpty().withMessage('Medicine name is required'),
];

// ==================== DOCTOR ROUTES ====================
router.get('/doctor-info', protect, getDoctorInfo);
router.get('/patients', protect, getDoctorPatients);
router.get('/', protect, getDoctorPrescriptions);
router.post('/', protect, issuePrescriptionValidation, issuePrescription);
router.get('/:id', protect, getPrescriptionById);
router.patch('/:id/cancel', protect, cancelPrescription);
router.get('/:id/pdf', protect, downloadPrescriptionPdf);

// ==================== PATIENT ROUTES ====================
// These match your frontend API calls
router.get('/patient/mine', protectPatient, getPatientPrescriptions);
router.get('/patient/by-prescription-id/:prescriptionId', protectPatient, getPatientPrescriptionByPrescriptionId);
router.get('/patient/:id', protectPatient, getPatientPrescriptionById);
router.get('/patient/:id/pdf', protectPatient, downloadPatientPrescriptionPdf);

module.exports = router;