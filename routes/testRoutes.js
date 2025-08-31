// routes/testRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Route 1: simple check
router.get('/ping', (req, res) => {
  res.json({ message: 'Server is alive 🚀' });
});

// Route 2: create dummy table + insert
router.get('/create-table', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dummy_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100)
      )
    `);
    res.json({ message: 'dummy_users table created ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route 3: insert a dummy user
router.post('/add-user', async (req, res) => {
  const { name, email } = req.body;
  try {
    await pool.query('INSERT INTO dummy_users (name, email) VALUES (?, ?)', [name, email]);
    res.json({ message: 'User added successfully ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route 4: fetch users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dummy_users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
