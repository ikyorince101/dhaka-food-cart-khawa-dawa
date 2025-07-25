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
        
        // Check for test orders
        const testOrders = JSON.parse(localStorage.getItem('test_orders') || '[]');
        if (testOrders.length > 0) {
          setHasOrders(true);
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
        <div className="text-center">Loading...</div>
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
          
          <Card className="shadow-warm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-warm bg-clip-text text-transparent flex items-center justify-center gap-2">
                <Lock className="h-6 w-6" />
                Access Required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
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

  return <OrderQueue />;
}