import React from 'react';
import { MenuItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const { cart, dispatch } = useApp();
  const { toast } = useToast();

  const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (!item.available) {
      toast({
        title: "Item Unavailable", 
        description: `${item.name} is currently not available.`,
        variant: "destructive",
      });
      return;
    }

    // Check available quantity if it exists
    if (item.availableQuantity !== undefined && item.availableQuantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${item.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }
    dispatch({ type: 'ADD_TO_CART', payload: { menuItem: item, quantity: 1 } });
  };

  const handleRemoveFromCart = () => {
    if (quantity === 1) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: item.id });
    } else {
      dispatch({ type: 'ADD_TO_CART', payload: { menuItem: item, quantity: -1 } });
    }
  };

  return (
    <Card className="overflow-hidden shadow-warm hover:shadow-spice transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <div className="aspect-square overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
          {!item.available && (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-primary">
            ${item.price.toFixed(2)}
          </span>

          {item.available && (
            quantity > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemoveFromCart}
                  className="h-8 w-8 p-0 rounded-full border-primary/20 hover:bg-primary/10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-primary min-w-[20px] text-center">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  className="h-8 w-8 p-0 rounded-full bg-gradient-warm hover:opacity-90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAddToCart}
                className="bg-gradient-warm hover:opacity-90 text-primary-foreground shadow-warm"
              >
                Add to Cart
              </Button>
            )
          )}
        </div>

        {!item.available && (
          <p className="text-sm text-muted-foreground mt-2">
            Currently unavailable
          </p>
        )}
      </CardContent>
    </Card>
  );
}