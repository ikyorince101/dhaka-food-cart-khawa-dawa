import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, ShoppingBag, Clock, Star } from 'lucide-react';

export function OwnerDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/analytics/owner-dashboard');
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (e) {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const { totalSales, dailySales, hourlyDistribution, topSellingItems, activeOrders, avgWaitTime, statusCounts } = analytics;
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = dailySales.find((d: any) => d.date === today)?.orders || 0;
  const todaySales = dailySales.find((d: any) => d.date === today)?.sales || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Owner Dashboard
          </h1>
          <p className="text-muted-foreground">
            Business analytics and performance overview
          </p>
        </div>

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Hourly Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-success">
                ${(todaySales / Math.max(new Date().getHours() - 8, 1)).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per hour today
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Daily Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-primary">
                ${todaySales.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Today's total
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Weekly Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-accent">
                ${(dailySales.reduce((sum: number, d: any) => sum + d.sales, 0)).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Monthly Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-warning">
                ${totalSales.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Active Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-destructive">
                {activeOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                In queue now
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Avg Wait Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {avgWaitTime.toFixed(0)}m
              </div>
              <p className="text-xs text-muted-foreground">
                Kitchen prep
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Revenue Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Daily Growth</span>
                  <span className="font-semibold text-success">+12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Weekly Growth</span>
                  <span className="font-semibold text-success">+8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Monthly Growth</span>
                  <span className="font-semibold text-success">+15%</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Avg Order Value</span>
                    <span className="font-bold text-primary">${(totalSales / Math.max(analytics.statusCounts.served, 1)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Order Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Orders</span>
                  <span className="font-semibold">{analytics.statusCounts.served + analytics.statusCounts.cancelled + analytics.statusCounts.pending + analytics.statusCounts.preparing + analytics.statusCounts.ready}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed Today</span>
                  <span className="font-semibold text-success">{todayOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completion Rate</span>
                  <span className="font-semibold text-success">
                    {((todayOrders / Math.max(todayOrders + analytics.statusCounts.pending + analytics.statusCounts.preparing + analytics.statusCounts.ready, 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Peak Hour</span>
                    <span className="font-bold text-primary">
                      {hourlyDistribution.reduce((max: any, hour: any) => hour.orders > max.orders ? hour : max, hourlyDistribution[0])?.hour || 12}:00
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Financial Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Cash Flow</span>
                  <span className="font-semibold text-success">Positive</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Daily Target</span>
                  <span className="font-semibold text-warning">$500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Progress</span>
                  <span className="font-semibold text-primary">
                    {((todaySales / 500) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-warm h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((todaySales / 500) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
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
                {topSellingItems.slice(0, 5).map((item: any, index: number) => (
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
                    {statusCounts.pending}
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
                    {statusCounts.preparing}
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
                    {statusCounts.ready}
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
                    {statusCounts.served}
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
              {dailySales.map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-24">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-gradient-warm h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(day.sales / Math.max(...dailySales.map((d: any) => d.sales))) * 100}%` }}
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
              {hourlyDistribution.map((hour: any) => (
                <div key={hour.hour} className="text-center">
                  <div className="mb-2">
                    <div 
                      className="bg-gradient-warm rounded-t w-full transition-all duration-300"
                      style={{ 
                        height: `${Math.max((hour.orders / Math.max(...hourlyDistribution.map((h: any) => h.orders))) * 40, 2)}px`,
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