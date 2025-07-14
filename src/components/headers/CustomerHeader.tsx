import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, User, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CustomerHeader() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = () => {
      const userSession = localStorage.getItem('user_session');
      if (userSession) {
        setUser(JSON.parse(userSession));
      } else {
        setUser(null);
      }
    };
    checkUser();

    // Listen for changes in localStorage if needed, or rely on page reload for simplicity
    window.addEventListener('storage', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user_session');
    localStorage.removeItem('test_user'); // Clear test user data if it was used
    localStorage.removeItem('test_orders'); // Clear test orders data if it was used

    toast({
      title: "Signed out successfully",
      description: "You have been logged out.",
    });
    // Redirect to auth page after sign out
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-warm bg-clip-text text-transparent truncate">
              Dhaka Street Food
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Authentic Bengali street flavors 🍛
            </p>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            {user ? (
              <>
                <Link to="/queue">
                  <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Queue</span>
                  </Button>
                </Link>
                
                <Link to="/my-orders">
                  <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Orders</span>
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}