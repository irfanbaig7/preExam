const nodemailer = require('nodemailer');
const env = require('../config/env');

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

async function send(to, subject, text) {
  if (!env.SMTP_HOST) {
    console.log(`[mail:dev] to=${to} subject="${subject}"`);
    return;
  }
  await transport.sendMail({ from: env.MAIL_FROM, to, subject, text });
}

module.exports = { send };
