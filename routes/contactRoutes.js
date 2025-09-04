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

    // prepare data for templates
    const inquiryData = { name, phone, email, productDescription: description };

    // 2️⃣ Send Email to Admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: "New User Inquiry",
      html: userInquiryTemplate(inquiryData),
    });

    // 3️⃣ Send Confirmation Email to User
    await sendEmail({
      to: email,
      subject: "Your Inquiry with E-Appointment",
      html: userInquiryTemplate(inquiryData),
    });

    res.json({ message: 'Inquiry saved and emails sent ✅' });
  } catch (err) {
    console.error('❌ Contact Route Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
