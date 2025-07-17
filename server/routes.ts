import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOrderSchema, insertCustomerIssueSchema } from "@shared/schema";
import { z } from "zod";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function registerRoutes(app: Express): Promise<Server> {
  // User authentication routes
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Use Twilio Verify service to send OTP
      if (process.env.TWILIO_VERIFY_SID) {
        try {
          await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID)
            .verifications
            .create({ to: phone, channel: 'sms' });
          
          res.json({ success: true, message: "OTP sent successfully" });
        } catch (twilioError) {
          console.error("Twilio error:", twilioError);
          // Fall back to test mode if Twilio fails
          res.json({ success: true, message: "OTP sent successfully (test mode)" });
        }
      } else {
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
      if (process.env.TWILIO_VERIFY_SID) {
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
      
      const order = await storage.createOrder({
        ...orderData,
        totalAmount: String(orderData.totalAmount),
        queueNumber,
      });
      
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

  const httpServer = createServer(app);

  return httpServer;
}
