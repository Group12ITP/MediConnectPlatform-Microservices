const express = require("express");
const router  = express.Router();

const {
  searchDoctors,
  autocomplete,
  getSpecializations,
  getCities,
  getDoctorDetails,
} = require("../controllers/Searchcontroller");

const {
  protect,
  requireApproved,
} = require("../middleware/pharmacistauthmiddleware");

// ── All routes require authentication ───────────────────────────
router.use(protect, requireApproved);

// ── Dropdown helpers (BEFORE /:doctorId to avoid conflicts) ─────
router.get("/specializations", getSpecializations);
router.get("/cities",          getCities);

// ── Autocomplete ─────────────────────────────────────────────────
router.get("/autocomplete", autocomplete);

// ── Main search ──────────────────────────────────────────────────
router.get("/", searchDoctors);

// ── Single doctor detail ─────────────────────────────────────────
router.get("/:doctorId", getDoctorDetails);

module.exports = router;
