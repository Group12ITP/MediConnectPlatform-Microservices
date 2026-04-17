// services/availabilityService.js
const Availability = require('../models/Availability');

const getMonthAvailability = async (doctorId, year, month) => {
  const paddedMonth = String(month).padStart(2, '0');
  const startDate = `${year}-${paddedMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

  const records = await Availability.find({
    doctor: doctorId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true,
  }).lean();

  const result = {};
  for (const record of records) {
    result[record.date] = {
      slots: record.slots.filter((s) => s.isActive),
    };
  }

  return result;
};

const saveMonthAvailability = async (doctorId, year, month, availability, maxPatients) => {
  const paddedMonth = String(month).padStart(2, '0');

  const operations = Object.entries(availability)
    .map(([dateStr, times]) => {
      if (!dateStr.startsWith(`${year}-${paddedMonth}`)) return null;

      const slots = times.map((time) => {
        const slotKey = `${dateStr}_${time}`;
        return {
          time,
          maxPatients: maxPatients[slotKey] || 5,
          isActive: true,
        };
      });

      return {
        updateOne: {
          filter: { doctor: doctorId, date: dateStr },
          update: { $set: { slots, isActive: true } },
          upsert: true,
        },
      };
    })
    .filter(Boolean);

  if (operations.length === 0) return { modifiedCount: 0, upsertedCount: 0 };

  return Availability.bulkWrite(operations);
};

const clearMonthAvailability = async (doctorId, year, month) => {
  const paddedMonth = String(month).padStart(2, '0');
  const startDate = `${year}-${paddedMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

  return Availability.updateMany(
    { doctor: doctorId, date: { $gte: startDate, $lte: endDate } },
    { $set: { slots: [], isActive: false } }
  );
};

const getDateAvailability = async (doctorId, date) => {
  return Availability.findOne({
    doctor: doctorId,
    date,
    isActive: true,
  }).lean();
};

const copyPreviousMonthAvailability = async (doctorId, year, month) => {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevPadded = String(prevMonth).padStart(2, '0');

  const prevStartDate = `${prevYear}-${prevPadded}-01`;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevEndDate = `${prevYear}-${prevPadded}-${String(prevLastDay).padStart(2, '0')}`;

  const prevRecords = await Availability.find({
    doctor: doctorId,
    date: { $gte: prevStartDate, $lte: prevEndDate },
    isActive: true,
  }).lean();

  if (prevRecords.length === 0) return { copiedCount: 0 };

  const currentLastDay = new Date(year, month, 0).getDate();
  const paddedMonth = String(month).padStart(2, '0');

  const operations = [];

  for (const record of prevRecords) {
    const prevDay = parseInt(record.date.split('-')[2], 10);
    const currentDay = Math.min(prevDay, currentLastDay);
    const currentDate = `${year}-${paddedMonth}-${String(currentDay).padStart(2, '0')}`;

    operations.push({
      updateOne: {
        filter: { doctor: doctorId, date: currentDate },
        update: {
          $setOnInsert: { slots: record.slots, isActive: true },
        },
        upsert: true,
      },
    });
  }

  const result = await Availability.bulkWrite(operations);
  return { copiedCount: result.upsertedCount + result.modifiedCount };
};

module.exports = {
  getMonthAvailability,
  saveMonthAvailability,
  clearMonthAvailability,
  getDateAvailability,
  copyPreviousMonthAvailability,
};

