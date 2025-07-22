/**
 * Charts Grid Component - Single Responsibility Principle Implementation
 * Single responsibility: Display analytics charts in a grid layout
 */

'use client';

import React from 'react';
import { Card, Grid, LineChart, BarList } from '@tremor/react';

interface ChartsGridProps {
  charts: {
    inventoryTrends: Array<{ date: string; value: number }>;
    supplierPerformance: Array<{ name: string; value: number }>;
    marketIntelligence: Array<{ category: string; value: number }>;
  };
}

export function ChartsGrid({ charts }: ChartsGridProps) {
  return (
    <Grid numItems={1} numItemsLg={2} className="gap-6">
      <Card>
        <h3 className="text-lg font-semibold mb-4">Inventory Trends</h3>
        <LineChart
          data={charts.inventoryTrends}
          index="date"
          categories={["value"]}
          colors={["blue"]}
          yAxisWidth={60}
        />
      </Card>
      
      <Card>
        <h3 className="text-lg font-semibold mb-4">Supplier Performance</h3>
        <BarList
          data={charts.supplierPerformance}
          valueFormatter={(value) => `${value}%`}
          className="mt-4"
        />
      </Card>
    </Grid>
  );
} 