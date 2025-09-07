// backend/utils/sendEmail.js
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    await sgMail.send({
      to,
      from: process.env.ADMIN_EMAIL, // must be verified in SendGrid
      subject,
      html,
    });
    console.log('📩 Email sent successfully');
  } catch (error) {
    console.error('❌ Email error:', error.response ? error.response.body : error.message);
  }
};

module.exports = sendEmail;
