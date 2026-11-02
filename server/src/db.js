import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

const isConfigured = Boolean(DB_HOST && DB_USER && DB_NAME);

let pool = null;

export async function initDatabase() {
  if (!isConfigured) {
    return null;
  }

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT || 3306),
      user: DB_USER,
      password: DB_PASSWORD || '',
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    await pool.query('SELECT 1');
    console.log('MySQL database connected successfully');
    return pool;
  } catch (error) {
    console.warn('MySQL unavailable, switching to demo mode:', error.message);
    pool = null;
    return null;
  }
}

export function getDatabase() {
  return pool;
}
