require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HOST_EMAIL = process.env.HOST_EMAIL; // where RSVPs are sent

if (!HOST_EMAIL) {
  console.warn('Warning: HOST_EMAIL not set. Update .env before running to enable emails.');
}

// nodemailer transporter using SMTP from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});

app.post('/rsvp', async (req, res) => {
  const { name, answer, timestamp } = req.body || {};
  if (!name || !answer) return res.status(400).json({ error: 'name and answer are required' });

  const subject = `RSVP: ${name} — ${answer.toUpperCase()}`;
  const text = `Name: ${name}\nAnswer: ${answer}\nTime: ${timestamp || new Date().toISOString()}`;

  if (!HOST_EMAIL) {
    return res.status(500).json({ error: 'HOST_EMAIL not configured on server' });
  }

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || `RSVP <no-reply@localhost>`,
      to: HOST_EMAIL,
      subject,
      text,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('sendMail error', err);
    return res.status(500).json({ error: 'failed to send email' });
  }
});

app.listen(PORT, () => console.log(`RSVP server listening on http://localhost:${PORT}`));
