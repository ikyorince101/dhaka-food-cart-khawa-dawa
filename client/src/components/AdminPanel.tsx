import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, ClipboardList, CheckCircle, Warehouse, MoreVertical, AlertTriangle, ExternalLink, Play, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InventoryManagement } from './InventoryManagement';

export function AdminPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const fetchedOrders = await response.json();
        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');
  const completedOrders = orders.filter(order => order.status === 'served');

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      await fetchOrders();

      const statusMessages: Record<string, string> = {
        preparing: 'Order is now being prepared',
        ready: 'Order is ready for pickup',
        served: 'Order has been served'
      };

      toast({
        title: "Order Updated",
        description: statusMessages[status] || "Order status updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      await fetchOrders();
      toast({
        title: "Order Cancelled",
        description: "The order has been cancelled successfully.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-secondary text-secondary-foreground';
      case 'preparing': return 'bg-warning text-warning-foreground';
      case 'ready': return 'bg-success text-success-foreground';
      case 'served': return 'bg-primary text-primary-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const OrderCard = ({ order, showActions = true }: any) => {
    let orderItems = [];
    try {
      orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    } catch (e) {
      console.error('Error parsing order items:', e);
      orderItems = [];
    }

    return (
      <Card key={order.id} className="shadow-warm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                #{order.queueNumber} - {order.customerName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)} variant="secondary">
              {order.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Items:</h4>
              <ul className="space-y-1">
                {orderItems.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.menuItem?.name || item.name}</span>
                    <span>${((item.menuItem?.price || item.price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold">Total: ${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : parseFloat(order.totalAmount).toFixed(2)}</span>
              {order.customerPhone && (
                <span className="text-sm text-muted-foreground">{order.customerPhone}</span>
              )}
            </div>

            {showActions && order.status !== 'served' && order.status !== 'cancelled' && (
              <div className="flex gap-2 pt-2">
                {order.status === 'pending' && (
                  <Button
                    onClick={() => handleStatusUpdate(order.id, 'preparing')}
                    size="sm"
                    className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start Preparing
                  </Button>
                )}

                {order.status === 'preparing' && (
                  <Button
                    onClick={() => handleStatusUpdate(order.id, 'ready')}
                    size="sm"
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Ready
                  </Button>
                )}

                {order.status === 'ready' && (
                  <Button
                    onClick={() => handleStatusUpdate(order.id, 'served')}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Served
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel order #{order.queueNumber} for {order.customerName}? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Order</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-warm bg-clip-text text-transparent mb-2">
              Restaurant Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Manage orders and kitchen operations
            </p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Active ({pendingOrders.length + preparingOrders.length + readyOrders.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Ready ({readyOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {preparingOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-warning">
                  Currently Preparing ({preparingOrders.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {preparingOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              </div>
            )}

            {pendingOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  New Orders ({pendingOrders.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              </div>
            )}

            {readyOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-success">
                  Ready for Pickup ({readyOrders.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {readyOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              </div>
            )}

            {pendingOrders.length === 0 && preparingOrders.length === 0 && readyOrders.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
                  <p className="text-muted-foreground">All caught up! New orders will appear here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid gap-4 md:grid-cols-2">
              {pendingOrders.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Orders</h3>
                    <p className="text-muted-foreground">New orders will appear here when customers place them.</p>
                  </CardContent>
                </Card>
              ) : (
                pendingOrders.map(order => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="ready">
            <div className="grid gap-4 md:grid-cols-2">
              {readyOrders.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Ready</h3>
                    <p className="text-muted-foreground">Orders ready for pickup will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                readyOrders.map(order => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4 md:grid-cols-2">
              {completedOrders.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Completed Orders</h3>
                    <p className="text-muted-foreground">Served orders will appear here for your records.</p>
                  </CardContent>
                </Card>
              ) : (
                completedOrders.map(order => <OrderCard key={order.id} order={order} showActions={false} />)
              )}
            </div>
          </TabsContent>

        <TabsContent value="inventory">
          <InventoryManagement />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}