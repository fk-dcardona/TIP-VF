import React from 'react';
import { 
  Home, 
  BarChart3, 
  AlertTriangle, 
  Upload, 
  Settings, 
  Database,
  TrendingUp,
  Package,
  Users,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: string;
}

const navItems: NavItem[] = [
  // Core Dashboard
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'sales-intelligence', label: 'Sales Intelligence', icon: TrendingUp },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  
  // Data Management
  { id: 'upload', label: 'Upload Data', icon: Upload, category: 'Data' },
  { id: 'inventory', label: 'Inventory', icon: Package, category: 'Data' },
  { id: 'sales', label: 'Sales', icon: TrendingUp, category: 'Data' },
  
  // Settings & Tools
  { id: 'database', label: 'Database', icon: Database, category: 'Tools' },
  { id: 'reports', label: 'Reports', icon: FileText, category: 'Tools' },
  { id: 'settings', label: 'Settings', icon: Settings, category: 'Tools' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  onToggleCollapse 
}) => {
  const renderNavItems = (category?: string) => {
    return navItems
      .filter(item => item.category === category)
      .map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors group
              ${isActive 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600' : ''}`} />
            {!isCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </button>
        );
      });
  };

  const renderCoreItems = () => {
    return navItems
      .filter(item => !item.category)
      .map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors group
              ${isActive 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-600' : ''}`} />
            {!isCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </button>
        );
      });
  };

  return (
    <div className={`
      bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Supply Chain</h1>
              <p className="text-xs text-gray-500">Analytics Dashboard</p>
            </div>
          </div>
        )}
        
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Core Dashboard Items */}
        <div className="space-y-1">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Dashboard
            </h3>
          )}
          {renderCoreItems()}
        </div>

        {/* Data Management Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Data Management
            </h3>
          )}
          {renderNavItems('Data')}
        </div>

        {/* Tools & Settings Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Tools & Settings
            </h3>
          )}
          {renderNavItems('Tools')}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@company.com</p>
            </div>
          </div>
          
          <button className="mt-3 flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help & Support
          </button>
        </div>
      )}
    </div>
  );
}; 