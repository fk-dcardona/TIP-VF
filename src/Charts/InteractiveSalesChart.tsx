import React, { useState, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  BarChart, 
  LineChart,
  ChevronLeft,
  RefreshCw,
  Download,
  Maximize2
} from 'lucide-react';
import type { TimeSeriesData, ChartData } from '@/types';

interface InteractiveSalesChartProps {
  data: TimeSeriesData[] | ChartData[];
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  height?: number;
  onDrillDown?: (dataPoint: any) => void;
  onPeriodChange?: (period: string) => void;
  comparisonData?: TimeSeriesData[] | ChartData[];
  showComparison?: boolean;
  loading?: boolean;
}

type ChartType = 'line' | 'bar' | 'pie' | 'area';

export const InteractiveSalesChart: React.FC<InteractiveSalesChartProps> = ({
  data,
  title,
  type,
  height = 300,
  onDrillDown,
  comparisonData,
  showComparison = false,
  loading = false
}) => {
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(type);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);

  const handleDataPointClick = useCallback((dataPoint: any) => {
    setSelectedDataPoint(dataPoint);
    if (onDrillDown) {
      onDrillDown(dataPoint);
      setDrillDownLevel(prev => prev + 1);
    }
  }, [onDrillDown]);

  const handleBackClick = useCallback(() => {
    if (drillDownLevel > 0) {
      setDrillDownLevel(prev => prev - 1);
      setSelectedDataPoint(null);
    }
  }, [drillDownLevel]);

  const handleRefresh = useCallback(() => {
    setDrillDownLevel(0);
    setSelectedDataPoint(null);
  }, []);

  const handleExport = useCallback(() => {
    // Export chart data as CSV
    const csvContent = [
      ['Period', 'Value', 'Metric'],
      ...data.map(item => [
        'period' in item ? item.period : item.name,
        item.value.toString(),
        'metric' in item ? item.metric : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, title]);

  const getChartIcon = (chartType: ChartType) => {
    switch (chartType) {
      case 'line':
        return <LineChart className="h-4 w-4" />;
      case 'bar':
        return <BarChart className="h-4 w-4" />;
      case 'pie':
        return <PieChart className="h-4 w-4" />;
      case 'area':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Simple chart rendering (in a real implementation, you'd use a charting library like Chart.js or Recharts)
    return (
      <div className="relative h-full">
        {/* Chart Type Selector */}
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center space-x-1 bg-white rounded-lg shadow border p-1">
            {(['line', 'bar', 'pie', 'area'] as ChartType[]).map(chartType => (
              <button
                key={chartType}
                onClick={() => setSelectedChartType(chartType)}
                className={`p-1 rounded ${
                  selectedChartType === chartType 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
              >
                {getChartIcon(chartType)}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Content */}
        <div className="h-full flex items-end justify-center space-x-2 p-4">
          {data.length === 0 ? (
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No data available</p>
            </div>
          ) : (
            data.map((item, index) => {
              const value = 'value' in item ? item.value : 0;
              const maxValue = Math.max(...data.map(d => 'value' in d ? d.value : 0));
              const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
              
              return (
                <div
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() => handleDataPointClick(item)}
                >
                  {/* Bar/Column */}
                  <div
                    className={`bg-blue-500 hover:bg-blue-600 transition-all duration-200 rounded-t ${
                      selectedChartType === 'bar' ? 'w-8' : 'w-1'
                    }`}
                    style={{ height: `${heightPercentage}%` }}
                  />
                  
                  {/* Data Point Label */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {value.toLocaleString()}
                  </div>
                  
                  {/* Period Label */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {'period' in item ? item.period : item.name}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comparison Data (if available) */}
        {showComparison && comparisonData && comparisonData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1/3">
            <div className="h-full flex items-end justify-center space-x-2 p-2">
              {comparisonData.map((item, index) => {
                const value = 'value' in item ? item.value : 0;
                const maxValue = Math.max(...comparisonData.map(d => 'value' in d ? d.value : 0));
                const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                
                return (
                  <div
                    key={index}
                    className="bg-gray-300 hover:bg-gray-400 transition-all duration-200 rounded-t w-6"
                    style={{ height: `${heightPercentage}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow border ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {drillDownLevel > 0 && (
              <button
                onClick={handleBackClick}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Go back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {drillDownLevel > 0 && selectedDataPoint && (
                <p className="text-sm text-gray-600">
                  Drilled into: {'period' in selectedDataPoint ? selectedDataPoint.period : selectedDataPoint.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showComparison && (
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Current</span>
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>Previous</span>
              </div>
            )}
            
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleExport}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Export data"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        className="p-4"
        style={{ height: isFullscreen ? 'calc(100vh - 80px)' : `${height}px` }}
      >
        {renderChart()}
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {data.length} data point{data.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-600">
                Total: {data.reduce((sum, item) => sum + ('value' in item ? item.value : 0), 0).toLocaleString()}
              </span>
            </div>
            
            <div className="text-gray-500">
              {selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Chart
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 