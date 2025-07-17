export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'snacks' | 'beverages' | 'main';
  description?: string;
  available: boolean;
  availableQuantity?: number;
  defaultQuantity?: number;
}

export interface MenuInventory {
  id: string;
  menuItemId: string;
  date: string;
  defaultQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  totalAmount: number | string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  orderTime: Date;
  estimatedTime: number; // in minutes
  queueNumber: number;
}

export interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: { item: MenuItem; quantity: number; revenue: number }[];
  dailySales: { date: string; sales: number; orders: number }[];
  hourlyDistribution: { hour: number; orders: number }[];
}

export type UserRole = 'customer' | 'admin' | 'owner';