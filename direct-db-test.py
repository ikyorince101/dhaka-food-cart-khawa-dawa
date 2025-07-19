#!/usr/bin/env python3
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import uuid

# Direct connection test and schema setup
DB_URL = "postgresql://postgres.jkvdwxwwafrscenjgkck:U6w$UE_X-F$B7hC@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

def setup_database():
    try:
        conn = psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("✓ Connected to database successfully")
        
        # Create tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id uuid,
                items text NOT NULL,
                customer_name varchar(100) NOT NULL,
                customer_phone varchar(20) NOT NULL,
                total_amount varchar(20) NOT NULL,
                status varchar(20) NOT NULL DEFAULT 'pending',
                queue_number integer NOT NULL,
                estimated_time integer NOT NULL DEFAULT 0,
                payment_status varchar(20) NOT NULL DEFAULT 'pending',
                payment_method varchar(20) NOT NULL DEFAULT 'card',
                check_in_time timestamp with time zone,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_inventory (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                menu_item_id varchar(50) NOT NULL,
                date date NOT NULL,
                available_quantity integer NOT NULL DEFAULT 100,
                sold_quantity integer NOT NULL DEFAULT 0,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now(),
                UNIQUE(menu_item_id, date)
            );
        """)
        
        # Initialize menu inventory
        from datetime import date
        today = date.today()
        menu_items = ['fuchka', 'jhalmuri', 'chotpoti', 'fruit-chaat', 'mango-lassi', 'tea']
        for item in menu_items:
            cursor.execute("""
                INSERT INTO menu_inventory (menu_item_id, date, available_quantity, sold_quantity)
                VALUES (%s, %s, 100, 0)
                ON CONFLICT (menu_item_id, date) DO NOTHING
            """, (item, today))
        
        # Test creating an order
        cursor.execute("""
            INSERT INTO orders (items, customer_name, customer_phone, total_amount, payment_method, queue_number)
            VALUES (%s, %s, %s, %s, %s, 1)
            RETURNING *
        """, ('Test items', 'Test Customer', '1234567890', '10.00', 'card'))
        
        order = cursor.fetchone()
        print("✓ Test order created:", dict(order))
        
        # Get all orders
        cursor.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5")
        orders = cursor.fetchall()
        print(f"✓ Found {len(orders)} orders in database")
        
        # Get menu inventory
        cursor.execute("SELECT * FROM menu_inventory WHERE date = %s", (today,))
        inventory = cursor.fetchall()
        print(f"✓ Found {len(inventory)} inventory items for today")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"✗ Database setup failed: {e}")
        return False

if __name__ == "__main__":
    setup_database()