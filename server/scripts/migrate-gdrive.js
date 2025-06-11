import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateGoogleDrive() {
  try {
    console.log('Running Google Drive migration...');
    
    const migrationPath = path.join(__dirname, '../migrations/001_add_gdrive_tables.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migration);
    console.log('Google Drive migration completed successfully!');
    
  } catch (error) {
    console.error('Google Drive migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateGoogleDrive();