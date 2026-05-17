const nodemailer = require('nodemailer');

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransporter = () => {
  if (!hasSmtpConfig()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'Campus Ministries <no-reply@xu.edu.ph>';

  if (!transporter) {
    console.log('[Email preview] SMTP is not configured. Email was not sent.');
    console.log('[Email preview] To:', to);
    console.log('[Email preview] Subject:', subject);
    console.log('[Email preview] Body:', text);
    return { sent: false, preview: true };
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });

  return { sent: true, preview: false };
};

module.exports = {
  sendEmail
};
