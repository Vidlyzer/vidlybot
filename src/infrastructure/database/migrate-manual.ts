import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

console.log('[*] Running manual migration (Add bot_status)...');

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`bot_status\` (
      \`id\` int NOT NULL DEFAULT 1,
      \`instance_name\` varchar(255) NOT NULL,
      \`last_heartbeat\` timestamp NOT NULL DEFAULT now() ON UPDATE now(),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('✅ Manual Migration Success: bot_status table is ready.');
} catch (error) {
  console.error('❌ Manual Migration Failed:', error);
} finally {
  await connection.end();
  process.exit(0);
}
