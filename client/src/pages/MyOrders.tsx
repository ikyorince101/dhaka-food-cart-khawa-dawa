import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Package, LogOut } from 'lucide-react';
import { ReportIssueModal } from '@/components/ReportIssueModal';

interface Order {
  id: string;
  items: any;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
  queue_number: number;
  estimated_time: number;
  created_at: string;
  check_in_time: string | null;
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
    // Check for user session
    const userSession = localStorage.getItem('user_session');
    if (userSession) {
      const parsedUser = JSON.parse(userSession);
      setUser(parsedUser);
      fetchOrders(parsedUser.id);
      return;
    }

    // Check for legacy test user
    const testUser = localStorage.getItem('test_user');
    if (testUser) {
      const parsedTestUser = JSON.parse(testUser);
      setUser(parsedTestUser);
      fetchTestOrders();
      return;
    }

    navigate('/auth');
  };

  const fetchTestOrders = () => {
    try {
      const testOrders = JSON.parse(localStorage.getItem('test_orders') || '[]');
      setOrders(testOrders);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load test orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (userId: string) => {
    try {
      const response = await fetch(`/api/orders?customerId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data || []);
    } catch (error: any) {
      console.error('Fetch orders error:', error);
      // Fall back to test orders if API fails
      fetchTestOrders();
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    // Clear all user data
    localStorage.removeItem('test_user');
    localStorage.removeItem('test_orders');
    localStorage.removeItem('user_session');
    navigate('/');
  };

  const handleCheckIn = async (orderId: string) => {
    try {
      // Check if it's a test order
      const testOrders = JSON.parse(localStorage.getItem('test_orders') || '[]');
      const testOrderIndex = testOrders.findIndex((order: any) => order.id === orderId);
      
      if (testOrderIndex !== -1) {
        // Handle test order check-in
        testOrders[testOrderIndex].check_in_time = new Date().toISOString();
        localStorage.setItem('test_orders', JSON.stringify(testOrders));
        
        toast({
          title: "Checked In!",
          description: "Test check-in successful! Your order will be served shortly.",
        });
        
        // Refresh test orders
        fetchTestOrders();
        return;
      }

      // Handle real API order check-in
      const response = await fetch(`/api/orders/${orderId}/check-in`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check in');
      }

      toast({
        title: "Checked In!",
        description: "Your order will be served shortly.",
      });

      // Refresh orders
      if (user) {
        fetchOrders(user.id);
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in.",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <h1 className="text-xl font-bold bg-gradient-warm bg-clip-text text-transparent">
                My Orders
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring our delicious menu and place your first order!
              </p>
              <Link to="/">
                <Button className="bg-gradient-warm hover:opacity-90">
                  Browse Menu
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-warm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Queue #{order.queue_number}
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Ordered on {new Date(order.created_at).toLocaleDateString()} at{' '}
                        {new Date(order.created_at).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-warm bg-clip-text text-transparent">
                        ${order.total_amount}
                      </p>
                      {order.estimated_time > 0 && order.status !== 'served' && (
                        <p className="text-sm text-muted-foreground">
                          ~{order.estimated_time} min remaining
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>Payment Status:</span>
                    <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Check-in button for preparing orders */}
                    {order.status === 'preparing' && !order.check_in_time && (
                      <Button
                        className="bg-gradient-warm hover:opacity-90"
                        size="sm"
                        onClick={() => handleCheckIn(order.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        I'm Here
                      </Button>
                    )}

                    {/* Show check-in time if checked in */}
                    {order.check_in_time && (
                      <Badge variant="secondary" className="text-xs">
                        Checked in at {new Date(order.check_in_time).toLocaleTimeString()}
                      </Badge>
                    )}

                    {/* Report issue button for completed/cancelled orders */}
                    {(order.status === 'served' || order.status === 'cancelled') && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderForIssue(order)}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
            toast({
              title: "Issue Reported",
              description: "We've received your report and will investigate it promptly.",
            });
          }}
        />
      )}
    </div>
  );
}