require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./src/routes/symptomCheckerRoutes');
const errorMiddleware = require('./src/middleware/errorMiddleware');

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/symptom-checker', routes);

app.get('/health', (_req, res) =>
  res.status(200).json({ service: 'ai-symptom-checker-service', status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5008;
app.listen(PORT, () => console.log(`🚀 AI Symptom Checker Service running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

