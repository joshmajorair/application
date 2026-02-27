const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const submissionFields = upload.fields([
  { name: 'i9', maxCount: 1 },
  { name: 'w4', maxCount: 1 },
  { name: 'idPhotos', maxCount: 10 },
]);

function validateEnv() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'HR_EMAIL_TO', 'HR_EMAIL_FROM'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function createTransporter() {
  validateEnv();
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/submissions', submissionFields, async (req, res) => {
  try {
    const { employeeName, employeeEmail } = req.body;
    const i9 = req.files?.i9?.[0];
    const w4 = req.files?.w4?.[0];
    const idPhotos = req.files?.idPhotos || [];

    if (!employeeName || !employeeEmail || !i9 || !w4 || idPhotos.length === 0) {
      return res.status(400).json({ error: 'Missing required fields or files.' });
    }

    const transporter = createTransporter();

    const attachments = [i9, w4, ...idPhotos].map((file, index) => ({
      filename: file.originalname || `attachment-${index + 1}`,
      content: file.buffer,
      contentType: file.mimetype,
    }));

    await transporter.sendMail({
      from: process.env.HR_EMAIL_FROM,
      to: process.env.HR_EMAIL_TO,
      subject: `New Employee Packet: ${employeeName}`,
      text: [
        'A new employee paperwork packet was submitted.',
        `Employee Name: ${employeeName}`,
        `Employee Email: ${employeeEmail}`,
        `Attached Files: ${attachments.length}`,
      ].join('\n'),
      attachments,
    });

    return res.status(201).json({ ok: true, message: 'Submission accepted and emailed.' });
  } catch (error) {
    console.error('Submission failed:', error);
    return res.status(500).json({ error: 'Unable to process submission.' });
  }
});

app.listen(port, () => {
  console.log(`Paperwork API listening on port ${port}`);
});
