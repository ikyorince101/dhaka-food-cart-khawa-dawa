import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { MenuItem, CartItem, Order, SalesData, UserRole } from '@/types';
import fuchkaImg from '@/assets/fuchka.jpg';
import chotpotiImg from '@/assets/chotpoti.jpg';
import jhalmuri from '@/assets/jhalmuri.jpg';
import mangoLassi from '@/assets/mango-lassi.jpg';
import teaImg from '@/assets/tea.jpg';
import fruitChaat from '@/assets/fruit-chaat.jpg';

// Menu data
export const MENU_ITEMS: MenuItem[] = [
  { id: 'fuchka', name: 'Regular Fuchka', price: 8.00, image: fuchkaImg, category: 'snacks', available: true },
  { id: 'doi-fuchka', name: 'Doi Fuchka', price: 8.00, image: fuchkaImg, category: 'snacks', available: true },
  { id: 'panipuri', name: 'Panipuri', price: 8.00, image: fuchkaImg, category: 'snacks', available: true },
  { id: 'bhelpuri', name: 'Bhelpuri', price: 8.00, image: jhalmuri, category: 'snacks', available: true },
  { id: 'chotpoti', name: 'Chotpoti', price: 8.00, image: chotpotiImg, category: 'snacks', available: true },
  { id: 'jhalmuri', name: 'Jhalmuri', price: 7.00, image: jhalmuri, category: 'snacks', available: true },
  { id: 'fruit-chaat', name: 'Mango Chaat', price: 7.00, image: fruitChaat, category: 'snacks', available: true },
  { id: 'guava-chaat', name: 'Guava Chaat', price: 7.00, image: fruitChaat, category: 'snacks', available: true },
  { id: 'tea', name: 'Chai', price: 1.50, image: teaImg, category: 'beverages', available: true },
  { id: 'mango-lassi', name: 'Mango Lassi', price: 3.50, image: mangoLassi, category: 'beverages', available: true },
  { id: 'water', name: 'Water', price: 1.00, image: teaImg, category: 'beverages', available: true },
  { id: 'soda', name: 'Soda', price: 2.00, image: teaImg, category: 'beverages', available: true },
  { id: 'singara', name: 'Singara', price: 2.50, image: chotpotiImg, category: 'snacks', available: true },
];

// Dummy orders for testing
const DUMMY_ORDERS: Order[] = [
  {
    id: 'order-1',
    items: [
      { menuItem: MENU_ITEMS[0], quantity: 2, specialInstructions: 'Extra spicy' },
      { menuItem: MENU_ITEMS[8], quantity: 1 }
    ],
    customerName: 'Rahul Ahmed',
    customerPhone: '+880123456789',
    totalAmount: 17.50,
    status: 'preparing',
    orderTime: new Date(Date.now() - 10 * 60 * 1000),
    estimatedTime: 5,
    queueNumber: 1
  },
  {
    id: 'order-2',
    items: [
      { menuItem: MENU_ITEMS[4], quantity: 1 },
      { menuItem: MENU_ITEMS[9], quantity: 2 }
    ],
    customerName: 'Fatima Khan',
    totalAmount: 15.00,
    status: 'pending',
    orderTime: new Date(Date.now() - 5 * 60 * 1000),
    estimatedTime: 8,
    queueNumber: 2
  },
  {
    id: 'order-3',
    items: [
      { menuItem: MENU_ITEMS[6], quantity: 3 },
    ],
    customerName: 'Hassan Ali',
    totalAmount: 21.00,
    status: 'ready',
    orderTime: new Date(Date.now() - 15 * 60 * 1000),
    estimatedTime: 0,
    queueNumber: 3
  }
];

interface AppState {
  cart: CartItem[];
  orders: Order[];
  currentUser: { role: UserRole; name: string };
  isDarkMode: boolean;
  menuInventory: MenuInventory[];
  availableMenuItems: MenuItem[];
}

type AppAction = 
  | { type: 'ADD_TO_CART'; payload: { menuItem: MenuItem; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'PLACE_ORDER'; payload: { customerName: string; customerPhone?: string } }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
  | { type: 'CANCEL_ORDER'; payload: string }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_USER_ROLE'; payload: UserRole }
  | { type: 'SET_INVENTORY'; payload: MenuInventory[] };

const getAvailableMenuItems = (inventory: MenuInventory[]): MenuItem[] => {
  const today = new Date().toISOString().split('T')[0];

  return MENU_ITEMS.map(item => {
    const todayInventory = inventory.find(inv => 
      inv.menuItemId === item.id && inv.date === today
    );

    if (todayInventory) {
      return {
        ...item,
        available: todayInventory.isAvailable && todayInventory.availableQuantity > 0,
        availableQuantity: todayInventory.availableQuantity,
        defaultQuantity: todayInventory.defaultQuantity
      };
    }

    // Default to available if no inventory record exists
    return { ...item, available: true };
  });
};

const initialState: AppState = {
  cart: [],
  orders: DUMMY_ORDERS,
  currentUser: { role: 'customer', name: 'Guest' },
  isDarkMode: false,
  menuInventory: [],
  availableMenuItems: MENU_ITEMS,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.menuItem.id === action.payload.menuItem.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.menuItem.id === action.payload.menuItem.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return {
        ...state,
        cart: [...state.cart, { menuItem: action.payload.menuItem, quantity: action.payload.quantity }]
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.menuItem.id !== action.payload)
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'PLACE_ORDER':
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        items: [...state.cart],
        customerName: action.payload.customerName,
        customerPhone: action.payload.customerPhone,
        totalAmount: state.cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
        status: 'pending',
        orderTime: new Date(),
        estimatedTime: Math.ceil(state.cart.length * 3 + Math.random() * 5),
        queueNumber: state.orders.length + 1
      };
      return {
        ...state,
        orders: [...state.orders, newOrder],
        cart: []
      };

    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status, estimatedTime: action.payload.status === 'ready' ? 0 : order.estimatedTime }
            : order
        )
      };

    case 'CANCEL_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload
            ? { ...order, status: 'cancelled' }
            : order
        )
      };

    case 'TOGGLE_THEME':
      return { ...state, isDarkMode: !state.isDarkMode };

    case 'SET_USER_ROLE':
      return {
        ...state,
        currentUser: { 
          ...state.currentUser, 
          role: action.payload,
          name: action.payload === 'admin' ? 'Admin' : action.payload === 'owner' ? 'Owner' : 'Guest'
        }
      };

    case 'SET_INVENTORY':
      return {
        ...state,
        menuInventory: action.payload,
        availableMenuItems: getAvailableMenuItems(action.payload)
      };

    default:
      return state;
  }
}

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  getSalesData: () => SalesData;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const getSalesData = (): SalesData => {
    const completedOrders = state.orders.filter(order => order.status === 'served');
    const totalSales = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate top selling items
    const itemSales = new Map<string, { item: MenuItem; quantity: number; revenue: number }>();
    completedOrders.forEach(order => {
      order.items.forEach(cartItem => {
        const key = cartItem.menuItem.id;
        const existing = itemSales.get(key);
        if (existing) {
          existing.quantity += cartItem.quantity;
          existing.revenue += Number(cartItem.menuItem.price) * cartItem.quantity;
        } else {
          itemSales.set(key, {
            item: cartItem.menuItem,
            quantity: cartItem.quantity,
            revenue: Number(cartItem.menuItem.price) * cartItem.quantity
          });
        }
      });
    });

    const topSellingItems = Array.from(itemSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Mock daily sales data
    const dailySales = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
      sales: Math.random() * 500 + 200,
      orders: Math.floor(Math.random() * 20 + 10)
    })).reverse();

    // Mock hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: hour >= 11 && hour <= 22 ? Math.floor(Math.random() * 15 + 5) : Math.floor(Math.random() * 3)
    }));

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topSellingItems,
      dailySales,
      hourlyDistribution
    };
  };

  return (
    <AppContext.Provider value={{ ...state, dispatch, getSalesData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

interface MenuInventory {
    menuItemId: string;
    date: string;
    isAvailable: boolean;
    availableQuantity: number;
    defaultQuantity: number;
}

const fetchTodayInventory = async (): Promise<MenuInventory[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/menu-inventory/${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const inventory = await response.json();

      // Auto-initialize if empty (this will be handled by the server now)
      return inventory;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
  };