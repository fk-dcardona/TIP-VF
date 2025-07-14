'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import GeneralManagerDashboard from './GeneralManagerDashboard';
import SalesDashboard from './SalesDashboard';
import ProcurementDashboard from './ProcurementDashboard';
import FinanceDashboard from './FinanceDashboard';
import LogisticsDashboard from './LogisticsDashboard';
import { useDashboardData } from '@/hooks/useAPIFetch';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// Sharing components will be added in future updates

interface RoleBasedDashboardProps {
  userId: string;
}

export default function RoleBasedDashboard({ userId }: RoleBasedDashboardProps) {
  const { user } = useUser();
  const [currentRole, setCurrentRole] = useState('general_manager');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'share' | 'invite'>('dashboard');
  
  // Use the new API hook for parallel data fetching
  const { 
    data, 
    loading, 
    error, 
    refetch, 
    retry, 
    isRetrying 
  } = useDashboardData(userId, currentRole);
  
  // Extract dashboard data and insights from the parallel fetch result
  const dashboardData = data?.dashboard || null;
  const insights = data?.insights?.insights || [];
  const analytics = data?.analytics || null;

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    // Data will automatically refetch due to dependency in useDashboardData hook
  };

  const handleShare = (shareData: any) => {
    console.log('Sharing insights:', shareData);
    // In real implementation, this would track sharing analytics
  };

  const handleInviteSent = (invites: any[]) => {
    console.log('Invitations sent:', invites);
    // In real implementation, this would track viral growth metrics
  };

  const renderDashboard = () => {
    // Show loading skeleton while fetching data
    if (loading && !dashboardData) {
      return <DashboardSkeleton />;
    }
    
    // Show error state with retry option
    if (error && !dashboardData) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Failed to load dashboard data</AlertTitle>
          <AlertDescription className="text-red-700">
            {error.message || 'An unexpected error occurred while loading your dashboard.'}
            <div className="mt-4">
              <Button 
                onClick={() => retry()} 
                disabled={isRetrying}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    // Show dashboard with data (even if stale data while reloading)
    const dashboardProps = {
      data: dashboardData || {
        summary: {},
        product_performance: [],
        inventory_alerts: [],
        financial_insights: {},
        key_metrics: {},
        recommendations: []
      },
      userId,
      onDataUpdate: refetch,
      analytics,
      insights
    };

    switch (currentRole) {
      case 'sales':
        return <SalesDashboard {...dashboardProps} />;
      case 'procurement':
        return <ProcurementDashboard {...dashboardProps} />;
      case 'finance':
        return <FinanceDashboard {...dashboardProps} />;
      case 'logistics':
        return <LogisticsDashboard {...dashboardProps} />;
      default:
        return <GeneralManagerDashboard {...dashboardProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supply Chain Intelligence</h1>
            <p className="text-gray-600">Transform your data into strategic insights</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Welcome back,</span>
            <span className="font-medium text-gray-900">{user?.fullName || user?.emailAddresses[0]?.emailAddress}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'share'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🤝 Share Insights
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invite'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🚀 Invite Team
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Role Switcher - Placeholder */}
              <div className="lg:col-span-1">
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="font-medium text-gray-900">Current Role</h3>
                  <p className="text-sm text-gray-600 mt-1">{currentRole}</p>
                </div>
              </div>
              
              {/* Main Dashboard */}
              <div className="lg:col-span-3">
                {renderDashboard()}
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="p-4 bg-white rounded-lg border">
              <h3 className="font-medium text-gray-900">Share Insights</h3>
              <p className="text-sm text-gray-600 mt-1">Sharing functionality coming soon</p>
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="p-4 bg-white rounded-lg border">
              <h3 className="font-medium text-gray-900">Team Management</h3>
              <p className="text-sm text-gray-600 mt-1">Team invite functionality coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a
              href="/dashboard/upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              📤 Upload Data
            </a>
            <a
              href="/dashboard/analytics"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              📈 View Analytics
            </a>
            {/* Refresh button for manual data refresh */}
            <Button
              onClick={() => refetch()}
              disabled={loading}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            {loading ? (
              <span className="flex items-center">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Updating...
              </span>
            ) : (
              `Last updated: ${new Date().toLocaleTimeString()}`
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

