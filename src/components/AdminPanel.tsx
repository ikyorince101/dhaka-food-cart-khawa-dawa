import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ClipboardList, Clock, CheckCircle, XCircle, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminPanel() {
  const { orders, dispatch } = useApp();
  const { toast } = useToast();

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');
  const completedOrders = orders.filter(order => order.status === 'served');

  const handleStatusUpdate = (orderId: string, status: any) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
    
    const statusMessages = {
      'preparing': 'Order is now being prepared',
      'ready': 'Order is ready for pickup',
      'served': 'Order has been served'
    };
    
    toast({
      title: "Order Updated",
      description: statusMessages[status] || "Order status updated",
    });
  };

  const handleCancelOrder = (orderId: string) => {
    dispatch({ type: 'CANCEL_ORDER', payload: orderId });
    toast({
      title: "Order Cancelled",
      description: "The order has been cancelled successfully.",
      variant: "destructive",
    });
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

  const OrderCard = ({ order, showActions = true }: any) => (
    <Card key={order.id} className="shadow-warm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              #{order.queueNumber} - {order.customerName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(order.orderTime).toLocaleString()}
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
              {order.items.map((item: any, index: number) => (
                <li key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.menuItem.name}</span>
                  <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Total: ${order.totalAmount.toFixed(2)}</span>
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
                  <Button
                    size="sm"
                    variant="destructive"
                  >
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-warm bg-clip-text text-transparent mb-2">
            Restaurant Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage orders and kitchen operations
          </p>
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
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {/* Preparing Orders */}
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

            {/* Pending Orders */}
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

            {/* Ready Orders */}
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
        </Tabs>
      </div>
    </div>
  );
}