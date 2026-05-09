import 'dotenv/config';
import mysql from 'mysql2/promise';

async function checkDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await connection.query('SELECT * FROM `users` LIMIT 5');
    console.log('=== DATA USERS ===');
    console.log(rows);
    console.log('==================');
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

checkDB();
