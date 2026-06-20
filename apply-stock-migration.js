const sqlite3 = require('sqlite3');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log('Detected PostgreSQL database configuration. Connecting to Supabase...');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('Connected to Postgres.');

      // Check if stock column exists
      const checkColQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Products' AND column_name = 'stock'
      `;
      const checkRes = await client.query(checkColQuery);

      if (checkRes.rows.length === 0) {
        console.log('Adding "stock" column to PostgreSQL "Products" table...');
        await client.query('ALTER TABLE "Products" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 100');
        console.log('Successfully added "stock" column to PostgreSQL.');
      } else {
        console.log('"stock" column already exists in PostgreSQL "Products" table.');
      }
    } catch (err) {
      console.error('PostgreSQL Migration Error:', err);
    } finally {
      await client.end();
    }
  }

  // Also migrate SQLite database.sqlite if it exists locally to make sure dev environment is updated
  const sqliteDbPath = process.env.DATABASE || 'database.sqlite';
  console.log(`Checking SQLite database at: ${sqliteDbPath}...`);
  
  const db = new sqlite3.Database(sqliteDbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
      return;
    }
    
    db.all('PRAGMA table_info(Products)', (err, rows) => {
      if (err) {
        console.error('Error reading Products table info in SQLite:', err);
        db.close();
        return;
      }
      
      const hasStock = rows.some(col => col.name === 'stock');
      if (!hasStock) {
        console.log('Adding "stock" column to SQLite "Products" table...');
        db.run('ALTER TABLE Products ADD COLUMN stock INTEGER NOT NULL DEFAULT 100', (err) => {
          if (err) {
            console.error('Error adding stock column to SQLite:', err);
          } else {
            console.log('Successfully added "stock" column to SQLite.');
          }
          db.close();
        });
      } else {
        console.log('"stock" column already exists in SQLite "Products" table.');
        db.close();
      }
    });
  });
}

runMigration().catch(console.error);
