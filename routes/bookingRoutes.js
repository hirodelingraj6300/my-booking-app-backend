// backend/routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db"); 

const sendEmail = require("../utils/sendEmail");
const {
  bookingConfirmationTemplate,
  bookingNotificationTemplate,
  cancellationTemplate,
} = require("../utils/templates");

///////////////////////////////////////////////
// Send OTP before booking confirmation
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // clear old OTP for this email
    await pool.query("DELETE FROM otp_requests WHERE email = ?", [email]);

    // insert with 60 sec expiry
    const query = `
      INSERT INTO otp_requests (email, otp, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 60 SECOND))
    `;
    await pool.query(query, [email, otp]);

    await sendEmail({
      to: email,
      subject: "Your Booking OTP",
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 60s.</p>`,
    });

    res.json({ message: "OTP sent successfully. Expires in 60s." });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

///////////////////////////////////////////////
// Verify OTP only
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const [rows] = await pool.query(
      `SELECT id, otp, expires_at FROM otp_requests
       WHERE email = ? ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "No OTP found for this email" });
    }

    const otpRow = rows[0];

    if (otpRow.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (new Date(otpRow.expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // OTP valid → delete row so it can’t be reused
    await pool.query("DELETE FROM otp_requests WHERE id = ?", [otpRow.id]);

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

///////////////////////////////////////////////
// 👉 GET availability
router.get("/availability", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Date required" });

  try {
    const [bookings] = await pool.query(
      "SELECT booking_time FROM bookings WHERE booking_date = ?",
      [date]
    );
    const bookedTimes = bookings.map((b) => b.booking_time);

    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const time24 = `${hour.toString().padStart(2, "0")}:00:00`;

      // Convert to 12-hour format with AM/PM
      const ampmHour = hour % 12 === 0 ? 12 : hour % 12;
      const period = hour < 12 ? "AM" : "PM";
      const displayTime = `${ampmHour}:00 ${period}`;

      slots.push({ time: time24, displayTime, available: !bookedTimes.includes(time24) });
    }

    res.json({ date, slots });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "DB error" });
  }
});

///////////////////////////////////////////////
// 👉 POST create booking
router.post("/", async (req, res) => {
  const { name, email, phone, description, booking_date, booking_time } = req.body;
  if (!name || !email || !phone || !booking_date || !booking_time) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO bookings (name, email, phone, description, booking_date, booking_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, description, booking_date, booking_time]
    );

    // ✅ Email to customer
    await sendEmail({
      to: email,
      subject: "✅ Your Booking is Confirmed",
      html: bookingConfirmationTemplate({
        name, email, phone, booking_date, booking_time, description
      }),
    });

    // ✅ Email to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: "📩 New Booking Received",
      html: bookingNotificationTemplate({
        name, email, phone, booking_date, booking_time, description
      }),
    });

    res.json({ message: "Booking confirmed ✅", bookingId: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Slot already booked" });
    }
    console.error(err.message);
    res.status(500).json({ error: "Booking failed" });
  }
});

///////////////////////////////////////////////
// 👉 GET all bookings
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM bookings ORDER BY booking_date, booking_time"
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "DB error" });
  }
});

///////////////////////////////////////////////
// 👉 Cancel booking
router.post("/cancel", async (req, res) => {
  const { booking_id, email } = req.body;
  if (!booking_id || !email) {
    return res.status(400).json({ error: "Booking ID and email required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM bookings WHERE id = ? AND email = ?",
      [booking_id, email]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Booking not found" });

    const booking = rows[0];

    await pool.query(
      `INSERT INTO bookings_history (original_booking_id, name, email, phone, description, booking_date, booking_time, duration_hours, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cancelled')`,
      [
        booking.id,
        booking.name,
        booking.email,
        booking.phone,
        booking.description,
        booking.booking_date,
        booking.booking_time,
        booking.duration_hours ?? 1,
      ]
    );

    await pool.query("DELETE FROM bookings WHERE id = ?", [booking.id]);

    // ✅ Email to customer
    await sendEmail({
      to: email,
      subject: "❌ Booking Cancelled",
      html: cancellationTemplate({
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        description: booking.description,
      }),
    });

    // ✅ notify admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: "⚠️ Booking Cancelled",
      html: cancellationTemplate({
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        description: booking.description,
      }),
    });

    res.json({ message: "Booking cancelled and archived ✅" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Cancel failed" });
  }
});

module.exports = router;
