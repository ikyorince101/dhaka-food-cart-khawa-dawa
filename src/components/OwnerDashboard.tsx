import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, ShoppingBag, Clock, Star } from 'lucide-react';

export function OwnerDashboard() {
  const { getSalesData, orders } = useApp();
  const salesData = getSalesData();

  const todayOrders = orders.filter(order => {
    const today = new Date();
    const orderDate = new Date(order.orderTime);
    return orderDate.toDateString() === today.toDateString();
  });

  const todaySales = todayOrders
    .filter(order => order.status === 'served')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const activeOrders = orders.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  ).length;

  const avgWaitTime = orders
    .filter(order => order.status === 'served')
    .reduce((sum, order) => sum + order.estimatedTime, 0) / 
    Math.max(orders.filter(order => order.status === 'served').length, 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-warm bg-clip-text text-transparent mb-2">
            Owner Dashboard
          </h1>
          <p className="text-muted-foreground">
            Business analytics and performance overview
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ${todaySales.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {todayOrders.filter(o => o.status === 'served').length} orders completed
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${salesData.totalSales.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {activeOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                In queue right now
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgWaitTime.toFixed(0)}m
              </div>
              <p className="text-xs text-muted-foreground">
                Average prep time
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Selling Items */}
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.topSellingItems.slice(0, 5).map((item, index) => (
                  <div key={item.item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-warm flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success">
                        ${item.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders Summary */}
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle>Order Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-secondary text-secondary-foreground">
                      Pending
                    </Badge>
                    <span>New Orders</span>
                  </div>
                  <span className="font-semibold">
                    {orders.filter(o => o.status === 'pending').length}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-warning text-warning-foreground">
                      Preparing
                    </Badge>
                    <span>In Kitchen</span>
                  </div>
                  <span className="font-semibold">
                    {orders.filter(o => o.status === 'preparing').length}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success text-success-foreground">
                      Ready
                    </Badge>
                    <span>For Pickup</span>
                  </div>
                  <span className="font-semibold">
                    {orders.filter(o => o.status === 'ready').length}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      Served
                    </Badge>
                    <span>Completed Today</span>
                  </div>
                  <span className="font-semibold">
                    {todayOrders.filter(o => o.status === 'served').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Sales Chart */}
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Sales Performance (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.dailySales.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-24">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-gradient-warm h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(day.sales / Math.max(...salesData.dailySales.map(d => d.sales))) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">${day.sales.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{day.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card className="shadow-warm mt-6">
          <CardHeader>
            <CardTitle>Peak Hours Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-2">
              {salesData.hourlyDistribution.map((hour) => (
                <div key={hour.hour} className="text-center">
                  <div className="mb-2">
                    <div 
                      className="bg-gradient-warm rounded-t w-full transition-all duration-300"
                      style={{ 
                        height: `${Math.max((hour.orders / Math.max(...salesData.hourlyDistribution.map(h => h.orders))) * 40, 2)}px`,
                        minHeight: '2px'
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hour.hour}h
                  </div>
                  <div className="text-xs font-medium">
                    {hour.orders}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}