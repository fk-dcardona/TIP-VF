'use client';

import { useState, useEffect } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  Users, 
  FileText, 
  Upload,
  Zap,
  Bot,
  DollarSign,
  ShoppingCart,
  Truck,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Settings,
  RefreshCw
} from 'lucide-react';
import OrganicDashboard from './DocumentIntelligence/OrganicDashboard';
import DiagnosticsOverlay from './DiagnosticsOverlay';
import { checkAPIHealth, APIHealth } from '@/lib/api';
import { useAPIFetch } from '@/hooks/useAPIFetch';
import { apiClient } from '@/lib/api-client';

interface DashboardData {
  total_documents?: number;
  documents_trend?: number;
  processing_speed?: number;
  speed_trend?: number;
  automation_rate?: number;
  automation_trend?: number;
  error_rate?: number;
  error_trend?: number;
}

export default function MainDashboard() {
  const { userId } = useAuth();
  const { organization } = useOrganization();
  const [apiHealth, setApiHealth] = useState<APIHealth | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Add real data fetching for KPI metrics
  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useAPIFetch<DashboardData>(
    () => apiClient.getDashboardData(organization?.id || ''),
    [organization?.id],
    {
      cacheKey: `dashboard-kpi-${organization?.id}`,
      retryOnError: true
    }
  );

  // Check API health on component mount
  useEffect(() => {
    if (organization) {
      checkHealth();
    }
  }, [organization]);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await checkAPIHealth();
      setApiHealth(health);
    } catch (error) {
      setApiHealth({
        status: 'unhealthy',
        responseTime: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  if (!organization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Welcome to Supply Chain Intelligence</h2>
        <p className="text-gray-600">Please select or create an organization to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Health Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {apiHealth?.status === 'healthy' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : apiHealth?.status === 'unhealthy' ? (
            <WifiOff className="h-4 w-4 text-red-500" />
          ) : (
            <Wifi className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">API Status:</span>
          <Badge 
            variant={apiHealth?.status === 'healthy' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {apiHealth?.status || 'Checking...'}
          </Badge>
          {apiHealth?.responseTime && (
            <span className="text-xs text-gray-500">
              ({apiHealth.responseTime}ms)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            disabled={isCheckingHealth}
          >
            <RefreshCw className={`h-4 w-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiagnostics(true)}
            >
              <Settings className="h-4 w-4" />
              Diagnostics
            </Button>
          )}
        </div>
      </div>

      {/* API Error Alert */}
      {apiHealth?.status === 'unhealthy' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">API Connection Issue</AlertTitle>
          <AlertDescription className="text-red-700">
            <p className="mb-2">
              Unable to connect to the backend server. Some features may not work properly.
            </p>
            {apiHealth.error && (
              <p className="text-sm mb-2">
                <strong>Error:</strong> {apiHealth.error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={checkHealth}
                disabled={isCheckingHealth}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                Retry Connection
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDiagnostics(true)}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Settings className="h-4 w-4" />
                  View Diagnostics
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : dashboardError ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-400">No data</div>
                <p className="text-xs text-red-500">Failed to load</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.total_documents == null ? (
                    <span className="text-gray-400">No data</span>
                  ) : (
                    dashboardData.total_documents.toLocaleString()
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.documents_trend != null ? 
                    `${dashboardData.documents_trend > 0 ? '+' : ''}${dashboardData.documents_trend}% from last month` : 
                    'No trend data available'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Speed</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : dashboardError ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-400">No data</div>
                <p className="text-xs text-red-500">Failed to load</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.processing_speed == null ? (
                    <span className="text-gray-400">No data</span>
                  ) : (
                    `${dashboardData.processing_speed}%`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.speed_trend != null ? 
                    `${dashboardData.speed_trend > 0 ? 'Faster' : 'Slower'} this week` : 
                    'No trend data available'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : dashboardError ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-400">No data</div>
                <p className="text-xs text-red-500">Failed to load</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.automation_rate == null ? (
                    <span className="text-gray-400">No data</span>
                  ) : (
                    `${dashboardData.automation_rate}%`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.automation_trend != null ? 
                    `${dashboardData.automation_trend > 0 ? '+' : ''}${dashboardData.automation_trend}% improvement` : 
                    'No trend data available'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : dashboardError ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-400">No data</div>
                <p className="text-xs text-red-500">Failed to load</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.error_rate == null ? (
                    <span className="text-gray-400">No data</span>
                  ) : (
                    `${dashboardData.error_rate}%`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.error_trend != null ? 
                    `${dashboardData.error_trend < 0 ? '' : '+'}${dashboardData.error_trend}% ${dashboardData.error_trend < 0 ? 'improvement' : 'increase'}` : 
                    'No trend data available'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Intelligence Living Interface */}
      <OrganicDashboard orgId={organization.id} />
      
      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-6 w-6 mr-2 text-green-600" />
              Upload CSV Data
            </CardTitle>
            <CardDescription>
              Upload inventory and sales data for instant analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = '/dashboard/upload'}
            >
              Upload Data
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-green-600" />
              Finance Dashboard
            </CardTitle>
            <CardDescription>
              Financial analytics and cash flow management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/dashboard/finance'}
            >
              View Finance
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-6 w-6 mr-2 text-blue-600" />
              Sales Dashboard
            </CardTitle>
            <CardDescription>
              Sales performance and customer analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/dashboard/sales'}
            >
              View Sales
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-6 w-6 mr-2 text-purple-600" />
              Procurement Dashboard
            </CardTitle>
            <CardDescription>
              Supplier management and procurement analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/dashboard/procurement'}
            >
              View Procurement
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-6 w-6 mr-2 text-orange-600" />
              Inventory Dashboard
            </CardTitle>
            <CardDescription>
              Inventory levels and stock management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/dashboard/inventory'}
            >
              View Inventory
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="h-6 w-6 mr-2 text-blue-600" />
              Agent Management
            </CardTitle>
            <CardDescription>
              AI agents for supply chain automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/dashboard/agents'}
            >
              Manage Agents
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-6 w-6 mr-2 text-gray-600" />
              Team Management
            </CardTitle>
            <CardDescription>
              User roles and team collaboration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/dashboard/team'}
            >
              Manage Team
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-20 flex flex-col items-center justify-center space-y-2">
            <Upload className="h-6 w-6" />
            <span>Upload Documents</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <BarChart3 className="h-6 w-6" />
            <span>View Analytics</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <Bot className="h-6 w-6" />
            <span>Create Agent</span>
          </Button>
        </CardContent>
      </Card>

      {/* Diagnostics Overlay */}
      <DiagnosticsOverlay 
        isVisible={showDiagnostics} 
        onClose={() => setShowDiagnostics(false)} 
      />
    </div>
  );
}