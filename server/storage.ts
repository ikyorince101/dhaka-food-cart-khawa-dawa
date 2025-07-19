import { 
  users, 
  orders, 
  customerIssues,
  menuInventory,
  type User, 
  type InsertUser,
  type Order,
  type InsertOrder,
  type CustomerIssue,
  type InsertCustomerIssue,
  type InsertMenuInventory,
  type MenuInventory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, isNull, isNotNull } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomerId(customerId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderCheckIn(id: string): Promise<Order | undefined>;

  // Customer Issues
  createCustomerIssue(issue: InsertCustomerIssue): Promise<CustomerIssue>;
  getCustomerIssues(): Promise<CustomerIssue[]>;
  updateCustomerIssue(id: string, status: string): Promise<CustomerIssue | undefined>;

  // Menu inventory methods
  getMenuInventoryForDate(date: string): Promise<MenuInventory[]>;
  createOrUpdateMenuInventory(data: InsertMenuInventory): Promise<MenuInventory>;
  updateMenuItemAvailability(menuItemId: string, date: string, isAvailable: boolean, availableQuantity?: number): Promise<MenuInventory | undefined>;
  decrementMenuItemQuantity(menuItemId: string, date: string, quantity: number): Promise<MenuInventory | undefined>;
}

// Supabase PostgreSQL Database Storage using Drizzle ORM
export class DatabaseStorage implements IStorage {
  
  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
    } catch (error) {
      console.error("Error getting user by phone:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    try {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
    } catch (error) {
      console.error("Error getting order:", error);
      return undefined;
    }
  }

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    try {
      return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting orders by customer ID:", error);
      return [];
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting all orders:", error);
      return [];
    }
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    try {
      // Generate queue number for today
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = await db.select({ queueNumber: orders.queueNumber })
        .from(orders)
        .where(sql`DATE(${orders.createdAt}) = ${today}`);
      
      const nextQueueNumber = todayOrders.length > 0 
        ? Math.max(...todayOrders.map(o => o.queueNumber)) + 1 
        : 1;

      const orderData = {
        ...insertOrder,
        queueNumber: nextQueueNumber,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.insert(orders).values(orderData).returning();
    return result[0];
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    try {
    const result = await db.update(orders)
        .set({ 
          status, 
          updatedAt: new Date() 
        })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
    } catch (error) {
      console.error("Error updating order status:", error);
      return undefined;
    }
  }

  async updateOrderCheckIn(id: string): Promise<Order | undefined> {
    try {
    const result = await db.update(orders)
        .set({ 
          checkInTime: new Date(),
          updatedAt: new Date() 
        })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
    } catch (error) {
      console.error("Error updating order check-in:", error);
      return undefined;
    }
  }

  // Customer Issues
  async createCustomerIssue(insertIssue: InsertCustomerIssue): Promise<CustomerIssue> {
    try {
    const result = await db.insert(customerIssues).values(insertIssue).returning();
    return result[0];
    } catch (error) {
      console.error("Error creating customer issue:", error);
      throw error;
    }
  }

  async getCustomerIssues(): Promise<CustomerIssue[]> {
    try {
    return await db.select().from(customerIssues).orderBy(desc(customerIssues.createdAt));
    } catch (error) {
      console.error("Error getting customer issues:", error);
      return [];
    }
  }

  async updateCustomerIssue(id: string, status: string): Promise<CustomerIssue | undefined> {
    try {
    const result = await db.update(customerIssues)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(customerIssues.id, id))
      .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating customer issue:", error);
      return undefined;
    }
  }

  // Menu inventory methods
  async getMenuInventoryForDate(date: string): Promise<MenuInventory[]> {
    try {
      const result = await db.select().from(menuInventory).where(eq(menuInventory.date, date));
      
      // If no inventory exists for this date, create default inventory
      if (result.length === 0) {
        console.log(`📋 Creating default menu inventory for ${date}`);
        const defaultItems = [
          { menuItemId: 'fuchka', name: 'Regular Fuchka' },
          { menuItemId: 'doi-fuchka', name: 'Doi Fuchka' },
          { menuItemId: 'panipuri', name: 'Panipuri' },
          { menuItemId: 'bhelpuri', name: 'Bhelpuri' },
          { menuItemId: 'chotpoti', name: 'Chotpoti' },
          { menuItemId: 'jhalmuri', name: 'Jhalmuri' },
          { menuItemId: 'fruit-chaat', name: 'Mango Chaat' },
          { menuItemId: 'guava-chaat', name: 'Guava Chaat' },
          { menuItemId: 'tea', name: 'Chai' },
          { menuItemId: 'mango-lassi', name: 'Mango Lassi' },
          { menuItemId: 'water', name: 'Water' },
          { menuItemId: 'soda', name: 'Soda' },
          { menuItemId: 'singara', name: 'Singara' }
        ];

        const defaultInventory = defaultItems.map(item => ({
          menuItemId: item.menuItemId,
          date: date,
          defaultQuantity: 50,
          availableQuantity: 50,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(menuInventory).values(defaultInventory);
        return await db.select().from(menuInventory).where(eq(menuInventory.date, date));
  }

      return result;
    } catch (error) {
      console.error("Error getting menu inventory:", error);
      return [];
    }
  }

  async createOrUpdateMenuInventory(data: InsertMenuInventory): Promise<MenuInventory> {
    try {
      // Check if inventory exists for this item and date
    const existing = await db.select()
      .from(menuInventory)
      .where(and(
        eq(menuInventory.menuItemId, data.menuItemId),
        eq(menuInventory.date, data.date)
        ))
        .limit(1);

    if (existing.length > 0) {
      // Update existing inventory
      const result = await db.update(menuInventory)
        .set({
          ...data,
          updatedAt: new Date()
        })
          .where(eq(menuInventory.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new inventory
      const result = await db.insert(menuInventory)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        .returning();
      return result[0];
      }
    } catch (error) {
      console.error("Error creating/updating menu inventory:", error);
      throw error;
    }
  }

  async updateMenuItemAvailability(menuItemId: string, date: string, isAvailable: boolean, availableQuantity?: number): Promise<MenuInventory | undefined> {
    try {
    const updateData: any = {
      isAvailable,
      updatedAt: new Date()
    };

    if (availableQuantity !== undefined) {
      updateData.availableQuantity = availableQuantity;
    }

    const result = await db.update(menuInventory)
      .set(updateData)
      .where(and(
        eq(menuInventory.menuItemId, menuItemId),
        eq(menuInventory.date, date)
      ))
      .returning();

      return result[0];
    } catch (error) {
      console.error("Error updating menu item availability:", error);
      return undefined;
    }
  }

  async decrementMenuItemQuantity(menuItemId: string, date: string, quantity: number): Promise<MenuInventory | undefined> {
    try {
      // Get current inventory
    const current = await db.select()
      .from(menuInventory)
      .where(and(
        eq(menuInventory.menuItemId, menuItemId),
        eq(menuInventory.date, date)
        ))
        .limit(1);

      if (current.length === 0) {
        console.warn(`No inventory found for ${menuItemId} on ${date}`);
        return undefined;
      }

    const newQuantity = Math.max(0, current[0].availableQuantity - quantity);
    const isAvailable = newQuantity > 0;

    const result = await db.update(menuInventory)
      .set({
        availableQuantity: newQuantity,
        isAvailable,
        updatedAt: new Date()
      })
        .where(eq(menuInventory.id, current[0].id))
      .returning();

    return result[0];
    } catch (error) {
      console.error("Error decrementing menu item quantity:", error);
      return undefined;
  }
  }
}



// Initialize storage with Supabase PostgreSQL database only
export async function initializeStorage(): Promise<IStorage> {
  console.log("🔍 Initializing database storage...");
  
  try {
    // Import and run database initialization
    const { initializeDatabase, testDatabaseConnection } = await import('./db');
    
    // Initialize database schema
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.warn("⚠️ Database initialization failed, trying to continue with existing tables...");
}

    // Test connection
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest) {
      throw new Error("Database connection test failed");
  }

    console.log("✅ Supabase PostgreSQL database connected successfully");
    
    // Use the DatabaseStorage class that uses Drizzle ORM
    const dbStorage = new DatabaseStorage();
    console.log("✅ Database storage initialized with Supabase PostgreSQL");
    return dbStorage;
    
  } catch (error) {
    console.error("❌ Supabase PostgreSQL database connection failed");
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    throw new Error("Database connection is required. Please check your DATABASE_URL configuration.");
  }
}

// Global storage instance
let storage: IStorage;

// Initialize storage and export it
initializeStorage().then(initializedStorage => {
  storage = initializedStorage;
}).catch(error => {
  console.error("Failed to initialize storage:", error);
  throw error; // Re-throw the error since we don't have fallback storage
});

export { storage };