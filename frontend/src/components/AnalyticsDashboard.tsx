'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface AnalyticsDashboardProps {
  userId: string;
}

interface DashboardMetrics {
  total_inventory: string;
  order_fulfillment: string;
  avg_delivery_time: string;
  active_suppliers: number;
  trends: {
    inventory_change: string;
    fulfillment_change: string;
    delivery_change: string;
    supplier_change: string;
  };
}

interface RecentActivity {
  product: string;
  supplier: string;
  quantity: string;
  status: string;
  date: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  charts: {
    inventory_trends: Array<{ date: string; value: number }>;
    supplier_performance: Array<{ name: string; performance: number; deliveries: number }>;
  };
  recent_activity: RecentActivity[];
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const uploadId = searchParams.get('upload');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        if (!apiUrl) {
          throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
        }
        
        let endpoint;
        if (uploadId) {
          endpoint = `${apiUrl}/upload/${uploadId}`;
        } else {
          endpoint = `${apiUrl}/dashboard/${userId}`;
        }
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        
        if (uploadId) {
          // Handle single upload analytics
          setDashboardData({
            metrics: {
              total_inventory: data.analytics?.summary?.analytics?.total_inventory ? 
                `$${(data.analytics.summary.analytics.total_inventory / 1000000).toFixed(1)}M` : 'N/A',
              order_fulfillment: 'N/A',
              avg_delivery_time: 'N/A',
              active_suppliers: data.analytics?.summary?.analytics?.total_suppliers || 0,
              trends: {
                inventory_change: 'N/A',
                fulfillment_change: 'N/A',
                delivery_change: 'N/A',
                supplier_change: 'N/A'
              }
            },
            charts: {
              inventory_trends: [],
              supplier_performance: []
            },
            recent_activity: []
          });
        } else {
          // Handle dashboard analytics
          setDashboardData(data);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, uploadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium">Error loading analytics</h3>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-yellow-800 font-medium">No data available</h3>
        <p className="text-yellow-600 mt-2">Upload some data files to see analytics.</p>
      </div>
    );
  }

  const { metrics, charts, recent_activity } = dashboardData;

  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Inventory</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.total_inventory}</p>
              <p className="text-sm text-green-600">{metrics.trends.inventory_change} from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Order Fulfillment</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.order_fulfillment}</p>
              <p className="text-sm text-green-600">{metrics.trends.fulfillment_change} from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Delivery Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.avg_delivery_time}</p>
              <p className="text-sm text-red-600">{metrics.trends.delivery_change} from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.active_suppliers}</p>
              <p className="text-sm text-green-600">{metrics.trends.supplier_change} this month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Trends</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500">Chart will appear here</p>
              <p className="text-sm text-gray-400 mt-1">Upload data to see trends</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Performance</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <p className="text-gray-500">Chart will appear here</p>
              <p className="text-sm text-gray-400 mt-1">Upload data to see performance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-blue-600 hover:text-blue-800 font-medium">View All</button>
        </div>
        
        {recent_activity.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Upload data to see activity</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider text-sm">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider text-sm">Supplier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider text-sm">Quantity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider text-sm">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recent_activity.map((activity, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{activity.product}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{activity.supplier}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{activity.quantity}</td>
                    <td className="py-4 px-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        activity.status === 'In Transit' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

