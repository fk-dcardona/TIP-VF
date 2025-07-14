'use client';

import { useState } from 'react';

interface RoleSwitcherProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  availableRoles?: string[];
}

export default function RoleSwitcher({ currentRole, onRoleChange, availableRoles }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultRoles = [
    'general_manager',
    'sales',
    'procurement', 
    'finance',
    'logistics'
  ];

  const roles = availableRoles || defaultRoles;

  const roleConfig = {
    general_manager: {
      name: 'General Manager',
      icon: '👔',
      color: 'purple',
      description: 'Strategic overview and business decisions',
      focus: 'Overall health, ROI, and strategic opportunities'
    },
    sales: {
      name: 'Sales Manager',
      icon: '📈',
      color: 'green',
      description: 'Revenue optimization and customer satisfaction',
      focus: 'Product availability, margins, and sales opportunities'
    },
    procurement: {
      name: 'Procurement Manager',
      icon: '📦',
      color: 'blue',
      description: 'Supply chain and vendor management',
      focus: 'Reorder timing, supplier performance, and cost optimization'
    },
    finance: {
      name: 'Finance Manager',
      icon: '💰',
      color: 'yellow',
      description: 'Cash flow and financial efficiency',
      focus: 'Working capital, cash tied up, and financial metrics'
    },
    logistics: {
      name: 'Logistics Manager',
      icon: '🚛',
      color: 'orange',
      description: 'Operations and warehouse efficiency',
      focus: 'Inventory movement, storage optimization, and operations'
    }
  };

  const currentRoleConfig = roleConfig[currentRole as keyof typeof roleConfig];

  const getColorClasses = (color: string, isActive: boolean = false) => {
    const colors = {
      purple: isActive ? 'bg-purple-100 border-purple-500 text-purple-900' : 'hover:bg-purple-50 border-purple-200',
      green: isActive ? 'bg-green-100 border-green-500 text-green-900' : 'hover:bg-green-50 border-green-200',
      blue: isActive ? 'bg-blue-100 border-blue-500 text-blue-900' : 'hover:bg-blue-50 border-blue-200',
      yellow: isActive ? 'bg-yellow-100 border-yellow-500 text-yellow-900' : 'hover:bg-yellow-50 border-yellow-200',
      orange: isActive ? 'bg-orange-100 border-orange-500 text-orange-900' : 'hover:bg-orange-50 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleRoleChange = (newRole: string) => {
    onRoleChange(newRole);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Current Role Display */}
      <div className={`p-4 rounded-lg border-2 ${getColorClasses(currentRoleConfig?.color || 'blue', true)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{currentRoleConfig?.icon}</span>
            <div>
              <h3 className="font-semibold text-lg">{currentRoleConfig?.name}</h3>
              <p className="text-sm opacity-80">{currentRoleConfig?.description}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1 text-sm font-medium rounded-md border border-current opacity-80 hover:opacity-100 transition-opacity"
          >
            Switch View
          </button>
        </div>
        
        <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md">
          <p className="text-sm font-medium mb-1">Current Focus:</p>
          <p className="text-sm">{currentRoleConfig?.focus}</p>
        </div>
      </div>

      {/* Role Selection Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-1">Switch Perspective</h4>
            <p className="text-sm text-gray-600">See how other roles view the same data</p>
          </div>
          
          <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
            {roles.map((role) => {
              const config = roleConfig[role as keyof typeof roleConfig];
              const isActive = role === currentRole;
              
              return (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  disabled={isActive}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    isActive 
                      ? `${getColorClasses(config?.color || 'blue', true)} cursor-default`
                      : `${getColorClasses(config?.color || 'blue')} border-gray-200 text-gray-700 hover:text-gray-900`
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">{config?.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{config?.name}</h5>
                        {isActive && (
                          <span className="text-xs px-2 py-1 bg-current bg-opacity-20 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-75 mt-1">{config?.description}</p>
                      <p className="text-xs opacity-60 mt-1">Focus: {config?.focus}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">💡 Pro Tip</p>
                <p className="text-xs text-gray-600">Each role sees different priorities and insights</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Prompt */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center">
          <span className="text-lg mr-2">🤝</span>
          <div>
            <p className="text-sm font-medium text-blue-900">Cross-Functional Insights</p>
            <p className="text-xs text-blue-700">
              Switch roles to understand how your insights impact other departments
            </p>
          </div>
        </div>
      </div>

      {/* Role Comparison Hint */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

