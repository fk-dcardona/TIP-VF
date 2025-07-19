'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface ShareInsightsProps {
  insights: any[];
  role: string;
  onShare?: (shareData: any) => void;
}

export default function ShareInsights({ insights, role, onShare }: ShareInsightsProps) {
  const { user } = useUser();
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [shareMode, setShareMode] = useState<'email' | 'link' | 'whatsapp'>('link');
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const roleDisplayNames = {
    'general_manager': 'General Manager',
    'sales': 'Sales Manager',
    'procurement': 'Procurement Manager',
    'finance': 'Finance Manager',
    'logistics': 'Logistics Manager'
  };

  const handleInsightToggle = (insightId: string) => {
    setSelectedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  const generateShareMessage = () => {
    const roleName = roleDisplayNames[role as keyof typeof roleDisplayNames] || role;
    const selectedCount = selectedInsights.length;
    
    return `📊 Supply Chain Insights from ${roleName}

I've identified ${selectedCount} key insights from our latest data analysis that require attention:

${insights
  .filter((_, index) => selectedInsights.includes(index.toString()))
  .map((insight, index) => `${index + 1}. ${insight.title}\n   ${insight.description}`)
  .join('\n\n')}

These insights could help optimize our operations and improve efficiency. Let's discuss how we can act on these findings.

View full analysis: ${shareUrl}

#SupplyChain #DataDriven #Collaboration`;
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      // Generate share URL (in real implementation, this would create a shareable link)
      const mockShareUrl = `${window.location.origin}/shared-insights/${user?.id}/${Date.now()}`;
      setShareUrl(mockShareUrl);
      
      const shareData = {
        insights: insights.filter((_, index) => selectedInsights.includes(index.toString())),
        role,
        sharedBy: user?.fullName || user?.emailAddresses[0]?.emailAddress,
        shareUrl: mockShareUrl,
        message: shareMessage || generateShareMessage()
      };

      if (shareMode === 'whatsapp') {
        const whatsappMessage = encodeURIComponent(shareData.message);
        window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
      } else if (shareMode === 'email') {
        const emailSubject = encodeURIComponent('Supply Chain Insights - Action Required');
        const emailBody = encodeURIComponent(shareData.message);
        window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, '_blank');
      } else {
        // Copy link to clipboard
        await navigator.clipboard.writeText(mockShareUrl);
        alert('Share link copied to clipboard!');
      }

      if (onShare) {
        onShare(shareData);
      }
      
    } catch (error) {
      console.error('Error sharing insights:', error);
      alert('Error sharing insights. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    setShareMessage(generateShareMessage());
  }, [selectedInsights, role, insights]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📋';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Share Insights</h3>
          <p className="text-sm text-gray-600">
            Collaborate with your team by sharing key findings
          </p>
        </div>
        <div className="text-3xl">🤝</div>
      </div>

      {/* Role Context */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center">
          <div className="text-2xl mr-3">👤</div>
          <div>
            <p className="font-medium text-blue-900">
              Sharing as: {roleDisplayNames[role as keyof typeof roleDisplayNames] || role}
            </p>
            <p className="text-sm text-blue-700">
              Your insights will be contextualized for cross-functional collaboration
            </p>
          </div>
        </div>
      </div>

      {/* Insights Selection */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Select insights to share:</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedInsights.includes(index.toString())
                  ? `${getPriorityColor(insight.priority)} border-opacity-100`
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              onClick={() => handleInsightToggle(index.toString())}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{getPriorityIcon(insight.priority)}</span>
                    <span className="font-medium text-gray-900">{insight.title}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      insight.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      insight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                  {insight.impact && (
                    <p className="text-xs text-gray-500 mt-1">
                      Impact: {insight.impact}
                    </p>
                  )}
                </div>
                <div className="ml-3">
                  <input
                    type="checkbox"
                    checked={selectedInsights.includes(index.toString())}
                    onChange={() => handleInsightToggle(index.toString())}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Mode Selection */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">How would you like to share?</h4>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShareMode('link')}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              shareMode === 'link'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-1">🔗</div>
            <div className="text-sm font-medium">Copy Link</div>
            <div className="text-xs text-gray-500">Share via any platform</div>
          </button>
          
          <button
            onClick={() => setShareMode('email')}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              shareMode === 'email'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-1">📧</div>
            <div className="text-sm font-medium">Email</div>
            <div className="text-xs text-gray-500">Send via email</div>
          </button>
          
          <button
            onClick={() => setShareMode('whatsapp')}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              shareMode === 'whatsapp'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-1">💬</div>
            <div className="text-sm font-medium">WhatsApp</div>
            <div className="text-xs text-gray-500">Share instantly</div>
          </button>
        </div>
      </div>

      {/* Message Preview */}
      {selectedInsights.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Message Preview:</h4>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none text-sm"
              placeholder="Customize your message..."
            />
          </div>
        </div>
      )}

      {/* Collaboration Tips */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-900 mb-2">💡 Collaboration Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Include specific action items and deadlines</li>
          <li>• Tag relevant team members for accountability</li>
          <li>• Follow up with a meeting to discuss implementation</li>
          <li>• Share the full dashboard link for deeper analysis</li>
        </ul>
      </div>

      {/* Share Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedInsights.length} insight{selectedInsights.length !== 1 ? 's' : ''} selected
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setSelectedInsights([])}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear Selection
          </button>
          
          <button
            onClick={handleShare}
            disabled={selectedInsights.length === 0 || isSharing}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              selectedInsights.length === 0 || isSharing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSharing ? 'Sharing...' : `Share ${selectedInsights.length} Insight${selectedInsights.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Viral Growth Incentive */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">🚀 Unlock Team Insights</h4>
            <p className="text-sm text-purple-700">
              When 3+ team members join, unlock advanced collaboration features and company-wide analytics
            </p>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors">
            Invite Team
          </button>
        </div>
      </div>
    </div>
  );
}

