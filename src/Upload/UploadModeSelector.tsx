import React from 'react';
import { Calendar, Upload, TrendingUp, BarChart3 } from 'lucide-react';

interface UploadModeSelectorProps {
  onModeSelect: (mode: 'simple' | 'multi') => void;
}

export const UploadModeSelector: React.FC<UploadModeSelectorProps> = ({ onModeSelect }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Choose Upload Mode</h2>
        <p className="text-gray-600">
          Select how you want to upload your inventory data for analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simple Upload Mode */}
        <div 
          onClick={() => onModeSelect('simple')}
          className="bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 group"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Simple Upload</h3>
            </div>
            
            <p className="text-gray-600">
              Upload one inventory file and one sales file for current analysis
            </p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Quick setup (2 files)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Current inventory analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Basic supply chain metrics</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Recommended for first-time users
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Period Upload Mode */}
        <div 
          onClick={() => onModeSelect('multi')}
          className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all duration-200 group"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Multi-Period Analysis</h3>
            </div>
            
            <p className="text-gray-600">
              Upload inventory files from multiple months for advanced trend analysis
            </p>
            
                         <div className="space-y-2 text-sm text-gray-500">
               <div className="flex items-center space-x-2">
                 <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                 <span>Upload 6 monthly inventory files (2025)</span>
               </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span>Historical trend analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span>Seasonal pattern detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span>Advanced forecasting</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-purple-100">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Advanced Analytics
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
          Why Multi-Period Analysis?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="space-y-1">
            <div className="font-medium text-gray-900">📈 Trend Detection</div>
            <div>Identify which products are growing or declining over time</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-gray-900">🔄 Seasonal Patterns</div>
            <div>Discover seasonal demand fluctuations for better planning</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-gray-900">🎯 Optimization</div>
            <div>Optimize inventory levels based on historical performance</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 