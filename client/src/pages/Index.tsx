import React, { useState, useEffect } from 'react';
import { MenuCard } from '@/components/MenuCard';
import { CartFloat } from '@/components/CartFloat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';

export default function MenuSection({ selectedCategory }) {
  const { availableMenuItems, dispatch } = useApp();

  // Fetch inventory on component mount
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/menu-inventory/${today}`);
        if (response.ok) {
          const inventory = await response.json();
          dispatch({ type: 'SET_INVENTORY', payload: inventory });
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    };

    fetchInventory();
  }, [dispatch]);

  const filteredItems = availableMenuItems.filter(item => 
    (selectedCategory === 'all' || item.category === selectedCategory) && item.available
  );

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

import { useApp, MENU_ITEMS } from '@/contexts/AppContext';
import { MenuCard } from '@/components/MenuCard';
import { CartFloat } from '@/components/CartFloat';
import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';

export default function Index() {
  const { cart, availableMenuItems } = useApp();

  const categories = ['snacks', 'beverages', 'main'] as const;

  const getMenuItemsByCategory = (category: string) => {
    return availableMenuItems.filter(item => item.category === category);
  };

  const snackItems = getMenuItemsByCategory('snacks');
  const beverageItems = getMenuItemsByCategory('beverages');

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-background to-secondary">

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Street Food Paradise
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience the authentic flavors of Dhaka's vibrant street food culture. 
            Fresh ingredients, traditional recipes, and the warmth of Bengali hospitality.
          </p>

          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary" className="bg-success/10 text-success">
              ✓ Fresh Daily
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              ✓ Authentic Recipes
            </Badge>
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              ✓ Quick Service
            </Badge>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          {/* Street Snacks */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Street Snacks & Chaats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {snackItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Beverages */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Refreshing Beverages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {beverageItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </section>

        {/* Floating Cart */}
        <CartFloat />
      </div>
    </AppLayout>
  );
};