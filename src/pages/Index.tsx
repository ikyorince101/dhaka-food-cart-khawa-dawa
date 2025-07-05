import React from 'react';
import { useApp, MENU_ITEMS } from '@/contexts/AppContext';
import { MenuCard } from '@/components/MenuCard';
import { CartFloat } from '@/components/CartFloat';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSelector } from '@/components/RoleSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Monitor, Users, TrendingUp } from 'lucide-react';

const Index = () => {
  const { currentUser } = useApp();

  const snackItems = MENU_ITEMS.filter(item => item.category === 'snacks');
  const beverageItems = MENU_ITEMS.filter(item => item.category === 'beverages');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Mobile-Friendly Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          {/* Main header row */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-warm bg-clip-text text-transparent truncate">
                Dhaka Street Food
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Authentic Bengali street flavors 🍛
              </p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              
              {/* Customer Login Button */}
              {currentUser.role === 'customer' && (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    Login
                  </Button>
                </Link>
              )}
              
              {/* Role selector for non-customers - hidden on mobile */}
              <div className="hidden sm:block">
                <RoleSelector />
              </div>
              
              {/* Quick Access Buttons - Responsive */}
              {currentUser.role !== 'customer' && (
                <div className="flex gap-1 sm:gap-2">
                  <Link to="/queue">
                    <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                      <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Queue</span>
                    </Button>
                  </Link>
                  
                  {currentUser.role === 'admin' && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Admin</span>
                      </Button>
                    </Link>
                  )}
                  
                  {currentUser.role === 'owner' && (
                    <Link to="/dashboard">
                      <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile role selector */}
          {currentUser.role !== 'customer' && (
            <div className="mt-2 sm:hidden">
              <RoleSelector />
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-warm bg-clip-text text-transparent">
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

      {/* Footer */}
      <footer className="bg-card/30 py-8 px-4 mt-16">
        <div className="container mx-auto text-center">
          <h4 className="font-semibold mb-2 bg-gradient-warm bg-clip-text text-transparent">
            Dhaka Street Food
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Bringing the authentic taste of Bangladesh to your table
          </p>
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <span>📍 Mobile Food Cart</span>
            <span>⏰ 11 AM - 10 PM</span>
            <span>📞 Contact via Order</span>
          </div>
        </div>
      </footer>

      {/* Floating Cart */}
      <CartFloat />
    </div>
  );
};

export default Index;
