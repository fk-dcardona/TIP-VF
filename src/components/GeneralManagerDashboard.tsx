'use client';

import { useState } from 'react';

interface GeneralManagerDashboardProps {
  data: {
    summary: any;
    product_performance: any[];
    inventory_alerts: any[];
    financial_insights: any;
    key_metrics: any;
    recommendations: string[];
  };
}

export default function GeneralManagerDashboard({ data }: GeneralManagerDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const { summary, product_performance, inventory_alerts, financial_insights, key_metrics, recommendations } = data;

  // Calculate key executive metrics
  const criticalIssues = inventory_alerts.filter(alert => alert.alert_level === 'critical').length;
  const topProducts = product_performance.slice(0, 3);
  const healthScore = summary?.overall_health_score || 0;
  const totalValue = financial_insights?.total_inventory_value || 0;

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Executive Dashboard</h2>
            <p className="text-blue-100">Strategic overview of supply chain performance</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">${(totalValue / 1000).toFixed(0)}K</div>
            <div className="text-blue-200">Total Inventory Value</div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Supply Chain Health Score */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Health Score</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl font-bold text-gray-900">{healthScore}</span>
                <span className="text-gray-500 ml-1">/100</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getHealthScoreColor(healthScore)}`}>
                {getHealthScoreText(healthScore)}
              </span>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        {/* Critical Issues */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl font-bold text-gray-900">{criticalIssues}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                criticalIssues === 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {criticalIssues === 0 ? 'All Clear' : 'Needs Attention'}
              </span>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </div>

        {/* Working Capital Efficiency */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Capital Efficiency</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl font-bold text-gray-900">
                  {(financial_insights?.working_capital_efficiency || 0).toFixed(1)}x
                </span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                (financial_insights?.working_capital_efficiency || 0) > 0.5 ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
              }`}>
                {(financial_insights?.working_capital_efficiency || 0) > 0.5 ? 'Efficient' : 'Optimize'}
              </span>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl font-bold text-gray-900">{key_metrics?.total_products || 0}</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 text-blue-600 bg-blue-100">
                Portfolio
              </span>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performing Products</h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-500">ROI: {product.roi_percentage}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {product.sales_velocity.toFixed(1)} units/day
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.days_of_stock} days stock
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Strategic Recommendations</h3>
          <div className="space-y-3">
            {recommendations.slice(0, 4).map((recommendation, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💼 Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${(financial_insights?.total_inventory_value || 0).toLocaleString()}
            </div>
            <p className="text-sm text-green-700 mt-1">Total Inventory Value</p>
            <p className="text-xs text-green-600 mt-2">Cash tied in inventory</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${(financial_insights?.monthly_burn_rate || 0).toLocaleString()}
            </div>
            <p className="text-sm text-blue-700 mt-1">Monthly Burn Rate</p>
            <p className="text-xs text-blue-600 mt-2">Inventory consumption</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {(financial_insights?.inventory_to_sales_ratio || 0).toFixed(1)}x
            </div>
            <p className="text-sm text-purple-700 mt-1">Inventory to Sales Ratio</p>
            <p className="text-xs text-purple-600 mt-2">Efficiency metric</p>
          </div>
        </div>
      </div>

      {/* Key Insight Banner */}
      {summary?.key_insight && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="text-2xl mr-4">🎯</div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Key Insight</h4>
              <p className="text-orange-100">{summary.key_insight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📊</div>
            <p className="font-medium text-gray-900">View Detailed Analytics</p>
            <p className="text-sm text-gray-500">Deep dive into performance metrics</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">📈</div>
            <p className="font-medium text-gray-900">Sales Performance</p>
            <p className="text-sm text-gray-500">Review sales team metrics</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-lg mb-2">💰</div>
            <p className="font-medium text-gray-900">Financial Reports</p>
            <p className="text-sm text-gray-500">Cash flow and profitability</p>
          </button>
        </div>
      </div>
    </div>
  );
}

