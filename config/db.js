const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log("✅ MySQL: connection OK");
}

module.exports = { pool, testConnection };
