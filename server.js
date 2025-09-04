// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const slotRoutes = require("./routes/slotRoutes");



const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true })); // OK for local dev
app.use(express.json());

// Routes
app.use('/api/test', require('./routes/testRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/slots", slotRoutes);


// Root
app.get('/', (req, res) => {
  res.send('Backend is running 👍');
});

// Start server after DB check
const PORT = process.env.PORT || 5000;
(async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start: DB connection error ->', err.message);
    process.exit(1);
  }
})();
