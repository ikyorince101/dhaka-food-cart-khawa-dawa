import dotenv from "dotenv";

console.log('Testing environment variables in app context...');

console.log('Before dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

dotenv.config();

console.log('After dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Test the exact same connection as our working test
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
console.log('Using DATABASE_URL:', DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false 
  },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
});

async function testConnection() {
  try {
    console.log('Attempting to connect with app context...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testConnection(); 