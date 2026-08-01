const mysql = require('mysql2/promise');
const fs = require('fs');

let pool = null;

function getPool() {
  if (!pool) {
    // Managed providers like Aiven require TLS. Set DB_SSL_CA to the path of the
    // downloaded CA certificate to enable it; unset (default) leaves local dev untouched.
    const sslCa = process.env.DB_SSL_CA;

    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME || 'fast_q',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      waitForConnections: true,
      connectionLimit: 10,
      ssl: sslCa ? { ca: fs.readFileSync(sslCa) } : undefined,
    });
  }
  return pool;
}

module.exports = { getPool };
