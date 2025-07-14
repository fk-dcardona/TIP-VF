'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  currentPrice: number;
  optimalPrice: number;
  elasticity: number;
  competitorPrice: number;
  margin: number;
  volume: number;
  revenueImpact: number;
}

interface PricingOptimizationProps {
  products: Product[];
  loading?: boolean;
}

export default function PricingOptimization({ products, loading = false }: PricingOptimizationProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [priceAdjustments, setPriceAdjustments] = useState<Record<string, number>>({});
  
  // Calculate overall pricing metrics
  const pricingMetrics = useMemo(() => {
    let totalRevenueOpportunity = 0;
    let underPricedCount = 0;
    let overPricedCount = 0;
    let optimalCount = 0;
    
    products.forEach(product => {
      const priceDiff = product.optimalPrice - product.currentPrice;
      const percentDiff = (priceDiff / product.currentPrice) * 100;
      
      if (Math.abs(percentDiff) < 5) {
        optimalCount++;
      } else if (percentDiff > 0) {
        underPricedCount++;
        totalRevenueOpportunity += product.volume * priceDiff;
      } else {
        overPricedCount++;
      }
    });
    
    return {
      totalRevenueOpportunity,
      underPricedCount,
      overPricedCount,
      optimalCount,
      totalProducts: products.length
    };
  }, [products]);
  
  // Calculate price adjustment impact
  const calculateImpact = (product: Product, newPrice: number) => {
    const priceDiff = newPrice - product.currentPrice;
    const percentChange = (priceDiff / product.currentPrice) * 100;
    
    // Simple elasticity model
    const volumeChange = -product.elasticity * percentChange;
    const newVolume = product.volume * (1 + volumeChange / 100);
    
    const currentRevenue = product.currentPrice * product.volume;
    const newRevenue = newPrice * newVolume;
    const revenueChange = newRevenue - currentRevenue;
    
    const currentProfit = (product.currentPrice * product.margin / 100) * product.volume;
    const newProfit = (newPrice * product.margin / 100) * newVolume;
    const profitChange = newProfit - currentProfit;
    
    return {
      volumeChange,
      revenueChange,
      profitChange,
      newVolume
    };
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getPriceStatusColor = (current: number, optimal: number) => {
    const diff = ((optimal - current) / current) * 100;
    if (Math.abs(diff) < 5) return 'text-green-600 bg-green-100';
    if (diff > 0) return 'text-blue-600 bg-blue-100';
    return 'text-orange-600 bg-orange-100';
  };
  
  const getPriceStatusText = (current: number, optimal: number) => {
    const diff = ((optimal - current) / current) * 100;
    if (Math.abs(diff) < 5) return 'Optimally Priced';
    if (diff > 0) return 'Underpriced';
    return 'Overpriced';
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  const selectedProductData = products.find(p => p.id === selectedProduct);
  const adjustedPrice = selectedProductData 
    ? priceAdjustments[selectedProductData.id] || selectedProductData.currentPrice
    : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Pricing Optimization Engine</h2>
            <p className="text-green-100">Maximize revenue with intelligent pricing strategies</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {formatCurrency(pricingMetrics.totalRevenueOpportunity)}
            </div>
            <div className="text-green-200">Revenue Opportunity</div>
          </div>
        </div>
      </div>
      
      {/* Pricing Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-5 w-5 text-gray-400" />
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Optimal
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pricingMetrics.optimalCount}</p>
          <p className="text-sm text-gray-500">Products at optimal price</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Opportunity
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pricingMetrics.underPricedCount}</p>
          <p className="text-sm text-gray-500">Underpriced products</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-5 w-5 text-gray-400" />
            <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              Risk
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pricingMetrics.overPricedCount}</p>
          <p className="text-sm text-gray-500">Overpriced products</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Impact
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {((pricingMetrics.optimalCount / pricingMetrics.totalProducts) * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-gray-500">Pricing efficiency</p>
        </Card>
      </div>
      
      {/* Product Pricing Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Pricing Analysis</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Optimal Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Competitor Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue Impact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map(product => {
                const priceDiff = ((product.optimalPrice - product.currentPrice) / product.currentPrice) * 100;
                return (
                  <motion.tr
                    key={product.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedProduct === product.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedProduct(product.id)}
                    whileHover={{ x: 2 }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">Elasticity: {product.elasticity}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(product.currentPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(product.optimalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriceStatusColor(product.currentPrice, product.optimalPrice)}`}>
                        {getPriceStatusText(product.currentPrice, product.optimalPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(product.competitorPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {priceDiff > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          priceDiff > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(Math.abs(product.revenueImpact))}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={Math.abs(priceDiff) > 5 ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriceAdjustments({
                            ...priceAdjustments,
                            [product.id]: product.optimalPrice
                          });
                        }}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Optimize
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Price Simulator */}
      {selectedProductData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Price Simulator - {selectedProductData.name}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Adjust Price
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatCurrency(selectedProductData.currentPrice * 0.7)}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(adjustedPrice)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(selectedProductData.currentPrice * 1.3)}
                    </span>
                  </div>
                  
                  <Slider
                    value={[adjustedPrice]}
                    onValueChange={([value]) => setPriceAdjustments({
                      ...priceAdjustments,
                      [selectedProductData.id]: value
                    })}
                    min={selectedProductData.currentPrice * 0.7}
                    max={selectedProductData.currentPrice * 1.3}
                    step={0.01}
                    className="w-full"
                  />
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPriceAdjustments({
                        ...priceAdjustments,
                        [selectedProductData.id]: selectedProductData.currentPrice
                      })}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPriceAdjustments({
                        ...priceAdjustments,
                        [selectedProductData.id]: selectedProductData.optimalPrice
                      })}
                    >
                      Set Optimal
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Impact Analysis */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Projected Impact</h4>
                {(() => {
                  const impact = calculateImpact(selectedProductData, adjustedPrice);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Volume Change</span>
                        <span className={`text-sm font-medium ${
                          impact.volumeChange < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {impact.volumeChange > 0 ? '+' : ''}{impact.volumeChange.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Revenue Impact</span>
                        <span className={`text-sm font-medium ${
                          impact.revenueChange < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(impact.revenueChange)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Profit Impact</span>
                        <span className={`text-sm font-medium ${
                          impact.profitChange < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(impact.profitChange)}
                        </span>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">Recommendation</p>
                            <p className="mt-1">
                              {Math.abs(adjustedPrice - selectedProductData.optimalPrice) < 0.01
                                ? 'This is the optimal price based on market analysis and elasticity.'
                                : adjustedPrice < selectedProductData.optimalPrice
                                ? 'Consider increasing price to capture more value.'
                                : 'Price may be too high, monitor volume closely.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* Pricing Strategy Recommendations */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Pricing Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Capture Value</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {pricingMetrics.underPricedCount} products are priced below optimal. 
                  Gradual increases could add {formatCurrency(pricingMetrics.totalRevenueOpportunity)} in revenue.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Competitive Positioning</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Maintain price leadership while monitoring competitor moves. 
                  Focus on value differentiation for premium pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}