require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./src/config/db');
const errorMiddleware = require('./src/middleware/errorMiddleware');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded profile photos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth',         require('./src/routes/authRoutes'));        // Doctor auth
app.use('/api/patient/auth', require('./src/routes/patientAuthRoutes')); // Patient auth
app.use('/api/patient',      require('./src/routes/patientRoutes'));     // Patient dashboard
app.use('/api/doctors',      require('./src/routes/doctorRoutes'));      // Doctor profile/list
app.use('/api/admin/auth',   require('./src/routes/adminAuthRoutes'));   // Admin auth
app.use('/api/admin',        require('./src/routes/adminRoutes'));       // Admin ops

// Health check
app.get('/health', (_req, res) =>
  res.status(200).json({ service: 'user-service', status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5001;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 User Service running on port ${PORT}`)
  );
}).catch(err => {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});