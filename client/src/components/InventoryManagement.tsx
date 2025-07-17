
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { MENU_ITEMS } from '@/contexts/AppContext';
import { MenuInventory } from '@/types';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

export function InventoryManagement() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [inventory, setInventory] = useState<MenuInventory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [selectedDate]);

  useEffect(() => {
    // Auto-initialize inventory if it's empty for today
    if (isToday && inventory.length === 0) {
      createDefaultInventory();
    }
  }, [inventory, isToday]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/menu-inventory/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultInventory = async () => {
    const promises = MENU_ITEMS.map(item => {
      const existingInventory = inventory.find(inv => inv.menuItemId === item.id);
      if (!existingInventory) {
        return fetch('/api/menu-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menuItemId: item.id,
            date: selectedDate,
            defaultQuantity: 50,
            availableQuantity: 50,
            isAvailable: true
          })
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    fetchInventory();
  };

  const adjustQuantity = async (menuItemId: string, change: number) => {
    const itemInventory = getInventoryForItem(menuItemId);
    if (!itemInventory) return;

    const newQuantity = Math.max(0, itemInventory.availableQuantity + change);
    await updateQuantity(menuItemId, newQuantity);
  };

  const updateAvailability = async (menuItemId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/menu-inventory/${menuItemId}/${selectedDate}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      });
      
      if (response.ok) {
        fetchInventory();
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const updateQuantity = async (menuItemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/menu-inventory/${menuItemId}/${selectedDate}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          availableQuantity: quantity,
          isAvailable: quantity > 0
        })
      });
      
      if (response.ok) {
        fetchInventory();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const getInventoryForItem = (menuItemId: string) => {
    return inventory.find(inv => inv.menuItemId === menuItemId);
  };

  const getStatusBadge = (item: any, itemInventory: MenuInventory | undefined) => {
    if (!itemInventory) {
      return <Badge variant="secondary">Not Set</Badge>;
    }
    
    if (!itemInventory.isAvailable) {
      return <Badge variant="destructive">Unavailable</Badge>;
    }
    
    if (itemInventory.availableQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    
    if (itemInventory.availableQuantity < 10) {
      return <Badge variant="outline" className="border-warning text-warning">Low Stock</Badge>;
    }
    
    return <Badge variant="default" className="bg-success text-success-foreground">Available</Badge>;
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isToday = selectedDate === getTodayDate();
  const isPast = new Date(selectedDate) < new Date(getTodayDate());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Menu Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
              {isPast && (
                <p className="text-sm text-muted-foreground mt-1">
                  Viewing past date - changes will not affect current availability
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button 
                onClick={createDefaultInventory}
                disabled={loading}
                variant="outline"
              >
                Initialize Today's Inventory
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading inventory...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MENU_ITEMS.map((item) => {
                const itemInventory = getInventoryForItem(item.id);
                
                return (
                  <Card key={item.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} • {item.category}
                          </p>
                        </div>
                        {getStatusBadge(item, itemInventory)}
                      </div>

                      {itemInventory && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`available-${item.id}`}>Available Today</Label>
                            <Switch
                              id={`available-${item.id}`}
                              checked={itemInventory.isAvailable}
                              onCheckedChange={(checked) => updateAvailability(item.id, checked)}
                              disabled={isPast}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustQuantity(item.id, -1)}
                                disabled={!itemInventory.isAvailable || isPast || itemInventory.availableQuantity <= 0}
                                className="h-8 w-8 p-0"
                              >
                                -
                              </Button>
                              <div className="flex-1 text-center font-medium">
                                {itemInventory.availableQuantity} / {itemInventory.defaultQuantity}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustQuantity(item.id, 1)}
                                disabled={!itemInventory.isAvailable || isPast}
                                className="h-8 w-8 p-0"
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          {itemInventory.availableQuantity < 10 && itemInventory.isAvailable && (
                            <div className="flex items-center gap-2 text-warning text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              Low stock warning
                            </div>
                          )}
                        </div>
                      )}

                      {!itemInventory && (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            No inventory set for this date
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={createDefaultInventory}
                          >
                            Initialize
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
