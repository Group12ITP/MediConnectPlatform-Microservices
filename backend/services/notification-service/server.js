require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const emailService = require('./utils/emailService');
const smsService   = require('./utils/smsService');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ─── Email Notification ─────────────────────────────────────
app.post('/api/notifications/email', async (req, res) => {
  try {
    const { to, subject, html, text, type, data } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required fields: to, subject' });
    }

    // Route to appropriate email template if type is specified
    if (type && emailService[type] && typeof emailService[type] === 'function') {
      await emailService[type](data);
    } else {
      // Generic email
      await emailService.sendEmail({ to, subject, html, text });
    }

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email notification error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

// ─── SMS Notification ───────────────────────────────────────
app.post('/api/notifications/sms', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields: to, message' });
    }

    await smsService.sendSMS({ to, message });

    res.status(200).json({ success: true, message: 'SMS sent successfully' });
  } catch (error) {
    console.error('SMS notification error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send SMS', error: error.message });
  }
});

// ─── Bulk Notification ──────────────────────────────────────
app.post('/api/notifications/bulk', async (req, res) => {
  try {
    const { notifications } = req.body; // [{ type: 'email'|'sms', ...payload }]
    if (!Array.isArray(notifications)) {
      return res.status(400).json({ success: false, message: 'Expected notifications array' });
    }

    const results = await Promise.allSettled(
      notifications.map(async (n) => {
        if (n.type === 'email') {
          await emailService.sendEmail({ to: n.to, subject: n.subject, html: n.html });
        } else if (n.type === 'sms') {
          await smsService.sendSMS({ to: n.to, message: n.message });
        }
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed    = results.filter(r => r.status === 'rejected').length;

    res.status(200).json({ success: true, succeeded, failed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/health', (_req, res) =>
  res.status(200).json({ service: 'notification-service', status: 'ok', timestamp: new Date().toISOString() })
);

const PORT = Number(process.env.PORT) || 5004;
app.listen(PORT, () =>
  console.log(`🚀 Notification Service running on port ${PORT}`)
);

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});