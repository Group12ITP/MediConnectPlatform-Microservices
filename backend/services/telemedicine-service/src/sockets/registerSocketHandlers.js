const { getSession, updateSession } = require('../store/sessions');

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join-session', ({ sessionId, role }) => {
      const session = getSession(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      socket.join(sessionId);
      updateSession(sessionId, { status: 'active' });
      socket.to(sessionId).emit('peer-joined', { role });
      socket.emit('joined', { sessionId });
    });

    // WebRTC signaling payload passthrough
    socket.on('signal', ({ sessionId, data }) => {
      if (!sessionId) return;
      socket.to(sessionId).emit('signal', { data });
    });

    socket.on('leave-session', ({ sessionId, role }) => {
      if (!sessionId) return;
      socket.leave(sessionId);
      socket.to(sessionId).emit('peer-left', { role });
    });
  });
}

module.exports = { registerSocketHandlers };

