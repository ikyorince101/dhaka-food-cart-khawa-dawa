#!/usr/bin/env python3
"""
Simplified Python Database Service
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import uuid
from datetime import datetime, date
from typing import Optional, List

app = FastAPI(title="Street Food DB Service", version="1.0.0")

# Direct database connection
DATABASE_URL = "postgresql://postgres.jkvdwxwwafrscenjgkck:U6w$UE_X-F$B7hC@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

class OrderCreate(BaseModel):
    customerId: Optional[str] = None
    items: str
    customerName: str
    customerPhone: str
    totalAmount: str
    paymentMethod: str
    queueNumber: Optional[int] = None
    estimatedTime: int = 0

@app.get("/health")
async def health():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders")
async def get_orders():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
        orders = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(order) for order in orders]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orders")
async def create_order(order: OrderCreate):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get next queue number
        cursor.execute("SELECT COALESCE(MAX(queue_number), 0) + 1 FROM orders WHERE DATE(created_at) = CURRENT_DATE")
        queue_number = cursor.fetchone()[0]
        
        # Create order
        cursor.execute("""
            INSERT INTO orders (customer_id, items, customer_name, customer_phone, 
                              total_amount, payment_method, queue_number, estimated_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            order.customerId if order.customerId else None,
            order.items, order.customerName, order.customerPhone,
            order.totalAmount, order.paymentMethod, queue_number, order.estimatedTime
        ))
        
        new_order = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return dict(new_order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/menu-inventory/{date}")
async def get_menu_inventory(date: str):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM menu_inventory WHERE date = %s", (date,))
        inventory = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(item) for item in inventory]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)