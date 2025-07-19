import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderQueue } from '@/components/OrderQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Queue() {
  const [user, setUser] = useState<any>(null);
  const [hasOrders, setHasOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // Check for user session first (test or real user)
      const userSession = localStorage.getItem('user_session');
      if (userSession) {
        const parsedUser = JSON.parse(userSession);
        setUser(parsedUser);
        
        // Check for real orders from backend
        try {
          const response = await fetch(`/api/orders?customerId=${parsedUser.id}`);
          if (response.ok) {
            const orders = await response.json();
            if (orders.length > 0) {
              setHasOrders(true);
            }
          }
        } catch (e) {
          // fallback to test orders if backend fails
        const testOrders = JSON.parse(localStorage.getItem('test_orders') || '[]');
        if (testOrders.length > 0) {
          setHasOrders(true);
          }
        }
        setLoading(false);
        return;
      }

      // Check for legacy test user
      const testUser = localStorage.getItem('test_user');
      if (testUser) {
        const parsedTestUser = JSON.parse(testUser);
        setUser(parsedTestUser);
        
        // Check for test orders
        const testOrders = JSON.parse(localStorage.getItem('test_orders') || '[]');
        if (testOrders.length > 0) {
          setHasOrders(true);
        }
        setLoading(false);
        return;
      }

      // No authenticated user found
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-warm bg-clip-text text-transparent mb-4">Live Order Queue</h1>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || !hasOrders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Link>
          </div>
          <Card className="shadow-warm border-2 border-warning/40 bg-card/80">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-warm bg-clip-text text-transparent flex items-center justify-center gap-2">
                <Lock className="h-6 w-6 text-warning" />
                Access Required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-lg font-medium">
                {!user 
                  ? "You need to be logged in to view the order queue."
                  : "You need to place an order first to access the live queue."
                }
              </p>
              <div className="space-y-2">
                {!user ? (
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="w-full bg-gradient-warm hover:opacity-90"
                  >
                    Sign In
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/')}
                    className="w-full bg-gradient-warm hover:opacity-90"
                  >
                    Place an Order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex flex-col items-center justify-start p-4">
      <div className="w-full max-w-2xl mt-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Link>
          <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <Button variant="outline" size="sm">Home</Button>
          </Link>
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Live Order Queue</h1>
          <p className="text-muted-foreground text-lg">Track your order status and see your position in the queue in real time.</p>
        </div>
        <Card className="shadow-warm border-2 border-primary/30 bg-card/90">
          <CardContent className="p-6">
            <OrderQueue />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}