const express = require('express');
const router = express.Router();

const {
  createSession,
  getSession,
} = require('../controllers/telemedicineController');

router.post('/sessions', createSession);
router.get('/sessions/:sessionId', getSession);

module.exports = router;

