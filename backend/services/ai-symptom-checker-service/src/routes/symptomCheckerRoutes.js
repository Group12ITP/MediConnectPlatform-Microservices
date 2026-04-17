const express = require('express');
const router = express.Router();

const { checkSymptoms } = require('../services/symptomCheckerService');

router.post('/check', (req, res) => {
  const { symptoms } = req.body || {};
  const result = checkSymptoms(symptoms);
  res.status(200).json({ success: true, ...result });
});

module.exports = router;

