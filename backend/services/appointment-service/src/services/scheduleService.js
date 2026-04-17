// services/scheduleService.js
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');

const getScheduleForRange = async (doctorId, startDate, endDate) => {
  const availabilities = await Availability.find({
    doctor: doctorId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true,
  }).lean();

  const appointments = await Appointment.find({
    doctor: doctorId,
    date: { $gte: startDate, $lte: endDate },
    status: { $ne: 'cancelled' },
  }).lean();

  const appointmentMap = {};
  for (const apt of appointments) {
    if (!appointmentMap[apt.date]) appointmentMap[apt.date] = {};
    appointmentMap[apt.date][apt.time] = apt;
  }

  const scheduleMap = {};

  for (const avail of availabilities) {
    const dayAppointments = appointmentMap[avail.date] || {};

    const slots = avail.slots
      .filter((s) => s.isActive)
      .map((slot) => {
        const apt = dayAppointments[slot.time];
        if (apt) {
          return {
            time: slot.time,
            patient: apt.patientName,
            age: apt.patientAge || null,
            type: apt.type,
            status: apt.status === 'confirmed' ? 'confirmed' : apt.status,
            duration: apt.duration,
            phone: apt.patientPhone || null,
            appointmentId: apt._id,
            maxPatients: slot.maxPatients,
          };
        }

        return {
          time: slot.time,
          patient: null,
          type: 'Free',
          status: 'free',
          duration: 30,
          maxPatients: slot.maxPatients,
        };
      });

    slots.sort((a, b) => a.time.localeCompare(b.time));

    const dateObj = new Date(avail.date + 'T00:00:00');
    scheduleMap[avail.date] = {
      date: avail.date,
      day: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
      slots,
    };
  }

  for (const [date, timeMap] of Object.entries(appointmentMap)) {
    if (!scheduleMap[date]) {
      const dateObj = new Date(date + 'T00:00:00');
      scheduleMap[date] = {
        date,
        day: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
        slots: Object.values(timeMap).map((apt) => ({
          time: apt.time,
          patient: apt.patientName,
          age: apt.patientAge || null,
          type: apt.type,
          status: apt.status,
          duration: apt.duration,
          phone: apt.patientPhone || null,
          appointmentId: apt._id,
        })),
      };
    }
  }

  return Object.values(scheduleMap).sort((a, b) => a.date.localeCompare(b.date));
};

const getScheduleStats = async (doctorId, startDate, endDate) => {
  const mongoose = require('mongoose');

  const [totalConfirmed, totalFreeAgg, uniquePatients, completedCount] = await Promise.all([
    Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: startDate, $lte: endDate },
      status: 'confirmed',
    }),
    Availability.aggregate([
      {
        $match: {
          doctor: mongoose.Types.ObjectId.createFromHexString(doctorId.toString()),
          date: { $gte: startDate, $lte: endDate },
          isActive: true,
        },
      },
      { $unwind: '$slots' },
      { $match: { 'slots.isActive': true } },
      { $count: 'total' },
    ]),
    Appointment.distinct('patientName', {
      doctor: doctorId,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' },
    }),
    Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: startDate, $lte: endDate },
      status: 'completed',
    }),
  ]);

  const totalSlots = totalFreeAgg[0]?.total || 0;
  const freeSlots = Math.max(0, totalSlots - totalConfirmed);
  const completionRate = (totalConfirmed + completedCount) > 0
    ? Math.round((completedCount / (totalConfirmed + completedCount)) * 100)
    : 0;

  return {
    totalAppointments: totalConfirmed,
    freeSlots,
    uniquePatients: uniquePatients.length,
    completionRate,
  };
};

const getDaySchedule = async (doctorId, date) => {
  const [availability, appointments] = await Promise.all([
    Availability.findOne({ doctor: doctorId, date, isActive: true }).lean(),
    Appointment.find({ doctor: doctorId, date, status: { $ne: 'cancelled' } }).lean(),
  ]);

  const appointmentMap = {};
  for (const apt of appointments) appointmentMap[apt.time] = apt;

  const slots = [];
  if (availability) {
    for (const slot of availability.slots.filter((s) => s.isActive)) {
      const apt = appointmentMap[slot.time];
      if (apt) {
        slots.push({
          time: slot.time,
          patient: apt.patientName,
          age: apt.patientAge || null,
          type: apt.type,
          status: apt.status,
          duration: apt.duration,
          phone: apt.patientPhone || null,
          appointmentId: apt._id,
          maxPatients: slot.maxPatients,
        });
      } else {
        slots.push({
          time: slot.time,
          patient: null,
          type: 'Free',
          status: 'free',
          duration: 30,
          maxPatients: slot.maxPatients,
        });
      }
    }
  }

  slots.sort((a, b) => a.time.localeCompare(b.time));
  const dateObj = new Date(date + 'T00:00:00');

  return {
    date,
    day: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
    slots,
  };
};

module.exports = {
  getScheduleForRange,
  getScheduleStats,
  getDaySchedule,
};

