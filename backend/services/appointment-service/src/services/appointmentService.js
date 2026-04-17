// services/appointmentService.js
const Doctor = require('../models/Doctor');
const Availability = require('../models/Availability');
const PatientAppointment = require('../models/PatientAppointment');
const Patient = require('../models/Patient');
const { v4: uuidv4 } = require('uuid');

// Notification utilities live at service root: /utils
const {
  sendBookingConfirmedEmail,
  sendNewRequestEmail,
  sendDoctorConfirmEmail,
  sendDoctorRejectEmail,
  sendCompletedEmail,
  sendCancelledEmail,
  sendRescheduledEmail,
} = require('../../utils/emailService');

const {
  sendBookingConfirmedSMS,
  sendDoctorConfirmSMS,
  sendDoctorRejectSMS,
  sendCompletedSMS,
  sendCancelledSMS,
  sendRescheduledSMS,
} = require('../../utils/smsService');

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_NOT_CONFIGURED');
  // Lazy-init so the service can boot without Stripe configured
  // (only payment endpoints require it).
  // eslint-disable-next-line global-require
  return require('stripe')(key);
};

const getDoctors = async (specialty) => {
  const query = specialty
    ? { specialization: { $regex: specialty, $options: 'i' }, isActive: true }
    : { isActive: true };

  return Doctor.find(query)
    .select('name specialization experience hospital licenseNumber doctorCode consultationFee')
    .lean();
};

const getDoctorById = async (doctorId) => {
  return Doctor.findById(doctorId)
    .select('name specialization experience hospital licenseNumber phoneNumber')
    .lean();
};

const getDoctorAvailability = async (doctorId, year, month) => {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const availabilityDocs = await Availability.find({
    doctor: doctorId,
    date: { $regex: `^${prefix}` },
  }).lean();

  const booked = await PatientAppointment.find({
    doctor: doctorId,
    date: { $regex: `^${prefix}` },
    status: { $nin: ['cancelled', 'rejected'] },
  })
    .select('date time')
    .lean();

  const bookedMap = {};
  for (const b of booked) {
    if (!bookedMap[b.date]) bookedMap[b.date] = [];
    bookedMap[b.date].push(b.time);
  }

  const result = {};
  for (const doc of availabilityDocs) {
    const freeSlots = doc.slots
      .filter((s) => s.isActive)
      .map((s) => s.time);

    result[doc.date] = {
      slots: freeSlots,
      booked: bookedMap[doc.date] || [],
    };
  }

  return result;
};

const createStripeCheckoutSession = async ({ patientId, doctorId, date, time, specialty, reason, type, fee, frontendUrl }) => {
  const doctor = await Doctor.findById(doctorId).select('name specialization').lean();
  if (!doctor) throw new Error('DOCTOR_NOT_FOUND');

  const existing = await PatientAppointment.findOne({
    doctor: doctorId,
    date,
    time,
    status: { $nin: ['cancelled', 'rejected'] },
  });
  if (existing) throw new Error('SLOT_TAKEN');

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'lkr',
          product_data: {
            name: `Consultation with ${doctor.name}`,
            description: `${doctor.specialization} — ${date} at ${time}`,
          },
          unit_amount: Math.round(fee * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/book-appointment`,
    metadata: {
      patientId: String(patientId),
      doctorId: String(doctorId),
      date,
      time,
      specialty: specialty || doctor.specialization,
      reason: reason || '',
      type: type || 'Video',
      fee: String(fee),
    },
  });

  return { url: session.url, sessionId: session.id };
};

const verifyPaymentAndCreateAppointment = async (sessionId) => {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });

  if (session.payment_status !== 'paid') throw new Error('PAYMENT_NOT_COMPLETE');

  // Idempotency check
  const existing = await PatientAppointment.findOne({ stripeSessionId: sessionId });
  if (existing) return existing;

  const { patientId, doctorId, date, time, specialty, reason, type, fee } = session.metadata;

  const appointment = new PatientAppointment({
    patient: patientId,
    doctor: doctorId,
    date,
    time,
    specialty,
    reason,
    type,
    consultationFee: parseFloat(fee),
    stripeSessionId: sessionId,
    stripePaymentIntentId: session.payment_intent?.id || null,
    stripeReceiptUrl: session.payment_intent?.charges?.data?.[0]?.receipt_url || null,
    paymentStatus: 'paid',
    status: 'pending',
  });

  await appointment.save();

  const [patient, doctor] = await Promise.all([
    Patient.findById(patientId).select('name email phoneNumber').lean(),
    Doctor.findById(doctorId).select('name email phoneNumber specialization').lean(),
  ]);

  // Fire-and-forget notifications (must never crash request)
  sendBookingConfirmedEmail(patient, doctor, appointment).catch(() => {});
  sendBookingConfirmedSMS(patient, doctor, appointment);
  sendNewRequestEmail(patient, doctor, appointment).catch(() => {});

  return appointment;
};

const getPatientAppointments = async (patientId, status) => {
  const query = { patient: patientId };
  if (status && status !== 'all') query.status = status;

  return PatientAppointment.find(query)
    .populate('doctor', 'name specialization hospital phoneNumber email')
    .sort({ date: -1, time: -1 })
    .lean();
};

const cancelAppointment = async (patientId, appointmentId, reason) => {
  const apt = await PatientAppointment.findOne({ _id: appointmentId, patient: patientId })
    .populate('doctor', 'name email phoneNumber')
    .populate('patient', 'name email phoneNumber');

  if (!apt) throw new Error('NOT_FOUND');
  if (['completed', 'cancelled', 'rejected'].includes(apt.status)) throw new Error('CANNOT_CANCEL');

  apt.status = 'cancelled';
  if (reason) apt.cancellationReason = reason;
  await apt.save();

  sendCancelledEmail(apt.patient, apt.doctor, apt, reason).catch(() => {});
  sendCancelledSMS(apt.patient, apt.doctor, apt, reason);

  return apt;
};

const rescheduleAppointment = async (patientId, appointmentId, newDate, newTime) => {
  const apt = await PatientAppointment.findOne({ _id: appointmentId, patient: patientId })
    .populate('doctor', 'name email phoneNumber')
    .populate('patient', 'name email phoneNumber');

  if (!apt) throw new Error('NOT_FOUND');
  if (!['pending', 'confirmed'].includes(apt.status)) throw new Error('CANNOT_RESCHEDULE');

  const slotTaken = await PatientAppointment.findOne({
    doctor: apt.doctor._id,
    date: newDate,
    time: newTime,
    _id: { $ne: apt._id },
    status: { $nin: ['cancelled', 'rejected'] },
  });
  if (slotTaken) throw new Error('SLOT_TAKEN');

  const oldDate = apt.date;
  const oldTime = apt.time;

  apt.date = newDate;
  apt.time = newTime;
  apt.status = 'pending';
  apt.videoRoomId = null;
  await apt.save();

  sendRescheduledEmail(apt.patient, apt.doctor, apt, oldDate, oldTime).catch(() => {});
  sendRescheduledSMS(apt.patient, apt.doctor, apt, oldDate, oldTime);

  return apt;
};

const getDoctorAppointmentRequests = async (doctorId, status = 'pending') => {
  const query = { doctor: doctorId };
  if (status !== 'all') query.status = status;

  return PatientAppointment.find(query)
    .populate('patient', 'name email phoneNumber gender dateOfBirth bloodGroup medicalConditions')
    .sort({ date: 1, time: 1 })
    .lean();
};

const confirmAppointment = async (doctorId, appointmentId) => {
  const apt = await PatientAppointment.findOne({ _id: appointmentId, doctor: doctorId });
  if (!apt) throw new Error('NOT_FOUND');
  if (apt.status !== 'pending') throw new Error('ALREADY_PROCESSED');

  apt.status = 'confirmed';
  apt.videoRoomId = `mediconnect-${uuidv4()}`;
  await apt.save();

  const [patient, doctor] = await Promise.all([
    Patient.findById(apt.patient).select('name email phoneNumber').lean(),
    Doctor.findById(doctorId).select('name email phoneNumber').lean(),
  ]);

  sendDoctorConfirmEmail(patient, doctor, apt).catch(() => {});
  sendDoctorConfirmSMS(patient, doctor, apt);

  return apt;
};

const rejectAppointment = async (doctorId, appointmentId, reason) => {
  const apt = await PatientAppointment.findOne({ _id: appointmentId, doctor: doctorId });
  if (!apt) throw new Error('NOT_FOUND');
  if (apt.status !== 'pending') throw new Error('ALREADY_PROCESSED');

  apt.status = 'rejected';
  apt.cancellationReason = reason || '';
  await apt.save();

  const [patient, doctor] = await Promise.all([
    Patient.findById(apt.patient).select('name email phoneNumber').lean(),
    Doctor.findById(doctorId).select('name email phoneNumber').lean(),
  ]);

  sendDoctorRejectEmail(patient, doctor, apt, reason).catch(() => {});
  sendDoctorRejectSMS(patient, doctor, apt, reason);

  return apt;
};

const completeAppointment = async (doctorId, appointmentId) => {
  const apt = await PatientAppointment.findOne({ _id: appointmentId, doctor: doctorId });
  if (!apt) throw new Error('NOT_FOUND');
  if (apt.status !== 'confirmed') throw new Error('NOT_CONFIRMED');

  apt.status = 'completed';
  await apt.save();

  const [patient, doctor] = await Promise.all([
    Patient.findById(apt.patient).select('name email phoneNumber').lean(),
    Doctor.findById(doctorId).select('name email phoneNumber').lean(),
  ]);

  sendCompletedEmail(patient, doctor, apt).catch(() => {});
  sendCompletedSMS(patient, doctor, apt);

  return apt;
};

const getAppointmentReceipt = async (appointmentId, patientId) => {
  const apt = await PatientAppointment.findOne({ _id: appointmentId, patient: patientId })
    .populate('doctor', 'name specialization hospital licenseNumber')
    .populate('patient', 'name email phoneNumber')
    .lean();

  if (!apt) throw new Error('NOT_FOUND');
  return apt;
};

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorAvailability,
  createStripeCheckoutSession,
  verifyPaymentAndCreateAppointment,
  getPatientAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getDoctorAppointmentRequests,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  getAppointmentReceipt,
};

