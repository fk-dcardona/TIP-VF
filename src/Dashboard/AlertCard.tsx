import React, { useState } from 'react';
import { Package, AlertTriangle, Clock, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react';
import type { Alert } from '@/types';

interface AlertCardProps {
  alerts: Alert[];
  title?: string;
  onCreatePO?: (productCode: string) => void;
  onDismissAlert?: (alertId: string) => void;
  onViewDetails?: (productCode: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ 
  alerts, 
  title = "Critical Alerts",
  onCreatePO,
  onDismissAlert,
  onViewDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Filter out dismissed alerts and sort by urgency and revenue impact
  const activeAlerts = alerts
    .filter(alert => !dismissedAlerts.has(alert.id))
    .filter(alert => alert.urgency >= 2 || alert.revenueImpact > 1000) // Only show critical or revenue-impacting alerts
    .sort((a, b) => {
      // Sort by urgency first, then by revenue impact
      if (a.urgency !== b.urgency) return b.urgency - a.urgency;
      return b.revenueImpact - a.revenueImpact;
    });

  const visibleAlerts = isExpanded ? activeAlerts : activeAlerts.slice(0, 3);

  const getAlertTypeInfo = (alert: Alert) => {
    switch (alert.type) {
      case 'OUT_OF_STOCK':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'bg-red-50 border-red-200 text-red-800',
          badgeColor: 'bg-red-100 text-red-800',
          label: 'Critical'
        };
      case 'LOW_STOCK':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          badgeColor: 'bg-orange-100 text-orange-800',
          label: 'Warning'
        };
      case 'OVERSTOCK':
        return {
          icon: <Package className="h-4 w-4" />,
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          badgeColor: 'bg-blue-100 text-blue-800',
          label: 'Notice'
        };
      default:
        return {
          icon: <Package className="h-4 w-4" />,
          color: 'bg-gray-50 border-gray-200 text-gray-800',
          badgeColor: 'bg-gray-100 text-gray-800',
          label: 'Info'
        };
    }
  };

  const formatCurrency = (value: number) => {
    if (value === 0) return 'No revenue impact';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleDismiss = (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismissAlert?.(alertId);
  };

  const handleCreatePO = (productCode: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onCreatePO?.(productCode);
  };

  const handleViewDetails = (productCode: string) => {
    onViewDetails?.(productCode);
  };

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Package className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">No critical alerts at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''} requiring attention
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Quick stats */}
          <div className="flex items-center space-x-2">
            {activeAlerts.filter(a => a.urgency === 3).length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-lg">
                {activeAlerts.filter(a => a.urgency === 3).length} Critical
              </span>
            )}
            {activeAlerts.filter(a => a.urgency === 2).length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-lg">
                {activeAlerts.filter(a => a.urgency === 2).length} Warning
              </span>
            )}
          </div>
          
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="border-t border-gray-200">
        {visibleAlerts.map((alert) => {
          const alertInfo = getAlertTypeInfo(alert);
          
          return (
            <div
              key={alert.id}
              className={`p-4 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer ${alertInfo.color}`}
              onClick={() => handleViewDetails(alert.productCode || '')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {alertInfo.icon}
                    <h4 className="text-sm font-semibold text-gray-900 truncate" title={alert.productName}>
                      {alert.productName}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-lg ${alertInfo.badgeColor}`}>
                      {alertInfo.label}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-700 mb-2">{alert.message}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Current Stock:</span> {alert.currentStock}
                    </div>
                    <div>
                      <span className="font-medium">Monthly Sales:</span> {alert.monthlySales}
                    </div>
                    <div>
                      <span className="font-medium">Min Level:</span> {alert.minLevel}
                    </div>
                    <div>
                      <span className="font-medium">Revenue Impact:</span> {formatCurrency(alert.revenueImpact)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {alert.type !== 'OVERSTOCK' && alert.revenueImpact > 0 && (
                    <button
                      onClick={(e) => handleCreatePO(alert.productCode || '', e)}
                      className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Create Purchase Order"
                    >
                      Create PO
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleViewDetails(alert.productCode || '')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View Details"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={(e) => handleDismiss(alert.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Dismiss Alert"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Show More/Less Button */}
        {activeAlerts.length > 3 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              {isExpanded 
                ? `Show Less` 
                : `+${activeAlerts.length - 3} more alerts`
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};