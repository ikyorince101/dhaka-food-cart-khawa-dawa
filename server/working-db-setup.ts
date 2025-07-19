import pg from 'pg';

const { Pool } = pg;

export async function setupDatabaseWithWorkingConfig(): Promise<boolean> {
  console.log('🔧 Setting up database with working configuration...');
  
  try {
    // Use the exact same configuration as our working test script
    const pool = new Pool({
      connectionString: "postgresql://postgres.jkvdwxwwafrscenjgkck:dsfjohnyboy123@aws-0-us-east-2.pooler.supabase.com:5432/postgres",
      ssl: { 
        rejectUnauthorized: false 
      },
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 60000,
    });

    // Test connection first (same as our working test)
    const client = await pool.connect();
    console.log('✅ Raw connection successful');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    // Create UUID extension if not exists
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension ready');
    
    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email text,
        phone text NOT NULL UNIQUE,
        full_name text,
        created_at timestamp with time zone DEFAULT now()
      )
    `);
    console.log('✅ Users table ready');
    
    // Create orders table if not exists
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
    console.log('✅ Orders table ready');
    
    // Create customer_issues table if not exists
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
    console.log('✅ Customer issues table ready');
    
    // Create menu_inventory table if not exists
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
    console.log('✅ Menu inventory table ready');
    
    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_queue_number ON orders(queue_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_menu_inventory_date ON menu_inventory(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_customer_issues_status ON customer_issues(status)');
    console.log('✅ Database indexes ready');
    
    // Initialize menu inventory for today with default items if none exists
    const today = new Date().toISOString().split('T')[0];
    const MENU_ITEMS = [
      { id: 'fuchka', name: 'Regular Fuchka' },
      { id: 'doi-fuchka', name: 'Doi Fuchka' },
      { id: 'panipuri', name: 'Panipuri' },
      { id: 'bhelpuri', name: 'Bhelpuri' },
      { id: 'chotpoti', name: 'Chotpoti' },
      { id: 'jhalmuri', name: 'Jhalmuri' },
      { id: 'fruit-chaat', name: 'Mango Chaat' },
      { id: 'guava-chaat', name: 'Guava Chaat' },
      { id: 'tea', name: 'Chai' },
      { id: 'mango-lassi', name: 'Mango Lassi' },
      { id: 'water', name: 'Water' },
      { id: 'soda', name: 'Soda' },
      { id: 'singara', name: 'Singara' }
    ];

    for (const item of MENU_ITEMS) {
      await client.query(`
        INSERT INTO menu_inventory (menu_item_id, date, default_quantity, available_quantity, is_available)
        VALUES ($1, $2, 50, 50, true)
        ON CONFLICT (menu_item_id, date) DO NOTHING
      `, [item.id, today]);
    }
    console.log('✅ Menu inventory initialized for today');
    
    // Create a test user for development if none exists
    await client.query(`
      INSERT INTO users (phone, full_name, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (phone) DO NOTHING
    `, ['+1234567890', 'Test User', 'test@example.com']);
    console.log('✅ Test user ready');
    
    client.release();
    await pool.end();
    
    console.log('✅ Working database setup finished successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Working database setup failed:', error);
    return false;
  }
} 