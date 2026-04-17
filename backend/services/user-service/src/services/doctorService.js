// services/doctorService.js
const Doctor = require('../models/Doctor');
const PatientAppointment = require('../models/PatientAppointment');

const listDoctors = async (specialty) => {
  const filter = { isActive: true };
  if (specialty) filter.specialization = { $regex: specialty, $options: 'i' };

  return Doctor.find(filter)
    .select('name specialization experience hospital licenseNumber doctorCode')
    .lean();
};

const getDoctorPublicProfile = async (id) => {
  return Doctor.findById(id)
    .select('name specialization experience hospital licenseNumber qualification phoneNumber')
    .lean();
};

const getDoctorOwnProfile = async (doctorId) => {
  return Doctor.findById(doctorId)
    .select('-password')
    .lean();
};

const updateDoctorProfile = async (doctorId, updates) => {
  const allowed = [
    'name',
    'specialization',
    'qualification',
    'experience',
    'hospital',
    'phoneNumber',
    'bio',
    'consultationFee',
    'location',
    'education',
    'certifications',
    'languages',
  ];

  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }

  return Doctor.findByIdAndUpdate(doctorId, { $set: filtered }, { new: true, runValidators: false })
    .select('-password');
};

const getDoctorPatientList = async (doctorId) => {
  const appointments = await PatientAppointment.find({
    doctor: doctorId,
    status: { $nin: ['cancelled', 'rejected'] },
  })
    .populate('patient', 'name email phoneNumber gender dateOfBirth bloodGroup medicalConditions')
    .sort({ createdAt: -1 })
    .lean();

  const seen = new Set();
  const patients = [];

  for (const apt of appointments) {
    if (apt.patient && !seen.has(String(apt.patient._id))) {
      seen.add(String(apt.patient._id));
      patients.push({
        ...apt.patient,
        lastVisit: apt.date,
        lastAppointmentId: apt._id,
        appointmentStatus: apt.status,
      });
    }
  }

  return patients;
};

module.exports = {
  listDoctors,
  getDoctorPublicProfile,
  getDoctorOwnProfile,
  updateDoctorProfile,
  getDoctorPatientList,
};

