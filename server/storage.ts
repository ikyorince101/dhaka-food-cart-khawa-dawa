import { 
  users, 
  orders, 
  customerIssues,
  type User, 
  type InsertUser,
  type Order,
  type InsertOrder,
  type CustomerIssue,
  type InsertCustomerIssue
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(insertOrder).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async updateOrderCheckIn(id: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ checkInTime: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  // Customer Issues
  async createCustomerIssue(insertIssue: InsertCustomerIssue): Promise<CustomerIssue> {
    const result = await db.insert(customerIssues).values(insertIssue).returning();
    return result[0];
  }

  async getCustomerIssues(): Promise<CustomerIssue[]> {
    return await db.select().from(customerIssues).orderBy(desc(customerIssues.createdAt));
  }

  async updateCustomerIssue(id: string, status: string): Promise<CustomerIssue | undefined> {
    const result = await db.update(customerIssues)
      .set({ status, updatedAt: new Date() })
      .where(eq(customerIssues.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
