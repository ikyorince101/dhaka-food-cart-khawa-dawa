import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, CheckCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function OrderQueue() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      setUser(JSON.parse(userSession));
    }
  }, []);

  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders/active');
        if (response.ok) {
          const fetchedOrders = await response.json();
          setAllOrders(fetchedOrders);
        }
      } catch (error) {
        console.error('Failed to fetch active orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading queue...</div>;
  }

  if (!user) {
    return <div className="text-center py-8">Please log in to view your order status.</div>;
  }

  // Find the user's active order(s)
  const userOrders = allOrders.filter(order => order.customerId === user.id);
  const userOrder = userOrders[0]; // Assume one active order per user for now

  // Orders ahead: orders with lower queueNumber and not served/cancelled
  const ordersAhead = userOrder
    ? allOrders.filter(order => order.queueNumber < userOrder.queueNumber).length
    : 0;

  return (
    <div className="max-w-xl mx-auto mt-8 p-4 bg-card rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Live Order Queue</h2>
      {userOrder ? (
        <div className="space-y-4">
          <div className="text-lg">
            <strong>Your Order:</strong> Queue #{userOrder.queueNumber}
        </div>
          <div>Status: <span className="font-semibold">{userOrder.status}</span></div>
          {userOrder.status === 'ready' ? (
            <div className="text-success font-bold">Your order is ready for pickup!</div>
            ) : (
            <div>Orders ahead of you: <span className="font-semibold">{ordersAhead}</span></div>
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">You have no active orders in the queue.</div>
      )}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Current Queue</h3>
        <ul className="space-y-2">
          {allOrders.map(order => (
            <li key={order.id} className={`flex justify-between items-center p-2 rounded ${order.customerId === user.id ? 'bg-primary/10' : 'bg-muted/50'}`}>
              <span>#{order.queueNumber} - {order.customerName || 'Customer'}</span>
              <span className="text-sm">{order.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}