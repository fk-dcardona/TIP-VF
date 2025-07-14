'use client';

import { useState, useEffect } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Truck
} from 'lucide-react';
import OrganicDashboard from './DocumentIntelligence/OrganicDashboard';

export default function MainDashboard() {
  const { userId } = useAuth();
  const { organization } = useOrganization();

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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+23% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Speed</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <p className="text-xs text-muted-foreground">Faster this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">+5.2% improvement</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3%</div>
            <p className="text-xs text-muted-foreground">-1.2% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Document Intelligence Living Interface */}
      <OrganicDashboard orgId={organization.id} />
      
      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}