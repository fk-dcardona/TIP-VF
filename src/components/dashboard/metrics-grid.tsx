/**
 * Metrics Grid Component - Single Responsibility Principle Implementation
 * Single responsibility: Display key metrics in a grid layout
 */

'use client';

import React from 'react';
import { Card, Metric, Text, Grid } from '@tremor/react';
import { Package, DollarSign, AlertCircle, Users } from 'lucide-react';
import { DashboardMetrics } from '@/types/api';

interface MetricsGridProps {
  metrics: DashboardMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
      <Card>
        <div className="flex items-center">
          <Package className="h-8 w-8 text-blue-600" />
          <div className="ml-4">
            <Text>Total Inventory</Text>
            <Metric>{metrics.totalInventory.toLocaleString()}</Metric>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="flex items-center">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div className="ml-4">
            <Text>Inventory Value</Text>
            <Metric>${metrics.totalInventoryValue.toLocaleString()}</Metric>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="flex items-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <div className="ml-4">
            <Text>Critical Alerts</Text>
            <Metric>{metrics.criticalAlerts}</Metric>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="flex items-center">
          <Users className="h-8 w-8 text-purple-600" />
          <div className="ml-4">
            <Text>Active Suppliers</Text>
            <Metric>{metrics.activeSuppliers}</Metric>
          </div>
        </div>
      </Card>
    </Grid>
  );
} 