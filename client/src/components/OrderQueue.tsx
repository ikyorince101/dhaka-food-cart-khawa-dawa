import React, { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, CheckCircle } from 'lucide-react';

export function OrderQueue() {
  const { orders } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
  ).sort((a, b) => a.queueNumber - b.queueNumber);

  const currentlyServing = activeOrders.find(order => order.status === 'preparing');
  const waitingOrders = activeOrders.filter(order => order.status === 'pending');
  const readyOrders = activeOrders.filter(order => order.status === 'ready');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-warning text-warning-foreground';
      case 'ready': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getWaitTime = (order: any) => {
    const orderTime = new Date(order.orderTime);
    const elapsed = Math.floor((currentTime.getTime() - orderTime.getTime()) / (1000 * 60));
    return Math.max(0, order.estimatedTime - elapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-warm bg-clip-text text-transparent mb-2">
            Live Order Queue
          </h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleTimeString()} • {activeOrders.length} orders in queue
          </p>
        </div>

        {/* Currently Serving */}
        {currentlyServing && (
          <Card className="mb-6 border-warning shadow-warm">
            <CardHeader className="text-center bg-gradient-to-r from-warning/10 to-warning/5">
              <CardTitle className="text-2xl text-warning flex items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                Now Serving
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-warning mb-2">
                  #{currentlyServing.queueNumber}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ready for Pickup */}
        {readyOrders.length > 0 && (
          <Card className="mb-6 border-success shadow-warm">
            <CardHeader className="bg-gradient-to-r from-success/10 to-success/5">
              <CardTitle className="text-success flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Ready for Pickup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {readyOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                    <div>
                      <div className="text-2xl font-bold text-success">#{order.queueNumber}</div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      Ready!
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting Queue */}
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waiting Queue ({waitingOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {waitingOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No orders waiting. Queue is clear! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {waitingOrders.map((order, index) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-primary">
                        #{order.queueNumber}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} items
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        Position {index + 1}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        ~{getWaitTime(order)} min wait
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Thank you for choosing Dhaka Street Food! 🍛</p>
          <p>Orders are prepared fresh and served in queue order</p>
        </div>
      </div>
    </div>
  );
}