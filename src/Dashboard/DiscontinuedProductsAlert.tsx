import React from 'react';
import { AlertTriangle, Trash2, Eye, TrendingDown } from 'lucide-react';
import type { DiscontinuedProductAlert } from '@/types';

interface DiscontinuedProductsAlertProps {
  discontinuedProducts: DiscontinuedProductAlert[];
  className?: string;
}

export const DiscontinuedProductsAlert: React.FC<DiscontinuedProductsAlertProps> = ({
  discontinuedProducts,
  className = ''
}) => {
  if (discontinuedProducts.length === 0) {
    return null;
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'ELIMINATE':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'REVIEW':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'KEEP':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'ELIMINATE':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'REVIEW':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'KEEP':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Discontinued Products Alert
          </h3>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          {discontinuedProducts.length} products
        </span>
      </div>

      <div className="space-y-3">
        {discontinuedProducts.slice(0, 5).map((product) => (
          <div
            key={product.productCode}
            className={`p-3 rounded-lg border ${getRecommendationColor(product.recommendation)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {getRecommendationIcon(product.recommendation)}
                  <span className="font-medium text-sm">
                    {product.productName}
                  </span>
                  <span className="text-xs opacity-75">
                    ({product.productCode})
                  </span>
                </div>
                
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Last seen:</span>
                    <span>{new Date(product.lastSeenPeriod).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Months missing:</span>
                    <span>{product.monthsMissing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous revenue:</span>
                    <span>${product.previousRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous margin:</span>
                    <span>{product.previousMargin.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs">
                  <span className="font-medium">Recommendation:</span> {product.reasoning}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {discontinuedProducts.length > 5 && (
          <div className="text-center text-sm text-gray-500 pt-2">
            +{discontinuedProducts.length - 5} more discontinued products
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Legend:</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Trash2 className="h-3 w-3 text-red-500" />
              <span>Eliminate</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3 text-yellow-500" />
              <span>Review</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingDown className="h-3 w-3 text-blue-500" />
              <span>Keep</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 