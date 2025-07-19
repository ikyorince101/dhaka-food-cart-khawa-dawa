import React from 'react';

export function CustomerFooter() {
  return (
    <footer className="bg-card/30 py-8 px-4 mt-16">
      <div className="container mx-auto text-center">
        <h4 className="font-semibold mb-2 text-primary">
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
  );
}