import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { UserRole } from '@/types';
import { User, Shield, Crown } from 'lucide-react';

export function RoleSelector() {
  const { currentUser, dispatch } = useApp();

  const roles: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { role: 'customer', label: 'Customer', icon: <User className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
    { role: 'admin', label: 'Admin', icon: <Shield className="h-4 w-4" />, color: 'bg-warning text-warning-foreground' },
    { role: 'owner', label: 'Owner', icon: <Crown className="h-4 w-4" />, color: 'bg-primary text-primary-foreground' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">View as:</span>
      <div className="flex gap-1">
        {roles.map(({ role, label, icon, color }) => (
          <Button
            key={role}
            variant={currentUser.role === role ? "default" : "outline"}
            size="sm"
            onClick={() => dispatch({ type: 'SET_USER_ROLE', payload: role })}
            className={`h-8 px-3 ${currentUser.role === role ? color : ''}`}
          >
            {icon}
            <span className="ml-1">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}