'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import GeneralManagerDashboard from './dashboards/GeneralManagerDashboard';
import SalesDashboard from './dashboards/SalesDashboard';
import ProcurementDashboard from './dashboards/ProcurementDashboard';
import FinanceDashboard from './dashboards/FinanceDashboard';
import LogisticsDashboard from './dashboards/LogisticsDashboard';
import RoleSwitcher from './sharing/RoleSwitcher';
import ShareInsights from './sharing/ShareInsights';
import TeamInvite from './sharing/TeamInvite';

interface RoleBasedDashboardProps {
  userId: string;
}

export default function RoleBasedDashboard({ userId }: RoleBasedDashboardProps) {
  const { user } = useUser();
  const [currentRole, setCurrentRole] = useState('general_manager');
  const [dashboardData, setDashboardData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'share' | 'invite'>('dashboard');

  useEffect(() => {
    fetchDashboardData();
  }, [userId, currentRole]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data
      const dashboardResponse = await fetch(`/api/dashboard/${userId}?role=${currentRole}`);
      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json();
        setDashboardData(data);
      }

      // Fetch insights
      const insightsResponse = await fetch(`/api/insights/${userId}?role=${currentRole}`);
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || []);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
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
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const dashboardProps = {
      data: dashboardData,
      userId,
      onDataUpdate: fetchDashboardData
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
              {/* Role Switcher */}
              <div className="lg:col-span-1">
                <RoleSwitcher 
                  currentRole={currentRole} 
                  onRoleChange={handleRoleChange}
                />
              </div>
              
              {/* Main Dashboard */}
              <div className="lg:col-span-3">
                {renderDashboard()}
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <ShareInsights 
              insights={insights}
              role={currentRole}
              onShare={handleShare}
            />
          )}

          {activeTab === 'invite' && (
            <TeamInvite onInviteSent={handleInviteSent} />
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
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

