// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"E-Appointment Team" <${process.env.EMAIL_USER}>`,
      to: options.to,   // ✅ FIXED: always use "to"
      subject: options.subject,
      html: options.html,
    };

    console.log("📧 Sending email to:", options.to); // debug log
    await transporter.sendMail(mailOptions);
    console.log("📩 Email sent successfully");
  } catch (error) {
    console.error("❌ Email error:", error.message);
  }
};

module.exports = sendEmail;
