#!/usr/bin/env python3
"""
Python Database Service for Street Food Ordering App
Provides REST API endpoints for database operations since Python connects successfully to Supabase
"""
import os
import json
import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Street Food DB Service", version="1.0.0")

# Database connection - use hardcoded working connection string
DATABASE_URL = "postgresql://postgres.jkvdwxwwafrscenjgkck:U6w$UE_X-F$B7hC@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
print("Using verified PostgreSQL connection string")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# Pydantic models
class OrderCreate(BaseModel):
    customerId: Optional[str] = None
    items: str
    customerName: str
    customerPhone: str
    totalAmount: str
    paymentMethod: str
    queueNumber: Optional[int] = None
    estimatedTime: int = 0

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    paymentStatus: Optional[str] = None
    checkInTime: Optional[str] = None

class MenuInventoryUpdate(BaseModel):
    availableQuantity: Optional[int] = None
    soldQuantity: Optional[int] = None

# Initialize database schema
@app.on_event("startup")
async def startup_event():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                phone varchar(20) NOT NULL UNIQUE,
                full_name varchar(100),
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id varchar(100) PRIMARY KEY,
                order_id uuid REFERENCES orders(id),
                amount varchar(20) NOT NULL,
                payment_method varchar(20) NOT NULL,
                status varchar(20) NOT NULL DEFAULT 'pending',
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );
        """)
        
        # Initialize menu inventory for today
        today = date.today()
        menu_items = ['fuchka', 'jhalmuri', 'chotpoti', 'fruit-chaat', 'mango-lassi', 'tea']
        for item in menu_items:
            cursor.execute("""
                INSERT INTO menu_inventory (menu_item_id, date, available_quantity, sold_quantity)
                VALUES (%s, %s, 100, 0)
                ON CONFLICT (menu_item_id, date) DO NOTHING
            """, (item, today))
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✓ Database schema initialized successfully")
        
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")

# Health check
@app.get("/health")
async def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Orders endpoints
@app.get("/orders")
async def get_orders():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM orders 
            ORDER BY created_at DESC
        """)
        orders = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(order) for order in orders]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orders")
async def create_order(order: OrderCreate):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate queue number
        cursor.execute("SELECT COALESCE(MAX(queue_number), 0) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE")
        queue_number = cursor.fetchone()[0]
        
        # Create order
        order_id = str(uuid.uuid4())
        customer_id = order.customerId if order.customerId and order.customerId != "" else None
        
        cursor.execute("""
            INSERT INTO orders (id, customer_id, items, customer_name, customer_phone, 
                              total_amount, payment_method, queue_number, estimated_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (order_id, customer_id, order.items, order.customerName, order.customerPhone,
              order.totalAmount, order.paymentMethod, queue_number, order.estimatedTime))
        
        created_order = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return dict(created_order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/orders/{order_id}")
async def update_order(order_id: str, update: OrderUpdate):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        update_fields = []
        values = []
        
        if update.status is not None:
            update_fields.append("status = %s")
            values.append(update.status)
        if update.paymentStatus is not None:
            update_fields.append("payment_status = %s")
            values.append(update.paymentStatus)
        if update.checkInTime is not None:
            update_fields.append("check_in_time = %s")
            values.append(update.checkInTime)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = now()")
        values.append(order_id)
        
        query = f"UPDATE orders SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
        cursor.execute(query, values)
        
        updated_order = cursor.fetchone()
        if not updated_order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return dict(updated_order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Menu inventory endpoints
@app.get("/menu-inventory/{date}")
async def get_menu_inventory(date: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM menu_inventory 
            WHERE date = %s
            ORDER BY menu_item_id
        """, (date,))
        inventory = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(item) for item in inventory]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/menu-inventory/{inventory_id}")
async def update_menu_inventory(inventory_id: str, update: MenuInventoryUpdate):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        update_fields = []
        values = []
        
        if update.availableQuantity is not None:
            update_fields.append("available_quantity = %s")
            values.append(update.availableQuantity)
        if update.soldQuantity is not None:
            update_fields.append("sold_quantity = %s")
            values.append(update.soldQuantity)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = now()")
        values.append(inventory_id)
        
        query = f"UPDATE menu_inventory SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
        cursor.execute(query, values)
        
        updated_item = cursor.fetchone()
        if not updated_item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return dict(updated_item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Payments endpoints
@app.post("/payments")
async def create_payment(payment_data: dict):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO payments (id, order_id, amount, payment_method, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """, (payment_data['id'], payment_data.get('orderId'), payment_data['amount'],
              payment_data['paymentMethod'], payment_data.get('status', 'pending')))
        
        created_payment = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return dict(created_payment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)