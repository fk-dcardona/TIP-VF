import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { InfoModal } from '@/UI/InfoModal';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  format?: 'number' | 'currency' | 'percentage';
  tooltip?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  format = 'number',
  tooltip
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      change: change && change > 0 ? 'text-green-600' : 'text-red-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      change: change && change > 0 ? 'text-green-600' : 'text-red-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      change: change && change > 0 ? 'text-green-600' : 'text-red-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      change: change && change > 0 ? 'text-green-600' : 'text-red-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      change: change && change > 0 ? 'text-green-600' : 'text-red-600'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {tooltip && (
              <InfoModal
                title={title}
                content={tooltip}
                buttonClassName="text-gray-400 hover:text-gray-600"
              />
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${classes.change}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 ml-2">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${classes.bg}`}>
          <Icon className={`h-6 w-6 ${classes.icon}`} />
        </div>
      </div>
    </div>
  );
};