const sessions = new Map();

function createSession({ appointmentId, patientId, doctorId }) {
  const now = new Date().toISOString();
  const session = {
    sessionId: appointmentId, // stable id; gateway/frontend can use appointmentId
    appointmentId,
    patientId,
    doctorId,
    createdAt: now,
    status: 'created',
  };
  sessions.set(session.sessionId, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function updateSession(sessionId, patch) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  const next = { ...s, ...patch };
  sessions.set(sessionId, next);
  return next;
}

module.exports = { createSession, getSession, updateSession };

