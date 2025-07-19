'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface TeamInviteProps {
  onInviteSent?: (invites: any[]) => void;
}

export default function TeamInvite({ onInviteSent }: TeamInviteProps) {
  const { user } = useUser();
  const [inviteMode, setInviteMode] = useState<'email' | 'link'>('email');
  const [emailInvites, setEmailInvites] = useState([{ email: '', role: 'sales', name: '' }]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const roleOptions = [
    { value: 'general_manager', label: 'General Manager', icon: '👔' },
    { value: 'sales', label: 'Sales Manager', icon: '📈' },
    { value: 'procurement', label: 'Procurement Manager', icon: '📦' },
    { value: 'finance', label: 'Finance Manager', icon: '💰' },
    { value: 'logistics', label: 'Logistics Manager', icon: '🚛' }
  ];

  const addEmailInvite = () => {
    setEmailInvites([...emailInvites, { email: '', role: 'sales', name: '' }]);
  };

  const removeEmailInvite = (index: number) => {
    setEmailInvites(emailInvites.filter((_, i) => i !== index));
  };

  const updateEmailInvite = (index: number, field: string, value: string) => {
    const updated = emailInvites.map((invite, i) => 
      i === index ? { ...invite, [field]: value } : invite
    );
    setEmailInvites(updated);
  };

  const generateInviteMessage = () => {
    const companyName = user?.organizationMemberships?.[0]?.organization?.name || 'our company';
    
    return `🚀 Join ${companyName}'s Supply Chain Intelligence Platform

Hi there!

I've been using our new supply chain analytics platform and the insights are incredible! I thought you'd find it valuable for your role.

Here's what you'll get immediate access to:
✅ Real-time inventory and sales analytics
✅ Role-specific insights and recommendations  
✅ Automated alerts for critical issues
✅ Cross-functional collaboration tools

The platform analyzes our data and provides actionable insights that have already helped us:
• Identify $15K in cash tied up in slow-moving inventory
• Prevent 3 potential stockouts this month
• Optimize our procurement timing for better cash flow

It takes just 2 minutes to upload your data and start getting insights.

Join here: ${inviteLink}

Looking forward to collaborating with better data!

Best regards,
${user?.fullName || user?.emailAddresses[0]?.emailAddress}`;
  };

  const generateInviteLink = () => {
    // In real implementation, this would create a unique invite link
    const mockInviteLink = `${window.location.origin}/invite/${user?.id}/${Date.now()}`;
    setInviteLink(mockInviteLink);
    return mockInviteLink;
  };

  const handleSendInvites = async () => {
    setIsInviting(true);
    
    try {
      if (inviteMode === 'email') {
        // Validate email invites
        const validInvites = emailInvites.filter(invite => 
          invite.email && invite.email.includes('@')
        );
        
        if (validInvites.length === 0) {
          alert('Please enter at least one valid email address.');
          return;
        }

        // In real implementation, this would send actual emails
        const inviteData = validInvites.map(invite => ({
          ...invite,
          invitedBy: user?.fullName || user?.emailAddresses[0]?.emailAddress,
          inviteLink: generateInviteLink(),
          message: inviteMessage || generateInviteMessage()
        }));

        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (onInviteSent) {
          onInviteSent(inviteData);
        }
        
        alert(`Invitations sent to ${validInvites.length} team member${validInvites.length !== 1 ? 's' : ''}!`);
        
      } else {
        // Generate and copy invite link
        const link = generateInviteLink();
        await navigator.clipboard.writeText(link);
        alert('Invite link copied to clipboard!');
      }
      
    } catch (error) {
      console.error('Error sending invites:', error);
      alert('Error sending invitations. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Invite Your Team</h3>
          <p className="text-sm text-gray-600">
            Unlock the full power of collaborative supply chain intelligence
          </p>
        </div>
        <div className="text-3xl">🚀</div>
      </div>

      {/* Value Proposition */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-900 mb-2">🎯 Why Invite Your Team?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-green-800">
            <span className="mr-2">✅</span>
            Cross-functional insights and collaboration
          </div>
          <div className="flex items-center text-green-800">
            <span className="mr-2">✅</span>
            Automated alerts to the right people
          </div>
          <div className="flex items-center text-green-800">
            <span className="mr-2">✅</span>
            Company-wide analytics and benchmarks
          </div>
          <div className="flex items-center text-green-800">
            <span className="mr-2">✅</span>
            Shared action items and accountability
          </div>
        </div>
      </div>

      {/* Invite Mode Selection */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">How would you like to invite?</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setInviteMode('email')}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              inviteMode === 'email'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-2">📧</div>
            <div className="font-medium">Send Email Invites</div>
            <div className="text-xs text-gray-500 mt-1">Personalized invitations</div>
          </button>
          
          <button
            onClick={() => setInviteMode('link')}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              inviteMode === 'link'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-2">🔗</div>
            <div className="font-medium">Share Invite Link</div>
            <div className="text-xs text-gray-500 mt-1">Copy and share anywhere</div>
          </button>
        </div>
      </div>

      {/* Email Invites */}
      {inviteMode === 'email' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Team Member Details</h4>
            <button
              onClick={addEmailInvite}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Another
            </button>
          </div>
          
          <div className="space-y-3">
            {emailInvites.map((invite, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={invite.name}
                      onChange={(e) => updateEmailInvite(index, 'name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={invite.email}
                      onChange={(e) => updateEmailInvite(index, 'email', e.target.value)}
                      placeholder="john@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <div className="flex">
                      <select
                        value={invite.role}
                        onChange={(e) => updateEmailInvite(index, 'role', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {roleOptions.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.icon} {role.label}
                          </option>
                        ))}
                      </select>
                      
                      {emailInvites.length > 1 && (
                        <button
                          onClick={() => removeEmailInvite(index)}
                          className="ml-2 px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Message */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">
          {inviteMode === 'email' ? 'Invitation Message' : 'Message to Share'}
        </h4>
        <textarea
          value={inviteMessage || generateInviteMessage()}
          onChange={(e) => setInviteMessage(e.target.value)}
          className="w-full h-40 p-3 border border-gray-300 rounded-md resize-none text-sm"
          placeholder="Customize your invitation message..."
        />
      </div>

      {/* Team Growth Incentive */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-900 mb-2">🎁 Team Growth Rewards</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="text-purple-800">
            <div className="font-medium">3+ Members</div>
            <div className="text-xs">Unlock advanced analytics</div>
          </div>
          <div className="text-purple-800">
            <div className="font-medium">5+ Members</div>
            <div className="text-xs">Company-wide benchmarks</div>
          </div>
          <div className="text-purple-800">
            <div className="font-medium">10+ Members</div>
            <div className="text-xs">Premium features free</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {inviteMode === 'email' 
            ? `${emailInvites.filter(i => i.email).length} invitation${emailInvites.filter(i => i.email).length !== 1 ? 's' : ''} ready`
            : 'Share link with your team'
          }
        </div>
        
        <button
          onClick={handleSendInvites}
          disabled={isInviting || (inviteMode === 'email' && emailInvites.filter(i => i.email).length === 0)}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            isInviting || (inviteMode === 'email' && emailInvites.filter(i => i.email).length === 0)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isInviting 
            ? 'Sending...' 
            : inviteMode === 'email' 
              ? 'Send Invitations' 
              : 'Copy Invite Link'
          }
        </button>
      </div>

      {/* Success Stories */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">💬 What Teams Are Saying</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="italic">
            "Our procurement and sales teams are finally on the same page. We prevented 3 stockouts this month!" 
            <span className="text-gray-500">- Manufacturing Company</span>
          </div>
          <div className="italic">
            "The cross-functional insights helped us free up $50K in working capital." 
            <span className="text-gray-500">- Distribution Company</span>
          </div>
        </div>
      </div>
    </div>
  );
}

