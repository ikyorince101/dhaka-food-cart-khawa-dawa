import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CartFloat() {
  const { cart, dispatch } = useApp();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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
    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to place the order.",
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

    dispatch({ 
      type: 'PLACE_ORDER', 
      payload: { customerName, customerPhone: customerPhone || undefined } 
    });

    toast({
      title: "Order Placed!",
      description: `Your order has been placed successfully. Queue number will be announced shortly.`,
    });

    setCustomerName('');
    setCustomerPhone('');
    setIsOpen(false);
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
                  <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Your phone number"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-warm hover:opacity-90 text-primary-foreground shadow-warm"
                size="lg"
              >
                Place Order - ${totalAmount.toFixed(2)}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}