import React, { useState } from 'react';
import { PaymentModal } from '@/components/PaymentModal';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus, X, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export function CartFloat() {
  const { cart, dispatch } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    const checkUser = async () => {
      // Check for user session first (test or real user)
      const userSession = localStorage.getItem('user_session');
      if (userSession) {
        const parsedUser = JSON.parse(userSession);
        setUser(parsedUser);
        setCustomerName(parsedUser.full_name || parsedUser.user_metadata?.full_name || '');
        setCustomerPhone(parsedUser.phone || parsedUser.user_metadata?.phone || '');
        return;
      }

      // Check for legacy test user
      const testUser = localStorage.getItem('test_user');
      if (testUser) {
        const parsedTestUser = JSON.parse(testUser);
        setUser(parsedTestUser);
        setCustomerName(parsedTestUser.user_metadata?.full_name || '');
        setCustomerPhone(parsedTestUser.user_metadata?.phone || '');
        return;
      }

      // Check Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        setCustomerName(session.user.user_metadata?.full_name || '');
        // Load profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setCustomerName(profile.full_name || '');
          setCustomerPhone(profile.phone || '');
        }
      }
    };
    checkUser();
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = cart.find(cartItem => cartItem.menuItem.id === itemId);
    if (!item) return;

    if (change < 0 && item.quantity === 1) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
    } else {
      dispatch({ 
        type: 'ADD_TO_CART', 
        payload: { menuItem: item.menuItem, quantity: change } 
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const handlePlaceOrder = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to place an order.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to place the order.",
        variant: "destructive",
      });
      return;
    }

    if (!customerPhone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to receive order updates.",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive",
      });
      return;
    }

    // Show payment modal instead of placing order directly
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Check if it's a test user (either legacy or new format)
      const userSession = localStorage.getItem('user_session');
      const testUser = localStorage.getItem('test_user');
      
      if (userSession || testUser) {
        // For test users, create a simple order object and store in localStorage
        const currentUser = userSession ? JSON.parse(userSession) : JSON.parse(testUser!);
        const testOrder = {
          id: 'test-order-' + Date.now(),
          customer_id: currentUser.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          items: cart,
          total_amount: totalAmount,
          status: 'preparing',
          queue_number: Math.floor(Math.random() * 50) + 1,
          estimated_time: Math.ceil(cart.length * 3 + Math.random() * 5),
          payment_status: 'completed',
          payment_method: paymentData.method,
          created_at: new Date().toISOString(),
          check_in_time: null
        };

        // Store test order
        const existingOrders = JSON.parse(localStorage.getItem('test_orders') || '[]');
        existingOrders.push(testOrder);
        localStorage.setItem('test_orders', JSON.stringify(existingOrders));

        toast({
          title: "Test Order Placed!",
          description: "Your test order has been placed. Go to 'My Orders' to see it and test the 'I'm Here' button.",
        });

        // Clear form and close modals
        setCustomerName(currentUser.full_name || currentUser.user_metadata?.full_name || '');
        setCustomerPhone('');
        setIsOpen(false);
        setShowPayment(false);
        
        // Clear cart
        dispatch({ type: 'CLEAR_CART' });
        return;
      }

      // Regular Supabase user flow
      if (user) {
        // Save order to database for logged-in users
        const { error } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            items: JSON.stringify(cart),
            customer_name: customerName,
            customer_phone: customerPhone || null,
            total_amount: totalAmount,
            status: 'pending',
            queue_number: Math.floor(Math.random() * 100) + 1,
            estimated_time: Math.ceil(cart.length * 3 + Math.random() * 5),
            payment_status: 'completed',
            payment_method: paymentData.method,
          });

        if (error) throw error;
      } else {
        // For guest users, use the existing context method
        dispatch({ 
          type: 'PLACE_ORDER', 
          payload: { customerName, customerPhone: customerPhone || undefined } 
        });
      }

      toast({
        title: "Order Placed!",
        description: `Your order has been placed successfully. ${user ? 'Check "My Orders" to track it.' : 'Queue number will be announced shortly.'}`,
      });

      // Clear form and close modals
      setCustomerName(user?.user_metadata?.full_name || '');
      setCustomerPhone('');
      setIsOpen(false);
      setShowPayment(false);
      
      // Clear cart
      dispatch({ type: 'CLEAR_CART' });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (totalItems === 0) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-warm hover:opacity-90 shadow-spice text-primary-foreground z-50"
          size="lg"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-warning text-warning-foreground text-xs">
              {totalItems}
            </Badge>
          </div>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-sm">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold bg-gradient-warm bg-clip-text text-transparent">
            Your Order
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Your cart is empty
            </p>
          ) : (
            <>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.menuItem.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.menuItem.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.menuItem.price.toFixed(2)} each
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(item.menuItem.id, -1)}
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleQuantityChange(item.menuItem.id, 1)}
                        className="h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.menuItem.id)}
                        className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="bg-gradient-warm bg-clip-text text-transparent">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {user ? (
                  <>
                    <div className="bg-primary/10 rounded-lg p-4 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Logged in as {user.email}</span>
                      </div>
                      <p className="text-muted-foreground">
                        Your order will be saved to your account for tracking.
                      </p>
                      <Button
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto"
                        onClick={() => navigate('/my-orders')}
                      >
                        View My Orders →
                      </Button>
                    </div>
                    
                    <div>
                      <Label htmlFor="customerName">Your Name *</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customerPhone">Phone Number *</Label>
                      <Input
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Your phone number"
                        className="mt-1"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Required to receive order updates
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-3">
                      Please login to place an order and track your food!
                    </p>
                    <Button 
                      onClick={() => navigate('/auth')}
                      className="w-full bg-gradient-warm hover:opacity-90"
                    >
                      Login to Order
                    </Button>
                  </div>
                )}
              </div>

              <Button 
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-warm hover:opacity-90 text-primary-foreground shadow-warm"
                size="lg"
                disabled={!user}
              >
                {user ? `Continue to Payment - $${totalAmount.toFixed(2)}` : 'Login Required'}
              </Button>
            </>
          )}
        </div>
      </SheetContent>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          cartItems={cart}
          totalAmount={totalAmount}
          customerName={customerName}
          customerPhone={customerPhone}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Sheet>
  );
}