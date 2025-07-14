'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp, DollarSign, Users, Globe, BarChart3 } from 'lucide-react';

interface RegionData {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  sales: number;
  customers: number;
  growth: number;
  topProducts: string[];
  marketShare: number;
}

interface GeographicSalesMapProps {
  regionData: RegionData[];
  loading?: boolean;
}

export default function GeographicSalesMap({ regionData, loading = false }: GeographicSalesMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  
  // Calculate total sales for percentage calculations
  const totalSales = useMemo(() => {
    return regionData.reduce((sum, region) => sum + region.sales, 0);
  }, [regionData]);
  
  // Sort regions by sales
  const topRegions = useMemo(() => {
    return [...regionData].sort((a, b) => b.sales - a.sales).slice(0, 5);
  }, [regionData]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getRegionColor = (sales: number) => {
    const percentage = (sales / totalSales) * 100;
    if (percentage > 25) return '#4F46E5'; // Indigo
    if (percentage > 15) return '#7C3AED'; // Purple
    if (percentage > 10) return '#2563EB'; // Blue
    if (percentage > 5) return '#0891B2'; // Cyan
    return '#10B981'; // Green
  };
  
  const getRegionSize = (sales: number) => {
    const percentage = (sales / totalSales) * 100;
    return Math.max(40, Math.min(80, percentage * 3));
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }
  
  const selectedRegionData = regionData.find(r => r.id === selectedRegion);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Geographic Sales Distribution</h2>
            <p className="text-blue-100">Visualizing where your sales are concentrated</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{regionData.length}</div>
            <div className="text-blue-200">Active Regions</div>
          </div>
        </div>
      </div>
      
      {/* Interactive Map */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Sales by Region</h3>
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Click a region for details</span>
          </div>
        </div>
        
        {/* SVG Map Container */}
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 h-96 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 400">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Regions */}
            {regionData.map((region) => {
              const size = getRegionSize(region.sales);
              const isHovered = hoveredRegion === region.id;
              const isSelected = selectedRegion === region.id;
              
              return (
                <g key={region.id}>
                  <motion.circle
                    cx={region.coordinates.x}
                    cy={region.coordinates.y}
                    r={size}
                    fill={getRegionColor(region.sales)}
                    fillOpacity={0.2}
                    stroke={getRegionColor(region.sales)}
                    strokeWidth={2}
                    className="cursor-pointer"
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: isHovered ? 1.1 : 1,
                      strokeWidth: isSelected ? 4 : 2
                    }}
                    transition={{ duration: 0.3 }}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => setSelectedRegion(region.id === selectedRegion ? null : region.id)}
                  />
                  
                  <motion.circle
                    cx={region.coordinates.x}
                    cy={region.coordinates.y}
                    r={size / 3}
                    fill={getRegionColor(region.sales)}
                    className="cursor-pointer pointer-events-none"
                    animate={{ 
                      scale: isHovered ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: isHovered ? Infinity : 0
                    }}
                  />
                  
                  <text
                    x={region.coordinates.x}
                    y={region.coordinates.y - size - 10}
                    textAnchor="middle"
                    className="fill-gray-700 text-sm font-medium pointer-events-none"
                  >
                    {region.name}
                  </text>
                  
                  <text
                    x={region.coordinates.x}
                    y={region.coordinates.y + 5}
                    textAnchor="middle"
                    className="fill-white text-xs font-bold pointer-events-none"
                  >
                    {((region.sales / totalSales) * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Hover Tooltip */}
          <AnimatePresence>
            {hoveredRegion && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs"
              >
                {(() => {
                  const region = regionData.find(r => r.id === hoveredRegion)!;
                  return (
                    <>
                      <h4 className="font-semibold text-gray-900">{region.name}</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-600">
                          Sales: <span className="font-medium text-gray-900">{formatCurrency(region.sales)}</span>
                        </p>
                        <p className="text-gray-600">
                          Customers: <span className="font-medium text-gray-900">{region.customers}</span>
                        </p>
                        <p className="text-gray-600">
                          Growth: <span className={`font-medium ${region.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {region.growth > 0 ? '+' : ''}{region.growth}%
                          </span>
                        </p>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
            <span className="text-sm text-gray-600">High Sales ({'>'}25%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
            <span className="text-sm text-gray-600">Medium Sales (10-25%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-600"></div>
            <span className="text-sm text-gray-600">Low Sales ({'<'}10%)</span>
          </div>
        </div>
      </Card>
      
      {/* Selected Region Details */}
      <AnimatePresence>
        {selectedRegionData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 border-2 border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRegionData.name} - Detailed Analysis
                </h3>
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(selectedRegionData.sales)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((selectedRegionData.sales / totalSales) * 100).toFixed(1)}% of total
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Customers</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {selectedRegionData.customers}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(selectedRegionData.sales / selectedRegionData.customers)} avg
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Growth</span>
                  </div>
                  <p className={`text-2xl font-bold mt-2 ${
                    selectedRegionData.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedRegionData.growth > 0 ? '+' : ''}{selectedRegionData.growth}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">YoY growth rate</p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Market Share</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {selectedRegionData.marketShare}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Regional market</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-white rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Top Products in Region</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRegionData.topProducts.map((product, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Regions List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Regions</h3>
        <div className="space-y-3">
          {topRegions.map((region, index) => (
            <motion.div
              key={region.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-700">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{region.name}</p>
                  <p className="text-sm text-gray-500">{region.customers} customers</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(region.sales)}</p>
                <p className={`text-sm ${region.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {region.growth > 0 ? '+' : ''}{region.growth}% growth
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}