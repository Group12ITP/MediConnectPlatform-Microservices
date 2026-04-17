require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Defaults are for running services locally (no Docker DNS).
// In Docker Compose, these are overridden by environment variables.
const USER_SERVICE_URL         = process.env.USER_SERVICE_URL         || 'http://localhost:5001';
const APPOINTMENT_SERVICE_URL  = process.env.APPOINTMENT_SERVICE_URL  || 'http://localhost:5002';
const CONSULTATION_SERVICE_URL = process.env.CONSULTATION_SERVICE_URL || 'http://localhost:5003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';
const PHARMACY_SERVICE_URL     = process.env.PHARMACY_SERVICE_URL     || 'http://localhost:5005';
const PAYMENT_SERVICE_URL      = process.env.PAYMENT_SERVICE_URL      || 'http://localhost:5006';
const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5007';
const SYMPTOM_CHECKER_URL      = process.env.SYMPTOM_CHECKER_URL      || 'http://localhost:5008';
const PORT = Number(process.env.PORT) || 5000;

// ─── Security ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — try again later.' },
});
app.use('/api/', limiter);

// ─── Proxy Config ──────────────────────────────────────────
const proxyOptions = {
  changeOrigin: true,
  xfwd: true,
};

// ─── Route → Service Mapping ───────────────────────────────
// User Service: auth, patients, doctors, admin
// Health-reports — dynamic path segment needs wildcard
// IMPORTANT: must be registered BEFORE `/api/patient` proxy or it will be swallowed.
app.use(
  /^\/api\/patient\/[^/]+\/health-reports/,
  createProxyMiddleware({
    ...proxyOptions,
    target: CONSULTATION_SERVICE_URL,
    pathRewrite: (_path, req) => req.originalUrl,
  })
);
app.use(
  '/api/auth',
  createProxyMiddleware({
    ...proxyOptions,
    target: USER_SERVICE_URL,
    pathRewrite: (path) => `/api/auth${path}`,
  })
);
app.use(
  '/api/patient',
  createProxyMiddleware({
    ...proxyOptions,
    target: USER_SERVICE_URL,
    pathRewrite: (path) => `/api/patient${path}`,
  })
);
app.use(
  '/api/doctors',
  createProxyMiddleware({
    ...proxyOptions,
    target: USER_SERVICE_URL,
    pathRewrite: (path) => `/api/doctors${path}`,
  })
);
app.use(
  '/api/admin',
  createProxyMiddleware({
    ...proxyOptions,
    target: USER_SERVICE_URL,
    pathRewrite: (path) => `/api/admin${path}`,
  })
);

// Appointment Service: appointments, availability, schedule
app.use(
  '/api/appointments',
  createProxyMiddleware({
    ...proxyOptions,
    target: APPOINTMENT_SERVICE_URL,
    pathRewrite: (path) => `/api/appointments${path}`,
  })
);
app.use(
  '/api/availability',
  createProxyMiddleware({
    ...proxyOptions,
    target: APPOINTMENT_SERVICE_URL,
    pathRewrite: (path) => `/api/availability${path}`,
  })
);
app.use(
  '/api/schedule',
  createProxyMiddleware({
    ...proxyOptions,
    target: APPOINTMENT_SERVICE_URL,
    pathRewrite: (path) => `/api/schedule${path}`,
  })
);

// Consultation Service: reports, prescriptions, health-reports
app.use(
  '/api/reports',
  createProxyMiddleware({
    ...proxyOptions,
    target: CONSULTATION_SERVICE_URL,
    pathRewrite: (path) => `/api/reports${path}`,
  })
);
app.use(
  '/api/prescriptions',
  createProxyMiddleware({
    ...proxyOptions,
    target: CONSULTATION_SERVICE_URL,
    pathRewrite: (path) => `/api/prescriptions${path}`,
  })
);

// Notification Service
app.use(
  '/api/notifications',
  createProxyMiddleware({
    ...proxyOptions,
    target: NOTIFICATION_SERVICE_URL,
    pathRewrite: (path) => `/api/notifications${path}`,
  })
);

// Pharmacy Service: pharmacy auth/profile/inventory, finder, medicines
app.use(
  ['/api/pharmacy', '/api/finder', '/api/medicines'],
  createProxyMiddleware({
    ...proxyOptions,
    target: PHARMACY_SERVICE_URL,
    pathRewrite: (_path, req) => req.originalUrl,
  })
);

// Payment Service: payment intents / checkout
app.use(
  '/api/payments',
  createProxyMiddleware({
    ...proxyOptions,
    target: PAYMENT_SERVICE_URL,
    pathRewrite: (path) => `/api/payments${path}`,
  })
);

// Telemedicine Service: signaling + session management
app.use(
  '/api/telemedicine',
  createProxyMiddleware({
    ...proxyOptions,
    target: TELEMEDICINE_SERVICE_URL,
    ws: true,
    pathRewrite: (path) => `/api/telemedicine${path}`,
  })
);

// AI Symptom Checker Service
app.use(
  '/api/symptom-checker',
  createProxyMiddleware({
    ...proxyOptions,
    target: SYMPTOM_CHECKER_URL,
    pathRewrite: (path) => `/api/symptom-checker${path}`,
  })
);

// ─── Gateway Health ────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.status(200).json({
    service: 'api-gateway',
    status: 'ok',
    timestamp: new Date().toISOString(),
    upstream: {
      userService:         USER_SERVICE_URL,
      appointmentService:  APPOINTMENT_SERVICE_URL,
      consultationService: CONSULTATION_SERVICE_URL,
      notificationService: NOTIFICATION_SERVICE_URL,
      pharmacyService:     PHARMACY_SERVICE_URL,
        paymentService:      PAYMENT_SERVICE_URL,
        telemedicineService: TELEMEDICINE_SERVICE_URL,
        symptomChecker:      SYMPTOM_CHECKER_URL,
    },
  })
);

app.listen(PORT, () =>
  console.log(`🚀 API Gateway running on port ${PORT}`)
);

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});
