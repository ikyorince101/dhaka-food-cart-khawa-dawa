import pg from 'pg';

const { Pool } = pg;

export async function simpleDatabaseInit(): Promise<boolean> {
  console.log('🔧 Simple database initialization...');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Create tables one by one
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email text,
        phone text NOT NULL UNIQUE,
        full_name text,
        created_at timestamp with time zone DEFAULT now()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id uuid REFERENCES users(id) ON DELETE SET NULL,
        items jsonb NOT NULL,
        customer_name text NOT NULL,
        customer_phone text,
        total_amount decimal(10,2) NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        queue_number integer NOT NULL,
        estimated_time integer DEFAULT 0,
        payment_status text DEFAULT 'pending',
        payment_method text,
        check_in_time timestamp with time zone,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_issues (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id uuid REFERENCES users(id) ON DELETE SET NULL,
        order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
        issue_type text NOT NULL,
        description text NOT NULL,
        status text DEFAULT 'open',
        priority text DEFAULT 'medium',
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_inventory (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        menu_item_id text NOT NULL,
        date text NOT NULL,
        default_quantity integer NOT NULL DEFAULT 50,
        available_quantity integer NOT NULL,
        is_available boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        UNIQUE(menu_item_id, date)
      )
    `);

    // Add some test data
    const today = new Date().toISOString().split('T')[0];
    await client.query(`
      INSERT INTO menu_inventory (menu_item_id, date, default_quantity, available_quantity, is_available)
      VALUES ('fuchka', $1, 50, 50, true)
      ON CONFLICT (menu_item_id, date) DO NOTHING
    `, [today]);

    await client.query(`
      INSERT INTO users (phone, full_name, email)
      VALUES ('+1234567890', 'Test User', 'test@example.com')
      ON CONFLICT (phone) DO NOTHING
    `);

    client.release();
    await pool.end();
    
    console.log('✅ Simple database initialization complete');
    return true;
    
  } catch (error) {
    console.error('❌ Simple database initialization failed:', error);
    return false;
  }
} 