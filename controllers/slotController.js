const { pool } = require("../config/db");
const dailySlots = require("../utils/slots");

exports.getSlots = async (req, res) => {
  try {
    const { date } = req.params;

    // Fetch booked times for that date
    const [results] = await pool.query(
      `SELECT booking_time FROM bookings WHERE booking_date = ?`,
      [date]
    );

    // Format to "HH:MM"
    const bookedSlots = results.map(row => 
      row.booking_time.toString().slice(0, 5)
    );

    // Filter out booked slots
    const availableSlots = dailySlots.filter(
      slot => !bookedSlots.includes(slot)
    );

    res.json({ availableSlots, bookedSlots });
  } catch (err) {
    console.error("❌ Error fetching slots:", err);
    res.status(500).json({ error: "Database error" });
  }
};
