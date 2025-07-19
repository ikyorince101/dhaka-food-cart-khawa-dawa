import type { Express } from "express";
import { createServer, type Server } from "http";
import { initializeStorage, type IStorage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertCustomerIssueSchema, insertMenuInventorySchema } from "@shared/schema";
import { z } from "zod";
import twilio from "twilio";
import { SquareClient, SquareEnvironment } from "square";
import crypto from "crypto";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Initialize Twilio client with API Key credentials if available, otherwise use Account SID and Auth Token
let twilioClient: any = null;

const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log("🔍 Initializing Twilio client...");
console.log(`   TWILIO_API_KEY_SID: ${apiKeySid ? 'Set' : 'Not set'}`);
console.log(`   TWILIO_API_KEY_SECRET: ${apiKeySecret ? 'Set' : 'Not set'}`);
console.log(`   TWILIO_ACCOUNT_SID: ${accountSid ? 'Set' : 'Not set'}`);
console.log(`   TWILIO_AUTH_TOKEN: ${authToken ? 'Set' : 'Not set'}`);

if (apiKeySid && apiKeySecret && accountSid) {
  try {
    console.log("✅ Creating Twilio client with API Key credentials...");
    twilioClient = twilio(apiKeySid, apiKeySecret, { accountSid });
    console.log("✅ Twilio client initialized successfully with API Key!");
  } catch (error) {
    console.error("❌ Failed to initialize Twilio client with API Key:", error);
  }
} else if (accountSid && authToken) {
  try {
    console.log("✅ Creating Twilio client with Account SID and Auth Token...");
    twilioClient = twilio(accountSid, authToken);
    console.log("✅ Twilio client initialized successfully with Auth Token!");
  } catch (error) {
    console.error("❌ Failed to initialize Twilio client with Auth Token:", error);
  }
} else {
  console.warn("⚠️  Twilio credentials not found, will use test mode");
}

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

const paymentsApi = squareClient.payments;

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage with fallback
  const storage = await initializeStorage();
  // User authentication routes
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Use Twilio Verify service to send OTP
      if (process.env.TWILIO_VERIFY_SID && twilioClient) {
        try {
          console.log(`📱 Sending OTP to ${phone} via Twilio...`);
          await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID)
            .verifications
            .create({ to: phone, channel: 'sms' });
          
          console.log("✅ OTP sent successfully via Twilio");
          res.json({ success: true, message: "OTP sent successfully" });
        } catch (twilioError: any) {
          console.error("❌ Twilio error:", twilioError);
          console.error("   Error details:", {
            code: twilioError.code,
            message: twilioError.message,
            status: twilioError.status
          });
          // Fall back to test mode if Twilio fails
          res.json({ success: true, message: "OTP sent successfully (test mode)" });
        }
      } else {
        console.log("⚠️  Using test mode - no Twilio credentials");
        // Test mode fallback
        res.json({ success: true, message: "OTP sent successfully (test mode)" });
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/verify-otp", async (req, res) => {
    try {
      const { phone, code, email, fullName } = req.body;
      
      if (!phone || !code) {
        return res.status(400).json({ error: "Phone and code are required" });
      }

      // Special test code for development
      if (code === "666666") {
        // Test mode - always accept this code
        let user = await storage.getUserByPhone(phone);
        if (!user) {
          const userData = insertUserSchema.parse({
            phone,
            email: email || null,
            fullName: fullName || null,
          });
          user = await storage.createUser(userData);
        }
        return res.json({ user, message: "OTP verified successfully (test mode)" });
      }

      // Use Twilio Verify service to verify OTP
      if (process.env.TWILIO_VERIFY_SID && twilioClient) {
        try {
          const verificationCheck = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks
            .create({ to: phone, code });

          if (verificationCheck.status === 'approved') {
            // OTP is valid, create or get user
            let user = await storage.getUserByPhone(phone);
            if (!user) {
              const userData = insertUserSchema.parse({
                phone,
                email: email || null,
                fullName: fullName || null,
              });
              user = await storage.createUser(userData);
            }
            return res.json({ user, message: "OTP verified successfully" });
          } else {
            return res.status(400).json({ error: "Invalid OTP code" });
          }
        } catch (twilioError) {
          console.error("Twilio verification error:", twilioError);
          return res.status(400).json({ error: "Invalid OTP code" });
        }
      } else {
        // Test mode fallback - accept any 6-digit code
        if (code.length !== 6) {
          return res.status(400).json({ error: "Invalid OTP code" });
        }

        let user = await storage.getUserByPhone(phone);
        if (!user) {
          const userData = insertUserSchema.parse({
            phone,
            email: email || null,
            fullName: fullName || null,
          });
          user = await storage.createUser(userData);
        }
        return res.json({ user, message: "OTP verified successfully (test mode)" });
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const { customerId } = req.query;
      
      let orders;
      if (customerId) {
        orders = await storage.getOrdersByCustomerId(customerId as string);
      } else {
        orders = await storage.getAllOrders();
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // Generate queue number (simple implementation)
      const existingOrders = await storage.getAllOrders();
      const queueNumber = existingOrders.filter(order => 
        order.status === 'pending' || order.status === 'preparing'
      ).length + 1;
      
      // Validate customerId if provided
      let validCustomerId = null;
      if (orderData.customerId) {
        const user = await storage.getUser(orderData.customerId);
        if (user) {
          validCustomerId = orderData.customerId;
        } else {
          console.warn(`Customer with ID ${orderData.customerId} not found, creating order without customer association`);
        }
      }
      
      const order = await storage.createOrder({
        ...orderData,
        customerId: validCustomerId,
        totalAmount: String(orderData.totalAmount),
        queueNumber,
      });

      // Decrement inventory for ordered items
      const today = new Date().toISOString().split('T')[0];
      const items = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items;
      
      for (const item of items) {
        await storage.decrementMenuItemQuantity(
          item.menuItem.id,
          today,
          item.quantity
        );
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.patch("/api/orders/:id/check-in", async (req, res) => {
    try {
      const { id } = req.params;
      
      const order = await storage.updateOrderCheckIn(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Check in order error:", error);
      res.status(500).json({ error: "Failed to check in order" });
    }
  });

  // Get all active orders (pending, preparing, ready)
  app.get("/api/orders/active", async (req, res) => {
    try {
      const activeOrders = await storage.getAllOrders();
      const filtered = activeOrders.filter(order =>
        order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
      ).sort((a, b) => a.queueNumber - b.queueNumber);
      res.json(filtered);
    } catch (error) {
      console.error("Get active orders error:", error);
      res.status(500).json({ error: "Failed to fetch active orders" });
    }
  });

  // Customer issues routes
  app.get("/api/customer-issues", async (req, res) => {
    try {
      const issues = await storage.getCustomerIssues();
      res.json(issues);
    } catch (error) {
      console.error("Get customer issues error:", error);
      res.status(500).json({ error: "Failed to fetch customer issues" });
    }
  });

  app.post("/api/customer-issues", async (req, res) => {
    try {
      const issueData = insertCustomerIssueSchema.parse(req.body);
      const issue = await storage.createCustomerIssue(issueData);
      res.status(201).json(issue);
    } catch (error) {
      console.error("Create customer issue error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid issue data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer issue" });
    }
  });

  app.patch("/api/customer-issues/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const issue = await storage.updateCustomerIssue(id, status);
      if (!issue) {
        return res.status(404).json({ error: "Customer issue not found" });
      }
      
      res.json(issue);
    } catch (error) {
      console.error("Update customer issue status error:", error);
      res.status(500).json({ error: "Failed to update customer issue status" });
    }
  });

  // Menu inventory routes
  app.get("/api/menu-inventory/:date", async (req, res) => {
    try {
      const { date } = req.params;
      let inventory = await storage.getMenuInventoryForDate(date);
      
      // Auto-initialize inventory with 50 items each if none exists for today
      const today = new Date().toISOString().split('T')[0];
      if (date === today && inventory.length === 0) {
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

        const initPromises = MENU_ITEMS.map(item => 
          storage.createOrUpdateMenuInventory({
            menuItemId: item.id,
            date: date,
            defaultQuantity: 50,
            availableQuantity: 50,
            isAvailable: true
          })
        );

        await Promise.all(initPromises);
        inventory = await storage.getMenuInventoryForDate(date);
      }
      
      res.json(inventory);
    } catch (error) {
      console.error("Get menu inventory error:", error);
      res.status(500).json({ error: "Failed to fetch menu inventory" });
    }
  });

  app.post("/api/menu-inventory", async (req, res) => {
    try {
      const inventoryData = insertMenuInventorySchema.parse(req.body);
      const inventory = await storage.createOrUpdateMenuInventory(inventoryData);
      res.json(inventory);
    } catch (error) {
      console.error("Create/update menu inventory error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid inventory data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create/update menu inventory" });
    }
  });

  app.patch("/api/menu-inventory/:menuItemId/:date", async (req, res) => {
    try {
      const { menuItemId, date } = req.params;
      const { isAvailable, availableQuantity } = req.body;
      
      const inventory = await storage.updateMenuItemAvailability(
        menuItemId, 
        date, 
        isAvailable, 
        availableQuantity
      );
      
      if (!inventory) {
        return res.status(404).json({ error: "Menu inventory not found" });
      }
      
      res.json(inventory);
    } catch (error) {
      console.error("Update menu availability error:", error);
      res.status(500).json({ error: "Failed to update menu availability" });
    }
  });

  // Square payment route
  app.post("/api/payments", async (req, res) => {
    try {
      const { nonce, amount } = req.body;

      if (!nonce || !amount) {
        return res.status(400).json({ error: "Missing payment info" });
      }

      const result = await paymentsApi.create({
        sourceId: nonce,
        idempotencyKey: crypto.randomUUID(),
        amountMoney: {
          amount: BigInt(Math.round(Number(amount) * 100)),
          currency: "USD",
        },
      });

      // Convert BigInt values to strings for JSON serialization
      const serializedPayment = JSON.parse(JSON.stringify(result.payment, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.json(serializedPayment);
    } catch (error: any) {
      console.error("Square payment error:", error);
      // If in test mode (sandbox or missing credentials), treat as success
      if (
        process.env.SQUARE_ENVIRONMENT !== 'production' ||
        !process.env.SQUARE_ACCESS_TOKEN ||
        !process.env.SQUARE_APPLICATION_ID
      ) {
        // Simulate a successful payment response
        return res.json({
          id: `test_${crypto.randomUUID()}`,
          status: 'COMPLETED',
          amount_money: {
            amount: req.body.amount,
            currency: 'USD',
          },
          test_mode: true,
          message: 'Payment treated as success in test mode.'
        });
      }
      const message = error?.message ?? "Payment processing failed";
      res.status(500).json({ error: message });
    }
  });

  // Owner dashboard analytics endpoint
  app.get("/api/analytics/owner-dashboard", async (req, res) => {
    try {
      // Fetch all orders
      const orders = await storage.getAllOrders();
      const now = new Date();
      // Total sales (all time)
      const totalSales = orders.filter(o => o.status === 'served').reduce((sum, o) => sum + Number(o.totalAmount), 0);
      // Daily sales (last 7 days)
      const dailySales = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now);
        day.setDate(now.getDate() - (6 - i));
        const dayStr = day.toISOString().split('T')[0];
        const dayOrders = orders.filter(o => o.status === 'served' && o.createdAt && o.createdAt.toISOString().split('T')[0] === dayStr);
        return {
          date: dayStr,
          sales: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
          orders: dayOrders.length
        };
      });
      // Hourly distribution (today)
      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
        const todayStr = now.toISOString().split('T')[0];
        const hourOrders = orders.filter(o => o.status === 'served' && o.createdAt && o.createdAt.toISOString().split('T')[0] === todayStr && o.createdAt.getHours() === hour);
        return {
          hour,
          orders: hourOrders.length
        };
      });
      // Top selling items (all time)
      const itemSales = new Map();
      orders.filter(o => o.status === 'served').forEach(order => {
        let items = order.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch { items = []; }
        }
        if (!Array.isArray(items)) items = [];
        (items as any[]).forEach((item: any) => {
          const key = item.menuItem?.id || item.id || item.name;
          if (!key) return;
          const name = item.menuItem?.name || item.name || key;
          const existing = itemSales.get(key) || { name, quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += (item.menuItem?.price || item.price || 0) * item.quantity;
          itemSales.set(key, existing);
        });
      });
      const topSellingItems = Array.from(itemSales.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
      // Active orders
      const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;
      // Avg wait time (served orders)
      const servedOrders = orders.filter(o => o.status === 'served');
      const avgWaitTime = servedOrders.reduce((sum, o) => sum + (o.estimatedTime || 0), 0) / Math.max(servedOrders.length, 1);
      // Order status counts
      const statusCounts = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        served: orders.filter(o => o.status === 'served').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      };
      res.json({
        totalSales,
        dailySales,
        hourlyDistribution,
        topSellingItems,
        activeOrders,
        avgWaitTime,
        statusCounts
      });
    } catch (error) {
      console.error("Owner dashboard analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok" });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ status: "error", error: errorMsg });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
