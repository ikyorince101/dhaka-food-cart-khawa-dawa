#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const { Pool } = pg;

// Test the connection string from environment variable
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.jkvdwxwwafrscenjgkck:dsfjohnyboy123@aws-0-us-east-2.pooler.supabase.com:5432/postgres";

console.log('Testing database connection...');
console.log('DATABASE_URL:', DATABASE_URL);

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
    console.log('Attempting to connect...');
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