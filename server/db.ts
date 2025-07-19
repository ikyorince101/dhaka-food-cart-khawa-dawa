import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Debug environment variables
console.log('🔍 Debug: DATABASE_URL from process.env:', process.env.DATABASE_URL);

// Use hardcoded DATABASE_URL for now since we know it works
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.jkvdwxwwafrscenjgkck:dsfjohnyboy123@aws-0-us-east-2.pooler.supabase.com:5432/postgres";

console.log('🔍 Using DATABASE_URL:', DATABASE_URL);

console.log("🔍 Initializing Supabase PostgreSQL connection...");
console.log(`   Database URL: ${DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);

async function createPoolWithInfiniteRetry(delayMs = 2000) {
  let attempt = 0;
  while (true) {
    try {
      const pool = new pg.Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 60000,
      });
      // Test connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Database connection established.');
      return pool;
    } catch (err: any) {
      attempt++;
      console.error(`Database connection failed (attempt ${attempt}, will keep retrying):`, err.message);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

let pool: pg.Pool;
export let db: ReturnType<typeof drizzle>;

(async () => {
  pool = await createPoolWithInfiniteRetry();
  db = drizzle(pool, { schema });

  pool.on('connect', () => {
    console.log('✅ Connected to Supabase PostgreSQL database');
  });
  pool.on('error', (err: any) => {
    console.error('❌ Supabase PostgreSQL pool error:', err);
  });
  pool.on('remove', () => {
    console.log('🔌 Connection removed from pool');
  });
})();

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log("🧪 Testing database connection...");
    
    // Test with a simple query first
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Basic database connection test successful");
    
    // Test with a timestamp query
    const timeResult = await db.execute(sql`SELECT NOW() as current_time`);
    console.log("✅ Database timestamp test successful");
    
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

// Initialize database schema
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log("🔧 Initializing database schema...");
    
    // Import and run working database setup
    const { setupDatabaseWithWorkingConfig } = await import('./working-db-setup');
    
    // Setup database schema using working configuration
    const schemaSetup = await setupDatabaseWithWorkingConfig();
    if (!schemaSetup) {
      throw new Error("Working database setup failed");
    }
    
    // Test connection with Drizzle
    await testDatabaseConnection();
    
    console.log("✅ Database initialization complete");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnections() {
  try {
    console.log("🔌 Closing database connections...");
    if (pool) await pool.end();
    console.log("✅ Database connections closed");
  } catch (error) {
    console.error("❌ Error closing database connections:", error);
  }
}