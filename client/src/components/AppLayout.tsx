import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { CustomerHeader } from '@/components/headers/CustomerHeader';
import { AdminHeader } from '@/components/headers/AdminHeader';
import { OwnerHeader } from '@/components/headers/OwnerHeader';
import { CustomerFooter } from '@/components/footers/CustomerFooter';
import { AdminFooter } from '@/components/footers/AdminFooter';
import { OwnerFooter } from '@/components/footers/OwnerFooter';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser } = useApp();

  const getHeader = () => {
    switch (currentUser.role) {
      case 'admin':
        return <AdminHeader />;
      case 'owner':
        return <OwnerHeader />;
      default:
        return <CustomerHeader />;
    }
  };

  const getFooter = () => {
    switch (currentUser.role) {
      case 'admin':
        return <AdminFooter />;
      case 'owner':
        return <OwnerFooter />;
      default:
        return <CustomerFooter />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {getHeader()}
      <main className="flex-1">
        {children}
      </main>
      {getFooter()}
    </div>
  );
}