const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    logger.warn(`[EMAIL] SMTP is not configured. Email to ${options.to} not sent. Subject: ${options.subject}`);
    // Log content in dev
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[EMAIL CONTENT] Text: ${options.text}`);
    }
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const message = {
      from: `"${process.env.SMTP_FROM_NAME || 'UniLearn'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(message);

    logger.info(`[EMAIL] Email sent to ${options.to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`[EMAIL] Error sending email to ${options.to}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
