-- Street Food Ordering Application Database Schema
-- This file can be run directly in Supabase SQL editor

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone varchar(20) NOT NULL UNIQUE,
  full_name varchar(100),
  role varchar(20) NOT NULL DEFAULT 'customer',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create customers table  
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone varchar(20) NOT NULL UNIQUE,
  full_name varchar(100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id),
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

-- Create menu_inventory table
CREATE TABLE IF NOT EXISTS menu_inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id varchar(50) NOT NULL,
  date date NOT NULL,
  available_quantity integer NOT NULL DEFAULT 100,
  sold_quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(menu_item_id, date)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id varchar(100) PRIMARY KEY,
  order_id uuid REFERENCES orders(id),
  amount varchar(20) NOT NULL,
  payment_method varchar(20) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_queue_number ON orders(queue_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_inventory_date ON menu_inventory(date);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Insert some test data
INSERT INTO menu_inventory (menu_item_id, date, available_quantity, sold_quantity) 
VALUES 
  ('fuchka', CURRENT_DATE, 100, 0),
  ('jhalmuri', CURRENT_DATE, 100, 0),
  ('chotpoti', CURRENT_DATE, 100, 0),
  ('fruit-chaat', CURRENT_DATE, 100, 0),
  ('mango-lassi', CURRENT_DATE, 100, 0),
  ('tea', CURRENT_DATE, 100, 0)
ON CONFLICT (menu_item_id, date) DO NOTHING;