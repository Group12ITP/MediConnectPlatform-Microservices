const { createSession: createSessionInStore, getSession: getSessionFromStore } = require('../store/sessions');

exports.createSession = async (req, res) => {
  const { appointmentId, patientId, doctorId } = req.body || {};
  if (!appointmentId || !patientId || !doctorId) {
    return res.status(400).json({ success: false, message: 'appointmentId, patientId, doctorId are required' });
  }

  const session = createSessionInStore({ appointmentId, patientId, doctorId });
  return res.status(201).json({ success: true, session });
};

exports.getSession = async (req, res) => {
  const { sessionId } = req.params;
  const session = getSessionFromStore(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }
  return res.status(200).json({ success: true, session });
};

