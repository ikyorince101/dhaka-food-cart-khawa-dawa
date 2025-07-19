import { db } from './db';
import { sql } from 'drizzle-orm';

export async function setupDatabaseSchema(): Promise<boolean> {
  console.log('🔧 Setting up database schema...');
  
  try {
    // Create UUID extension if not exists
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✅ UUID extension ready');
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email text,
        phone text NOT NULL UNIQUE,
        full_name text,
        created_at timestamp with time zone DEFAULT now()
      )
    `);
    console.log('✅ Users table created/verified');
    
    // Create orders table
    await db.execute(sql`
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
    console.log('✅ Orders table created/verified');
    
    // Create customer_issues table
    await db.execute(sql`
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
    console.log('✅ Customer issues table created/verified');
    
    // Create menu_inventory table
    await db.execute(sql`
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
    console.log('✅ Menu inventory table created/verified');
    
    console.log('✅ Database schema setup complete');
    return true;
    
  } catch (error) {
    console.error('❌ Database schema setup failed:', error);
    return false;
  }
} 