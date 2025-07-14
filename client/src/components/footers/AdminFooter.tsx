import React from 'react';

export function AdminFooter() {
  return (
    <footer className="bg-card/50 py-6 px-4 mt-8 border-t border-border/50">
      <div className="container mx-auto text-center">
        <h4 className="font-semibold mb-2 text-warning">
          Kitchen Admin Panel
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Manage orders efficiently and keep the kitchen running smoothly
        </p>
        <div className="flex justify-center gap-6 text-xs text-muted-foreground">
          <span>🔥 Kitchen Operations</span>
          <span>⏱️ Real-time Updates</span>
          <span>📊 Order Tracking</span>
        </div>
      </div>
    </footer>
  );
}