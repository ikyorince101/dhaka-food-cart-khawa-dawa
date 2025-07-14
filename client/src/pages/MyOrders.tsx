import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Package, LogOut, RefreshCw } from 'lucide-react';
import { ReportIssueModal } from '@/components/ReportIssueModal';

interface Order {
  id: string;
  items: any;
  customerName: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  queueNumber: number;
  estimatedTime: number;
  createdAt: string;
  checkInTime: string | null;
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedOrderForIssue, setSelectedOrderForIssue] = useState<Order | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      const parsedUser = JSON.parse(userSession);
      setUser(parsedUser);
      fetchOrders(parsedUser.id);
      return;
    }
    navigate('/auth');
  };

  const fetchOrders = async (userId: string) => {
    try {
      const response = await fetch(`/api/orders?customerId=${userId}`);
      
      if (response.ok) {
        const fetchedOrders = await response.json();
        setOrders(fetchedOrders);
      } else {
        console.error('Failed to fetch orders from API');
        setOrders([]);
      }
    } catch (error: any) {
      console.error('Fetch orders error:', error);
      toast({
        title: "Error",
        description: "Failed to load your orders. Please try again.",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('user_session');
    navigate('/');
  };

  const handleCheckIn = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/checkin`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast({
          title: "Checked In!",
          description: "You've been checked in! Your order will be served shortly.",
        });
        
        if (user) {
          fetchOrders(user.id);
        }
      } else {
        throw new Error('Failed to check in');
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'preparing': return 'bg-primary text-primary-foreground';
      case 'ready': return 'bg-success text-success-foreground';
      case 'served': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'served': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatOrderItems = (items: any) => {
    try {
      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (e) {
      console.error('Error parsing order items:', e);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading your orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 hover:bg-accent rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold">My Orders</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.full_name || user?.phone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => user && fetchOrders(user.id)} 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <ThemeToggle />
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet. Start browsing our delicious menu!
              </p>
              <Link to="/">
                <Button>Browse Menu</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderItems = formatOrderItems(order.items);
              return (
                <Card key={order.id} className="shadow-warm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.queueNumber}
                        </CardTitle>
                        <CardDescription>
                          Placed on {new Date(order.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)} variant="secondary">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-2">Items Ordered:</h4>
                      <div className="space-y-1">
                        {orderItems.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.menuItem?.name || item.name}</span>
                            <span>${((item.menuItem?.price || item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Order Summary */}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total: ${order.totalAmount.toFixed(2)}</span>
                      <div className="text-sm text-muted-foreground">
                        Est. time: {order.estimatedTime} min
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {order.status === 'ready' && !order.checkInTime && (
                        <Button
                          onClick={() => handleCheckIn(order.id)}
                          className="bg-success hover:bg-success/90 text-success-foreground"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          I'm Here!
                        </Button>
                      )}
                      
                      {order.status !== 'cancelled' && order.status !== 'served' && (
                        <Button
                          onClick={() => setSelectedOrderForIssue(order)}
                          variant="outline"
                          size="sm"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                      )}
                    </div>

                    {/* Check-in Status */}
                    {order.checkInTime && (
                      <div className="bg-success/10 text-success p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">
                            Checked in at {new Date(order.checkInTime).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      {selectedOrderForIssue && (
        <ReportIssueModal
          isOpen={!!selectedOrderForIssue}
          onClose={() => setSelectedOrderForIssue(null)}
          order={selectedOrderForIssue}
          onIssueReported={() => {
            setSelectedOrderForIssue(null);
            if (user) fetchOrders(user.id);
          }}
        />
      )}
    </div>
  );
}