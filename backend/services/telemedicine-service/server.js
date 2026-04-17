require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const routes = require('./src/routes/telemedicineRoutes');
const { registerSocketHandlers } = require('./src/sockets/registerSocketHandlers');
const errorMiddleware = require('./src/middleware/errorMiddleware');

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/telemedicine', routes);
app.get('/health', (_req, res) =>
  res.status(200).json({ service: 'telemedicine-service', status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5007;
const server = http.createServer(app);

const io = new Server(server, {
  path: '/api/telemedicine/socket.io',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

registerSocketHandlers(io);

server.listen(PORT, () => console.log(`🚀 Telemedicine Service running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

