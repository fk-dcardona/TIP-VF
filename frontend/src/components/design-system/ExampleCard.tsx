'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  living?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  living = true, 
  icon,
  className 
}: KPICardProps) {
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus
  }[trend];

  const trendColor = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-text-secondary'
  }[trend];

  return (
    <motion.div
      className={cn('card-elevated', className)}
      animate={living ? {
        scale: [0.98, 1.02, 0.98],
        opacity: [0.9, 1, 0.9]
      } : undefined}
      transition={living ? {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      } : undefined}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="kpi-title">
            {title}
          </p>
          <h3 className="kpi-value">
            {value}
          </h3>
          {change !== undefined && (
            <div className={cn('kpi-change mt-2', trendColor)}>
              <TrendIcon className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 p-3 bg-primary-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Example Chart Card
export function ChartCard({ 
  title, 
  children,
  actions,
  className 
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('chart-container', className)}>
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}

// Example Dashboard Layout
export function DashboardExample() {
  return (
    <div className="p-6 space-y-6 bg-background-secondary min-h-screen">
      {/* Header */}
      <div className="water-bg rounded-lg p-8 relative">
        <h1 className="text-4xl font-bold text-gradient-brand mb-2">
          Supply Chain Intelligence Dashboard
        </h1>
        <p className="text-text-secondary text-lg">
          Real-time insights powered by AI
        </p>
      </div>

      {/* KPI Grid */}
      <div className="dashboard-grid">
        <KPICard
          title="Total Revenue"
          value="$2.4M"
          change={12.5}
          trend="up"
          icon={<DollarSign className="h-5 w-5 text-primary-600" />}
        />
        <KPICard
          title="Active Customers"
          value="1,234"
          change={5.2}
          trend="up"
          icon={<Users className="h-5 w-5 text-secondary-600" />}
        />
        <KPICard
          title="Inventory Turnover"
          value="8.3x"
          change={-2.1}
          trend="down"
          icon={<Package className="h-5 w-5 text-warning-main" />}
        />
        <KPICard
          title="On-Time Delivery"
          value="95.8%"
          change={0}
          trend="neutral"
          icon={<Truck className="h-5 w-5 text-info-main" />}
        />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Revenue Trend"
          actions={
            <button className="btn-ghost px-3 py-1 text-sm">
              View Details
            </button>
          }
        >
          {/* Chart component would go here */}
          <div className="flex items-center justify-center h-full text-text-tertiary">
            Chart Component
          </div>
        </ChartCard>

        <ChartCard 
          title="Customer Segments"
          actions={
            <div className="flex gap-2">
              <button className="btn-outline px-3 py-1 text-sm">
                Filter
              </button>
              <button className="btn-primary px-3 py-1 text-sm">
                Export
              </button>
            </div>
          }
        >
          {/* Chart component would go here */}
          <div className="flex items-center justify-center h-full text-text-tertiary">
            Pie Chart Component
          </div>
        </ChartCard>
      </div>

      {/* Table Example */}
      <div className="card-elevated">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Recent Orders
          </h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-border hover:bg-background-secondary transition-colors">
                    <td className="py-3 px-4 text-sm text-text-primary">
                      #ORD-{1000 + i}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      Customer {i}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      ${(Math.random() * 10000).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                        Delivered
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Required imports for the example
import { DollarSign, Users, Package, Truck } from 'lucide-react';