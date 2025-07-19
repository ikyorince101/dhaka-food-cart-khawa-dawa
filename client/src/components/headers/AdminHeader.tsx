import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSelector } from '@/components/RoleSelector';
import { Monitor, Users, BarChart3 } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-warning">
              Kitchen Admin Panel
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Order Management & Kitchen Operations
            </p>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            <Link to="/queue">
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Live Queue</span>
              </Button>
            </Link>
            
            <Link to="/admin">
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Orders</span>
              </Button>
            </Link>
            
            <div className="hidden sm:block">
              <RoleSelector />
            </div>
          </div>
        </div>
        
        {/* Mobile role selector */}
        <div className="mt-2 sm:hidden">
          <RoleSelector />
        </div>
      </div>
    </header>
  );
}