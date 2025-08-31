// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const sendEmail = require('../utils/sendEmail');
const { userInquiryTemplate } = require("../utils/templates");

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, phone, email, description } = req.body;

  if (!name || !phone || !email || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // 1️⃣ Save into MySQL
    await pool.query(
      'CREATE TABLE IF NOT EXISTS inquiries (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), phone VARCHAR(20), email VARCHAR(100), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
    );

    await pool.query(
      'INSERT INTO inquiries (name, phone, email, description) VALUES (?, ?, ?, ?)',
      [name, phone, email, description]
    );

    // 2️⃣ Send Email to Admin
    const adminHtml = `
      <h2>New Inquiry Received</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Description:</b><br/> ${description}</p>
    `;
     await sendEmail({
      email: process.env.EMAIL_USER,
      subject: "New User Inquiry",
      html: userInquiryTemplate(name, phone, email, description),
    });

    // 3️⃣ Send Confirmation Email to User
    const userHtml = `
      <h2>Hi ${name},</h2>
      <p>Thank you for contacting <b>Construction & Interiors</b>. We have received your request.</p>
      <h3>Your Inquiry:</h3>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Description:</b><br/> ${description}</p>
      <p>Our team will contact you shortly.</p>
      <br/>
      <p>Regards,<br/>Construction & Interiors Team</p>
    `;
        await sendEmail({
      email,
      subject: "Your Inquiry with E-Appointment",
      html: userInquiryTemplate(name, phone, email, description ),
    });
    res.json({ message: 'Inquiry saved and emails sent ✅' });
  } catch (err) {
    console.error('❌ Contact Route Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
