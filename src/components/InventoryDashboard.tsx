'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';

interface InventoryData {
  totalItems: number;
  lowStockAlerts: number;
  averageTurnover: number;
  totalValue: number;
  recentMovements: Array<{
    id: string;
    item: string;
    quantity: number;
    type: 'in' | 'out';
    date: string;
  }>;
}

interface InventoryDashboardProps {
  data?: InventoryData;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ 
  data = {
    totalItems: 1543,
    lowStockAlerts: 23,
    averageTurnover: 4.2,
    totalValue: 245670,
    recentMovements: [
      { id: '1', item: 'Product A', quantity: 100, type: 'in', date: '2024-01-14' },
      { id: '2', item: 'Product B', quantity: 50, type: 'out', date: '2024-01-14' },
      { id: '3', item: 'Product C', quantity: 75, type: 'in', date: '2024-01-13' },
    ]
  }
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">Track and manage your inventory in real-time</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Items below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Turnover</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageTurnover}x</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Movements</CardTitle>
          <CardDescription>Latest inventory transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{movement.item}</p>
                  <p className="text-sm text-muted-foreground">{movement.date}</p>
                </div>
                <div className={`flex items-center gap-2 ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="font-medium">
                    {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                  </span>
                  <span className="text-sm">{movement.type === 'in' ? 'IN' : 'OUT'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;