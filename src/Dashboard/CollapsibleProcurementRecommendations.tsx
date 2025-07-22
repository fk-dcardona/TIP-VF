import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import type { ProcurementRecommendation } from '@/types';

interface CollapsibleProcurementRecommendationsProps {
  recommendations: ProcurementRecommendation[];
  className?: string;
}

export const CollapsibleProcurementRecommendations: React.FC<CollapsibleProcurementRecommendationsProps> = ({
  recommendations,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group recommendations by priority
  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    const priority = rec.action === 'immediate' ? 'critical' : 
                    rec.action === 'planned' ? 'high' : 'medium';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(rec);
    return acc;
  }, {} as Record<string, ProcurementRecommendation[]>);

  const criticalCount = groupedRecommendations.critical?.length || 0;
  const highCount = groupedRecommendations.high?.length || 0;
  const mediumCount = groupedRecommendations.medium?.length || 0;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Package className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with Toggle */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Package className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Procurement Recommendations</h3>
            <p className="text-sm text-gray-500">
              {criticalCount + highCount + mediumCount} total recommendations
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Quick Stats */}
          <div className="flex items-center space-x-3 text-sm">
            {criticalCount > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-lg">
                <AlertTriangle className="h-3 w-3" />
                <span>{criticalCount}</span>
              </div>
            )}
            {highCount > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-lg">
                <Clock className="h-3 w-3" />
                <span>{highCount}</span>
              </div>
            )}
            {mediumCount > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg">
                <Package className="h-3 w-3" />
                <span>{mediumCount}</span>
              </div>
            )}
          </div>
          
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {Object.entries(groupedRecommendations).map(([priority, recs]) => (
            <div key={priority} className={`rounded-lg border p-4 ${getPriorityColor(priority)}`}>
              <div className="flex items-center space-x-2 mb-3">
                {getPriorityIcon(priority)}
                <h4 className="font-semibold capitalize text-gray-900">
                  {priority} Priority ({recs.length})
                </h4>
              </div>
              
              <div className="space-y-2">
                {recs.slice(0, isExpanded ? recs.length : 3).map((rec, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 truncate" title={rec.productName}>
                        {rec.productName}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">
                        {rec.reasoning}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                        <span>Order: {rec.suggestedQuantity} units</span>
                        {rec.cost > 0 && (
                          <span className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{formatCurrency(rec.cost)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                        priority === 'critical' ? 'bg-red-100 text-red-800' :
                        priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {priority}
                      </span>
                      
                      <button className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Create PO
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {recommendations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No procurement recommendations at this time.</p>
              <p className="text-sm">Stock levels appear to be well managed.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 