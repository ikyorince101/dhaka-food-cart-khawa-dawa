import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RoleSelector } from '@/components/RoleSelector';
import { TrendingUp, FileText, BarChart3 } from 'lucide-react';

export function OwnerHeader() {
  return (
    <header className="sticky top-0 z-40 bg-primary/10 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-primary">
              Business Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Analytics & Customer Issues Management
            </p>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Analytics</span>
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