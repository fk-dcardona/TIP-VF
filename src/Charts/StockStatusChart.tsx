import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { ChartData } from '@/types';

interface StockStatusChartProps {
  data: ChartData[];
  title?: string;
}

interface StockStatusTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; dataKey: string; value: number }>;
}

const CustomTooltip = ({ active, payload }: StockStatusTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-gray-900 mb-2">{data.dataKey}</p>
        <span className="text-sm font-medium">{data.value.toLocaleString()}</span>
      </div>
    );
  }
  return null;
};

const CustomLabel = (props: unknown) => {
  // Use type guards to access recharts Pie label properties
  const hasProps = (obj: unknown): obj is { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number } => {
    if (!obj || typeof obj !== 'object') return false;
    const keys = ['cx', 'cy', 'midAngle', 'innerRadius', 'outerRadius', 'percent'];
    return keys.every(key => key in obj);
  };
  if (!hasProps(props)) return null;
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    percent === undefined ||
    midAngle === undefined ||
    cx === undefined ||
    cy === undefined ||
    innerRadius === undefined ||
    outerRadius === undefined
  )
    return null;
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
      pointerEvents="none"
    >
      {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
};

export const StockStatusChart: React.FC<StockStatusChartProps> = ({ 
  data, 
  title = "Stock Status Distribution" 
}) => {
  const COLORS = {
    'Normal': '#10B981',
    'Low Stock': '#F59E0B',
    'Out of Stock': '#EF4444',
    'Overstock': '#8B5CF6'
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithTotal.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS] || '#94A3B8'} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value: string, entry: any) => (
                <span style={{ color: entry.color ?? '#000' }} className="text-sm">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {dataWithTotal.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] || '#94A3B8' }}
            />
            <span className="text-sm text-gray-600">{item.name}:</span>
            <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};