require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const errorMiddleware = require('./src/middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

app.use('/api/payments', require('./src/routes/paymentRoutes'));

app.get('/health', (_req, res) =>
  res.status(200).json({ service: 'payment-service', status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5006;
app.listen(PORT, () => console.log(`🚀 Payment Service running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

