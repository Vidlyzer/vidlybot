import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

// Muat .env menggunakan path absolut untuk stabilitas
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log(`[*] Initializing Database Pool at ${process.env.DB_HOST}...`);

// Menggunakan createPool alih-alih createConnection untuk stabilitas jangka panjang (Anti-Timeout)
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
console.log('[+] Database pool ready.');
