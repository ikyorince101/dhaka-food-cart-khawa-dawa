import React from 'react';

export function OwnerFooter() {
  return (
    <footer className="bg-primary/5 py-6 px-4 mt-8 border-t border-primary/20">
      <div className="container mx-auto text-center">
        <h4 className="font-semibold mb-2 text-primary">
          Business Dashboard
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Monitor your business performance and customer satisfaction
        </p>
        <div className="flex justify-center gap-6 text-xs text-muted-foreground">
          <span>📈 Analytics</span>
          <span>💰 Revenue Tracking</span>
          <span>🎯 Customer Insights</span>
        </div>
      </div>
    </footer>
  );
}