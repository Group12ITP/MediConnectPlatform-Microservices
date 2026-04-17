require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./src/config/db');
const { connectIdentityDB } = require('./src/config/identityDb');
const errorMiddleware = require('./src/middleware/errorMiddleware');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ────────────────────────────────────────────────
app.use('/api/pharmacy/auth',      require('./src/routes/Pharmacistroutes'));  // Pharmacist auth
app.use('/api/pharmacy/profile',   require('./src/routes/Pharmacyroutes'));    // Pharmacy profile
app.use('/api/pharmacy/inventory', require('./src/routes/Inventoryroutes'));   // Inventory mgmt
app.use('/api/finder',             require('./src/routes/Finderroutes'));      // Pharmacy finder
app.use('/api/medicines',          require('./src/routes/Brandroutes'));       // Brand scoring
app.use('/api/search',             require('./src/routes/Searchroutes'));      // Doctor/medicine search

// Health check
app.get('/health', (_req, res) =>
  res.status(200).json({ service: 'pharmacy-service', status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5005;

Promise.all([connectDB(), connectIdentityDB()]).then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Pharmacy Service running on port ${PORT}`)
  );
}).catch(err => {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});
