import React, { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import type { BusinessIntelligenceAlert } from '@/types';

interface BusinessIntelligenceAlertPanelProps {
  alerts: BusinessIntelligenceAlert[];
  isLoading: boolean;
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onViewDetails: (alert: BusinessIntelligenceAlert) => void;
}

const getAlertIcon = (type: BusinessIntelligenceAlert['type']) => {
  switch (type) {
    case 'REVENUE_VARIANCE':
      return TrendingUp;
    case 'CUSTOMER_CHURN':
      return Users;
    case 'INVENTORY_COST':
      return Package;
    case 'MARGIN_COMPRESSION':
      return DollarSign;
    case 'STOCKOUT':
      return AlertTriangle;
    case 'SLOW_MOVING':
      return Clock;
    case 'PAYMENT_DELAY':
      return DollarSign;
    case 'TERRITORY_PERFORMANCE':
      return TrendingDown;
    default:
      return Info;
  }
};

const getSeverityColor = (severity: BusinessIntelligenceAlert['severity']) => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'HIGH':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'MEDIUM':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'LOW':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

const getSeverityIcon = (severity: BusinessIntelligenceAlert['severity']) => {
  switch (severity) {
    case 'CRITICAL':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'HIGH':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'MEDIUM':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'LOW':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
};

export const BusinessIntelligenceAlertPanel: React.FC<BusinessIntelligenceAlertPanelProps> = ({
  alerts,
  isLoading,
  onAcknowledge,
  onDismiss,
  onViewDetails
}) => {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<BusinessIntelligenceAlert['severity'] | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<BusinessIntelligenceAlert['type'] | 'ALL'>('ALL');

  const toggleExpanded = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) return false;
    if (filterType !== 'ALL' && alert.type !== filterType) return false;
    return true;
  });

  const criticalAlerts = filteredAlerts.filter(alert => alert.severity === 'CRITICAL');
  const highAlerts = filteredAlerts.filter(alert => alert.severity === 'HIGH');
  const mediumAlerts = filteredAlerts.filter(alert => alert.severity === 'MEDIUM');
  const lowAlerts = filteredAlerts.filter(alert => alert.severity === 'LOW');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Business Intelligence Alerts</h3>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {filteredAlerts.length}
            </span>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="ALL">All Types</option>
              <option value="REVENUE_VARIANCE">Revenue Variance</option>
              <option value="CUSTOMER_CHURN">Customer Churn</option>
              <option value="INVENTORY_COST">Inventory Cost</option>
              <option value="MARGIN_COMPRESSION">Margin Compression</option>
              <option value="STOCKOUT">Stockout</option>
              <option value="SLOW_MOVING">Slow Moving</option>
              <option value="PAYMENT_DELAY">Payment Delay</option>
              <option value="TERRITORY_PERFORMANCE">Territory Performance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Summary */}
      {filteredAlerts.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-6 text-sm">
            {criticalAlerts.length > 0 && (
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700">{criticalAlerts.length} Critical</span>
              </div>
            )}
            {highAlerts.length > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-orange-700">{highAlerts.length} High</span>
              </div>
            )}
            {mediumAlerts.length > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-700">{mediumAlerts.length} Medium</span>
              </div>
            )}
            {lowAlerts.length > 0 && (
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-blue-700">{lowAlerts.length} Low</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="divide-y divide-gray-200">
        {filteredAlerts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts</h3>
            <p className="text-gray-500">All systems are operating normally.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const isExpanded = expandedAlerts.has(alert.id);
            
            return (
              <div key={alert.id} className={`p-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Affected: {alert.affectedEntity}</span>
                        <span>Value: ${alert.currentValue.toLocaleString()}</span>
                        <span>Threshold: ${alert.thresholdValue.toLocaleString()}</span>
                        <span>Variance: {alert.variance > 0 ? '+' : ''}{alert.variance.toFixed(1)}%</span>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <div className="space-y-2">
                            <div>
                              <strong className="text-sm">Recommendation:</strong>
                              <p className="text-sm text-gray-600">{alert.recommendation}</p>
                            </div>
                            <div>
                              <strong className="text-sm">Action Required:</strong>
                              <p className="text-sm text-gray-600">{alert.actionRequired}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                              Generated: {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleExpanded(alert.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => onViewDetails(alert)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="View Details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    
                    {!alert.isAcknowledged && (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                      >
                        Acknowledge
                      </button>
                    )}
                    
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Dismiss"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}; 