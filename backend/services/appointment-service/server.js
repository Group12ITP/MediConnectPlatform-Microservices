require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorMiddleware = require('./src/middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ────────────────────────────────────────────────
app.use('/api/appointments', require('./src/routes/appointmentRoutes'));  // Booking + lifecycle
app.use('/api/availability', require('./src/routes/availabilityRoutes')); // Doctor availability
app.use('/api/schedule',     require('./src/routes/scheduleRoutes'));     // Doctor schedule view

// Health check
app.get('/health', (_req, res) =>
  res.status(200).json({ service: 'appointment-service', status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5002;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Appointment Service running on port ${PORT}`)
  );
}).catch(err => {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});