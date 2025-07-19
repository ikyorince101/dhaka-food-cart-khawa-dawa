import { pgTable, text, serial, integer, boolean, uuid, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  phone: text("phone").notNull(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => users.id),
  items: jsonb("items").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'preparing', 'ready', 'served', 'cancelled'
  queueNumber: integer("queue_number").notNull(),
  estimatedTime: integer("estimated_time").default(0),
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  paymentMethod: text("payment_method"),
  checkInTime: timestamp("check_in_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer issues table
export const customerIssues = pgTable("customer_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => users.id),
  orderId: uuid("order_id").references(() => orders.id),
  issueType: text("issue_type").notNull(), // 'wrong_order', 'quality_issue', 'missing_items', 'late_delivery', 'other'
  description: text("description").notNull(),
  status: text("status").default("open"), // 'open', 'investigating', 'resolved', 'closed'
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu inventory table for tracking daily availability
export const menuInventory = pgTable("menu_inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuItemId: text("menu_item_id").notNull(), // references the MenuItem id from frontend
  date: text("date").notNull(), // format: YYYY-MM-DD
  defaultQuantity: integer("default_quantity").notNull().default(50),
  availableQuantity: integer("available_quantity").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  phone: true,
  fullName: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerId: true,
  items: true,
  customerName: true,
  customerPhone: true,
  totalAmount: true,
  queueNumber: true,
  estimatedTime: true,
  paymentMethod: true,
}).extend({
  totalAmount: z.string().or(z.number()).transform((val) => String(val)),
});

export const insertCustomerIssueSchema = createInsertSchema(customerIssues).pick({
  customerId: true,
  orderId: true,
  issueType: true,
  description: true,
  priority: true,
});

export const insertMenuInventorySchema = createInsertSchema(menuInventory).pick({
  menuItemId: true,
  date: true,
  defaultQuantity: true,
  availableQuantity: true,
  isAvailable: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertCustomerIssue = z.infer<typeof insertCustomerIssueSchema>;
export type CustomerIssue = typeof customerIssues.$inferSelect;
export type InsertMenuInventory = z.infer<typeof insertMenuInventorySchema>;
export type MenuInventory = typeof menuInventory.$inferSelect;
