/**
 * Triangle Analytics Component - Single Responsibility Principle Implementation
 * Single responsibility: Display 4D triangle analytics scores
 */

'use client';

import React from 'react';
import { Card, Metric, Text, ProgressBar, Grid } from '@tremor/react';
import { DashboardMetrics } from '@/types/api';

interface TriangleAnalyticsProps {
  triangleAnalytics: DashboardMetrics['triangleAnalytics'];
}

export function TriangleAnalytics({ triangleAnalytics }: TriangleAnalyticsProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">4D Triangle Analytics</h2>
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
        <div className="text-center">
          <Text>Sales Intelligence</Text>
          <Metric className="text-blue-600">{triangleAnalytics.salesScore}%</Metric>
          <ProgressBar value={triangleAnalytics.salesScore} className="mt-2" />
        </div>
        <div className="text-center">
          <Text>Financial Intelligence</Text>
          <Metric className="text-green-600">{triangleAnalytics.financialScore}%</Metric>
          <ProgressBar value={triangleAnalytics.financialScore} className="mt-2" />
        </div>
        <div className="text-center">
          <Text>Supply Chain Intelligence</Text>
          <Metric className="text-purple-600">{triangleAnalytics.supplyChainScore}%</Metric>
          <ProgressBar value={triangleAnalytics.supplyChainScore} className="mt-2" />
        </div>
        <div className="text-center">
          <Text>Document Intelligence</Text>
          <Metric className="text-orange-600">{triangleAnalytics.documentScore}%</Metric>
          <ProgressBar value={triangleAnalytics.documentScore} className="mt-2" />
        </div>
      </Grid>
    </Card>
  );
} 