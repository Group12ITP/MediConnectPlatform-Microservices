const { validationResult } = require("express-validator");
const Doctor = require("../models/identity/Doctor");

// ── Helper: Format validation errors ───────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

// ───────────────────────────────────────────────────────────────
// @desc    Search doctors with filters, sorting & pagination
// @route   GET /api/search
// @access  Private (all authenticated roles)
//
// Query params:
//   name          - partial name match
//   specialization - exact or partial match
//   city          - partial match on hospital/location field
//   minExperience - minimum years of experience
//   sortBy        - experience_asc|experience_desc|name_asc|name_desc
//   page          - page number (default: 1)
//   limit         - results per page (default: 10)
// ───────────────────────────────────────────────────────────────
const searchDoctors = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const {
      name,
      specialization,
      city,
      minExperience,
      sortBy,
      page  = 1,
      limit = 10,
    } = req.query;

    const filter = { isActive: true };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    if (city) {
      // The Doctor model stores hospital name; use it as a location proxy
      filter.hospital = { $regex: city, $options: "i" };
    }
    if (minExperience) {
      filter.experience = { $gte: Number(minExperience) };
    }

    const sortMap = {
      experience_asc:  { experience:  1 },
      experience_desc: { experience: -1 },
      name_asc:        { name:  1 },
      name_desc:       { name: -1 },
    };
    const sortObject = sortMap[sortBy] || { createdAt: -1 };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Doctor.countDocuments(filter);

    const doctors = await Doctor.find(filter)
      .select("name email specialization licenseNumber qualification experience hospital phoneNumber bio location consultationFee isActive isVerified createdAt")
      .sort(sortObject)
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success:    true,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      limit:      Number(limit),
      filters: {
        name:          name           || null,
        specialization: specialization || null,
        city:          city           || null,
        minExperience: minExperience  ? Number(minExperience) : null,
        sortBy:        sortBy         || "newest",
      },
      data: doctors,
    });
  } catch (error) {
    console.error("searchDoctors error:", error);
    return res.status(500).json({ success: false, message: "Server error during search." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Autocomplete doctor name suggestions
// @route   GET /api/search/autocomplete?q=john
// @access  Private (all authenticated roles)
// ───────────────────────────────────────────────────────────────
const autocomplete = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Query must be at least 2 characters.",
      });
    }

    const doctors = await Doctor.find({
      isActive: true,
      name: { $regex: q.trim(), $options: "i" },
    })
      .select("name specialization hospital")
      .limit(8);

    const suggestions = doctors.map((d) => ({
      displayName:    `Dr. ${d.name}`,
      specialization: d.specialization,
      hospital:       d.hospital,
    }));

    return res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    console.error("autocomplete error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get all distinct specializations (for dropdown)
// @route   GET /api/search/specializations
// @access  Private (all authenticated roles)
// ───────────────────────────────────────────────────────────────
const getSpecializations = async (req, res) => {
  try {
    const specializations = await Doctor.distinct("specialization", { isActive: true });
    return res.status(200).json({
      success: true,
      total:   specializations.length,
      data:    specializations.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("getSpecializations error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get all distinct cities / hospitals (for dropdown)
// @route   GET /api/search/cities
// @access  Private (all authenticated roles)
// ───────────────────────────────────────────────────────────────
const getCities = async (req, res) => {
  try {
    const cities = await Doctor.distinct("hospital", { isActive: true });
    return res.status(200).json({
      success: true,
      total:   cities.length,
      data:    cities.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("getCities error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get a single doctor's full public details by _id
// @route   GET /api/search/:doctorId
// @access  Private (all authenticated roles)
// ───────────────────────────────────────────────────────────────
const getDoctorDetails = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor ID format." });
    }

    const doctor = await Doctor.findById(doctorId).select(
      "name email specialization licenseNumber qualification experience hospital phoneNumber bio location consultationFee isActive isVerified createdAt"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor ${doctorId} not found.`,
      });
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error("getDoctorDetails error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  searchDoctors,
  autocomplete,
  getSpecializations,
  getCities,
  getDoctorDetails,
};