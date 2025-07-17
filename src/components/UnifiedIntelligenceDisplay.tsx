'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedIntelligenceDisplayProps {
  unifiedIntelligence: any;
  analytics: any;
  compromisedInventory: any;
  triangle4dScore: any;
  realTimeAlerts: any[];
  onAlertAction?: (alertId: string, action: string) => void;
}

export default function UnifiedIntelligenceDisplay({
  unifiedIntelligence,
  analytics,
  compromisedInventory,
  triangle4dScore,
  realTimeAlerts,
  onAlertAction
}: UnifiedIntelligenceDisplayProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedAlerts, setExpandedAlerts] = useState<string[]>([]);

  const toggleAlert = (alertId: string) => {
    setExpandedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleAlertAction = (alertId: string, action: string) => {
    onAlertAction?.(alertId, action);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAlertSeverity = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 4D Triangle Score */}
      {triangle4dScore && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">4D Intelligence Triangle</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${getScoreColor(triangle4dScore.service || 0)}`}>
                <span className="text-lg font-bold">{triangle4dScore.service || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">Service</p>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${getScoreColor(triangle4dScore.cost || 0)}`}>
                <span className="text-lg font-bold">{triangle4dScore.cost || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">Cost</p>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${getScoreColor(triangle4dScore.capital || 0)}`}>
                <span className="text-lg font-bold">{triangle4dScore.capital || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">Capital</p>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${getScoreColor(triangle4dScore.document || 0)}`}>
                <span className="text-lg font-bold">{triangle4dScore.document || 0}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">Document</p>
            </div>
          </div>
          {triangle4dScore.insights && (
            <div className="mt-4 p-3 bg-white rounded-md border border-blue-100">
              <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {triangle4dScore.insights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Real-time Alerts */}
      {realTimeAlerts && realTimeAlerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Real-time Alerts</h2>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded-full">
              {realTimeAlerts.length} Active
            </span>
          </div>
          <div className="space-y-3">
            {realTimeAlerts.map((alert, index) => (
              <motion.div
                key={alert.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-lg p-4 ${getAlertSeverity(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="font-medium">{alert.title}</span>
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.message}</p>
                    {alert.details && (
                      <button
                        onClick={() => toggleAlert(alert.id || index.toString())}
                        className="text-sm underline hover:no-underline"
                      >
                        {expandedAlerts.includes(alert.id || index.toString()) ? 'Hide' : 'Show'} details
                      </button>
                    )}
                    <AnimatePresence>
                      {expandedAlerts.includes(alert.id || index.toString()) && alert.details && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-white bg-opacity-50 rounded text-sm"
                        >
                          <pre className="whitespace-pre-wrap">{JSON.stringify(alert.details, null, 2)}</pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {alert.actions && (
                    <div className="ml-4 flex space-x-2">
                      {alert.actions.map((action: string) => (
                        <button
                          key={action}
                          onClick={() => handleAlertAction(alert.id || index.toString(), action)}
                          className="px-3 py-1 text-xs bg-white bg-opacity-70 rounded border hover:bg-opacity-90 transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Compromised Inventory */}
      {compromisedInventory && Object.keys(compromisedInventory).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Compromised Inventory Analysis</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {compromisedInventory.products && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">At-Risk Products</h3>
                <div className="space-y-2">
                  {compromisedInventory.products.map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-gray-900">{product.sku}</p>
                        <p className="text-sm text-gray-600">{product.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          {product.compromised_quantity} units
                        </p>
                        <p className="text-xs text-gray-500">
                          ${product.estimated_loss?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {compromisedInventory.summary && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Risk Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total At-Risk Value:</span>
                    <span className="font-medium text-red-600">
                      ${compromisedInventory.summary.total_at_risk_value?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Affected Products:</span>
                    <span className="font-medium">{compromisedInventory.summary.affected_products || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Risk Level:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      compromisedInventory.summary.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                      compromisedInventory.summary.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {compromisedInventory.summary.risk_level || 'low'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tabbed Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'documents', label: 'Document Intelligence' },
              { id: 'recommendations', label: 'Recommendations' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Processing Summary</h3>
                    <p className="text-sm text-gray-600">
                      {unifiedIntelligence?.processing_timestamp ? 
                        `Processed at ${new Date(unifiedIntelligence.processing_timestamp).toLocaleString()}` :
                        'Processing completed'
                      }
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Data Sources</h3>
                    <p className="text-sm text-gray-600">
                      {analytics ? 'CSV/Excel Analytics' : ''}
                      {analytics && unifiedIntelligence?.document_cross_reference ? ' + ' : ''}
                      {unifiedIntelligence?.document_cross_reference ? 'Document Intelligence' : ''}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Intelligence Level</h3>
                    <p className="text-sm text-gray-600">
                      {unifiedIntelligence?.document_cross_reference ? '4D Unified' : '3D Analytics'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'analytics' && analytics && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(analytics, null, 2)}
                </pre>
              </motion.div>
            )}
            
            {activeTab === 'documents' && unifiedIntelligence?.document_cross_reference && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(unifiedIntelligence.document_cross_reference, null, 2)}
                </pre>
              </motion.div>
            )}
            
            {activeTab === 'recommendations' && unifiedIntelligence?.enhanced_recommendations && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {unifiedIntelligence.enhanced_recommendations.map((rec: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    {rec.impact && (
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-500">Impact:</span>
                        <span className={`px-2 py-1 rounded-full ${
                          rec.impact === 'high' ? 'bg-green-100 text-green-800' :
                          rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.impact}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 