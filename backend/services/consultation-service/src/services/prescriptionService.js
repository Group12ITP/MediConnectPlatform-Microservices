// services/prescriptionService.js
const Prescription = require('../models/Prescription');
const PatientAppointment = require('../models/PatientAppointment');
const PDFDocument = require('pdfkit');
const Doctor = require('../models/identity/Doctor');
const Patient = require('../models/identity/Patient');

async function attachDoctorSummaries(prescriptions) {
  const doctorIds = [...new Set((prescriptions || []).map((p) => p.doctor).filter(Boolean).map(String))];
  if (doctorIds.length === 0) return prescriptions;

  const doctors = await Doctor.find({ _id: { $in: doctorIds } })
    .select('name specialization licenseNumber hospital qualification')
    .lean();
  const doctorMap = new Map(doctors.map((d) => [String(d._id), d]));

  return (prescriptions || []).map((p) => ({
    ...p,
    doctor: doctorMap.get(String(p.doctor)) || p.doctor,
  }));
}

const getDoctorPatients = async (doctorId) => {
  const appointments = await PatientAppointment.find({
    doctor: doctorId,
    status: { $nin: ['cancelled', 'rejected'] },
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  if (appointments.length === 0) return [];

  const patientIds = [...new Set(
    appointments
      .map((apt) => apt.patient?.toString())
      .filter(Boolean)
  )];
  const patients = await Patient.find({ _id: { $in: patientIds } })
    .select('name phoneNumber gender bloodGroup dateOfBirth')
    .lean();
  const patientMap = new Map(patients.map((patient) => [String(patient._id), patient]));

  const seen = new Set();
  const result = [];

  for (const apt of appointments) {
    const patientId = apt.patient?.toString();
    if (patientId && !seen.has(patientId)) {
      seen.add(patientId);
      const patient = patientMap.get(patientId);
      result.push({
        id: patientId,
        name: patient?.name || 'Unknown Patient',
        age: patient?.age || null,
        phone: patient?.phoneNumber || null,
        gender: patient?.gender || null,
        bloodGroup: patient?.bloodGroup || null,
        lastVisit: apt.date,
        appointmentId: apt._id,
      });
    }
  }

  return result;
};

const issuePrescription = async ({
  doctorId,
  patientId,
  patientName,
  patientAge,
  patientGender,
  patientBloodGroup,
  appointmentId,
  medicines,
  notes,
  signatureData,
}) => {
  let finalPatientName = patientName;
  let finalPatientAge = patientAge;
  let finalPatientGender = patientGender;
  let finalPatientBloodGroup = patientBloodGroup;

  if (patientId && !patientName) {
    const patient = await Patient.findById(patientId).lean();
    if (patient) {
      finalPatientName = patient.name;
      finalPatientAge = patient.age;
      finalPatientGender = patient.gender;
      finalPatientBloodGroup = patient.bloodGroup;
    }
  }

  const prescription = new Prescription({
    doctor: doctorId,
    ...(patientId ? { patient: patientId } : {}),
    patientName: finalPatientName,
    patientAge: finalPatientAge || undefined,
    patientGender: finalPatientGender || undefined,
    patientBloodGroup: finalPatientBloodGroup || undefined,
    appointment: appointmentId || undefined,
    medicines,
    notes,
    signatureData: signatureData || null,
  });

  await prescription.save();
  return prescription;
};

const getDoctorPrescriptions = async (doctorId, { search, status, startDate, endDate, page = 1, limit = 20 } = {}) => {
  const query = { doctor: doctorId };
  if (status) query.status = status;
  if (search) query.patientName = { $regex: search, $options: 'i' };

  if (startDate || endDate) {
    query.issuedAt = {};
    if (startDate) query.issuedAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.issuedAt.$lte = end;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [prescriptions, total] = await Promise.all([
    Prescription.find(query)
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Prescription.countDocuments(query),
  ]);

  return {
    prescriptions,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  };
};

const getPrescriptionById = async (doctorId, prescriptionId) => {
  return Prescription.findOne({ _id: prescriptionId, doctor: doctorId }).lean();
};

const cancelPrescription = async (doctorId, prescriptionId) => {
  return Prescription.findOneAndUpdate(
    { _id: prescriptionId, doctor: doctorId },
    { $set: { status: 'cancelled' } },
    { new: true }
  );
};

const getPatientPrescriptions = async (patientId, { status, page = 1, limit = 20 } = {}) => {
  // First get the patient's name from identity DB
  const patient = await Patient.findById(patientId).lean();
  
  // Create query that matches either by patient ObjectId OR by patientName
  const query = {
    $or: [
      { patient: patientId },
      { patientName: patient?.name }  // Match by name as fallback
    ]
  };
  
  if (status) query.status = status;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [prescriptionsRaw, total] = await Promise.all([
    Prescription.find(query)
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Prescription.countDocuments(query),
  ]);

  const prescriptions = await attachDoctorSummaries(prescriptionsRaw);
  
  return {
    prescriptions,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  };
};

const getPatientPrescriptionById = async (patientId, prescriptionId) => {
  const patient = await Patient.findById(patientId).lean();
  
  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    $or: [
      { patient: patientId },
      { patientName: patient?.name }
    ]
  })
    .lean();

  if (!prescription) return null;
  const [withDoctor] = await attachDoctorSummaries([prescription]);
  return withDoctor;
};

const getPatientPrescriptionByPrescriptionId = async (patientId, rxPrescriptionId) => {
  const patient = await Patient.findById(patientId).select('name').lean();

  const prescription = await Prescription.findOne({
    prescriptionId: rxPrescriptionId,
    $or: [{ patient: patientId }, ...(patient?.name ? [{ patientName: patient.name }] : [])],
  }).lean();

  if (!prescription) return null;
  const [withDoctor] = await attachDoctorSummaries([prescription]);
  return withDoctor;
};

const generatePrescriptionPdf = async (prescriptionId, userId, userRole) => {
  let prescription;
  let userPatientName;
  
  // Check access based on role
  if (userRole === 'doctor') {
    prescription = await Prescription.findOne({ _id: prescriptionId, doctor: userId }).lean();
  } else if (userRole === 'patient') {
    const patient = await Patient.findById(userId).select('name').lean();
    userPatientName = patient?.name;

    prescription = await Prescription.findOne({
      _id: prescriptionId,
      $or: [{ patient: userId }, ...(userPatientName ? [{ patientName: userPatientName }] : [])],
    }).lean();
  } else {
    throw new Error('UNAUTHORIZED');
  }

  if (!prescription) {
    const err = new Error('NOT_FOUND');
    throw err;
  }

  const doctor = prescription.doctor
    ? await Doctor.findById(prescription.doctor)
        .select('name specialization licenseNumber hospital qualification')
        .lean()
    : null;

  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(20).text(doctor?.name || 'Doctor', { align: 'left' }).moveDown(0.3);

  if (doctor?.specialization) doc.fontSize(12).text(doctor.specialization);
  if (doctor?.licenseNumber) doc.fontSize(10).text(`Reg No: ${doctor.licenseNumber}`);
  if (doctor?.hospital) doc.fontSize(10).text(doctor.hospital);

  doc.moveDown();
  doc
    .fontSize(10)
    .text(`Prescription ID: ${prescription.prescriptionId}`, { align: 'right' })
    .text(`Issued At: ${new Date(prescription.issuedAt).toLocaleString()}`, { align: 'right' });

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(12).text(`Patient: ${prescription.patientName}`);
  if (prescription.patientAge) doc.text(`Age: ${prescription.patientAge}`);
  if (prescription.patientGender) doc.text(`Gender: ${prescription.patientGender}`);
  if (prescription.patientBloodGroup) doc.fontSize(10).text(`Blood Group: ${prescription.patientBloodGroup}`);

  doc.moveDown();
  doc.fontSize(14).text('Medications', { underline: true });
  doc.moveDown(0.5);

  (prescription.medicines || []).forEach((m, idx) => {
    doc.fontSize(12).text(`${idx + 1}. ${m.name || ''}`).moveDown(0.1);
    const details = [m.dosage, m.frequency, m.duration].filter(Boolean).join(' • ');
    if (details) doc.fontSize(10).text(details);
    doc.moveDown(0.4);
  });

  if (prescription.notes) {
    doc.moveDown();
    doc.fontSize(12).text('Notes', { underline: true }).moveDown(0.3);
    doc.fontSize(10).text(prescription.notes, { width: 500 });
  }

  doc.moveDown(2);
  const yBeforeSignature = doc.y;
  if (prescription.signatureData && prescription.signatureData.startsWith('data:image')) {
    try {
      const base64 = prescription.signatureData.split(',')[1];
      const imgBuffer = Buffer.from(base64, 'base64');
      doc.image(imgBuffer, 350, yBeforeSignature, { width: 150 });
      doc.moveDown(3);
    } catch {
      // ignore signature rendering errors
    }
  }

  doc
    .fontSize(10)
    .text('__________________________', 350, doc.y + 10)
    .text('Doctor Signature', 380, doc.y + 5);

  return doc;
};

module.exports = {
  getDoctorPatients,
  issuePrescription,
  getDoctorPrescriptions,
  getPrescriptionById,
  cancelPrescription,
  generatePrescriptionPdf,
  getPatientPrescriptions,
  getPatientPrescriptionById,
  getPatientPrescriptionByPrescriptionId,
};