import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from './src/infrastructure/database/db.js';

async function runMigrate() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
  process.exit(0);
}

runMigrate();
