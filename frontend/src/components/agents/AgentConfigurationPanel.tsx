'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle, 
  Bell,
  Clock,
  Zap,
  Sliders,
  Calendar,
  Mail,
  MessageSquare,
  Webhook,
  Plus,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Agent, 
  AgentConfiguration, 
  AgentTrigger, 
  NotificationSettings, 
  ScheduleSettings,
  AgentUpdateRequest 
} from '@/types/agent';
import { agentApiClient } from '@/lib/agent-api-client';

interface AgentConfigurationPanelProps {
  agent: Agent;
  onUpdate: (agent: Agent) => void;
  onClose: () => void;
}

export function AgentConfigurationPanel({ agent, onUpdate, onClose }: AgentConfigurationPanelProps) {
  const [config, setConfig] = useState<AgentConfiguration>(agent.configuration);
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setHasChanges(
      name !== agent.name || 
      description !== agent.description || 
      JSON.stringify(config) !== JSON.stringify(agent.configuration)
    );
  }, [name, description, config, agent]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateRequest: AgentUpdateRequest = {
        name,
        description,
        configuration: config
      };

      const response = await agentApiClient.updateAgent(agent.id, updateRequest);
      
      if (response.success && response.agent) {
        onUpdate(response.agent);
        setSuccess('Agent configuration updated successfully');
        setHasChanges(false);
      } else {
        setError(response.error || 'Failed to update agent');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setName(agent.name);
    setDescription(agent.description);
    setConfig(agent.configuration);
    setHasChanges(false);
    setError(null);
    setSuccess(null);
  };

  const updateConfig = (key: keyof AgentConfiguration, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSchedule = (updates: Partial<ScheduleSettings>) => {
    setConfig(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        ...updates
      }
    }));
  };

  const updateNotifications = (updates: Partial<NotificationSettings>) => {
    setConfig(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        ...updates
      }
    }));
  };

  const updateParameters = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  };

  const updateThresholds = (key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: value
      }
    }));
  };

  const updateEnhancedEngineSettings = (updates: Partial<AgentConfiguration['enhanced_engine_settings']>) => {
    setConfig(prev => ({
      ...prev,
      enhanced_engine_settings: {
        ...prev.enhanced_engine_settings,
        ...updates
      }
    }));
  };

  const addTrigger = () => {
    const newTrigger: AgentTrigger = {
      type: 'threshold',
      condition: { field: '', operator: 'greater_than', value: 0 },
      enabled: true
    };
    
    setConfig(prev => ({
      ...prev,
      triggers: [...(prev.triggers || []), newTrigger]
    }));
  };

  const removeTrigger = (index: number) => {
    setConfig(prev => ({
      ...prev,
      triggers: prev.triggers?.filter((_, i) => i !== index) || []
    }));
  };

  const updateTrigger = (index: number, updates: Partial<AgentTrigger>) => {
    setConfig(prev => ({
      ...prev,
      triggers: prev.triggers?.map((trigger, i) => 
        i === index ? { ...trigger, ...updates } : trigger
      ) || []
    }));
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory_monitor': return '📦';
      case 'supplier_evaluator': return '🏢';
      case 'demand_forecaster': return '📈';
      case 'document_intelligence': return '📄';
      default: return '🤖';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getAgentTypeIcon(agent.type)}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configure Agent</h2>
              <p className="text-gray-600">{agent.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div className="text-red-800">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-green-800">{success}</div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter agent description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule Configuration
              </CardTitle>
              <CardDescription>
                Configure when and how often the agent runs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    className="w-full p-2 border rounded-md"
                    value={config.schedule?.frequency || 'daily'}
                    onChange={(e) => updateSchedule({ 
                      frequency: e.target.value as 'realtime' | 'hourly' | 'daily' | 'weekly' 
                    })}
                  >
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={config.schedule?.time || '09:00'}
                    onChange={(e) => updateSchedule({ time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="w-full p-2 border rounded-md"
                  value={config.schedule?.timezone || 'UTC'}
                  onChange={(e) => updateSchedule({ timezone: e.target.value })}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you want to be notified about agent activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="email">Email Notifications</Label>
                </div>
                <Switch
                  id="email"
                  checked={config.notifications?.email || false}
                  onCheckedChange={(checked) => updateNotifications({ email: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="slack">Slack Notifications</Label>
                </div>
                <Switch
                  id="slack"
                  checked={config.notifications?.slack || false}
                  onCheckedChange={(checked) => updateNotifications({ slack: checked })}
                />
              </div>

              {config.notifications?.slack && (
                <div>
                  <Label htmlFor="channels">Slack Channels</Label>
                  <Input
                    id="channels"
                    placeholder="Enter comma-separated channel names"
                    value={config.notifications?.channels?.join(', ') || ''}
                    onChange={(e) => updateNotifications({ 
                      channels: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
                    })}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="webhook">Webhook URL</Label>
                <div className="flex items-center space-x-2">
                  <Webhook className="h-4 w-4 text-gray-500" />
                  <Input
                    id="webhook"
                    placeholder="https://your-webhook-url.com"
                    value={config.notifications?.webhook || ''}
                    onChange={(e) => updateNotifications({ webhook: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sliders className="h-5 w-5 mr-2" />
                Parameters
              </CardTitle>
              <CardDescription>
                Agent-specific configuration parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(config.parameters || {}).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={key} className="capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    id={key}
                    value={value}
                    onChange={(e) => updateParameters(key, e.target.value)}
                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Enhanced Engine Settings - Document Intelligence Agent */}
          {agent.type === 'document_intelligence' && config.enhanced_engine_settings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Enhanced Engine Settings
                </CardTitle>
                <CardDescription>
                  Advanced configuration for Document Intelligence Agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="cross_reference">Cross-Reference Engine</Label>
                  </div>
                  <Switch
                    id="cross_reference"
                    checked={config.enhanced_engine_settings.cross_reference_enabled || false}
                    onCheckedChange={(checked) => updateEnhancedEngineSettings({ cross_reference_enabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="compliance_monitoring">Compliance Monitoring</Label>
                  </div>
                  <Switch
                    id="compliance_monitoring"
                    checked={config.enhanced_engine_settings.compliance_monitoring || false}
                    onCheckedChange={(checked) => updateEnhancedEngineSettings({ compliance_monitoring: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="risk_pattern_detection">Risk Pattern Detection</Label>
                  </div>
                  <Switch
                    id="risk_pattern_detection"
                    checked={config.enhanced_engine_settings.risk_pattern_detection || false}
                    onCheckedChange={(checked) => updateEnhancedEngineSettings({ risk_pattern_detection: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thresholds */}
          {config.thresholds && Object.keys(config.thresholds).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Thresholds
                </CardTitle>
                <CardDescription>
                  Alert thresholds for automated monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(config.thresholds).map(([key, value]) => (
                  <div key={key}>
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      value={value}
                      onChange={(e) => updateThresholds(key, parseFloat(e.target.value))}
                      placeholder={`Enter ${key.replace(/_/g, ' ')} threshold`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Advanced Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Advanced Configuration
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Triggers</Label>
                    <Button size="sm" onClick={addTrigger}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Trigger
                    </Button>
                  </div>
                  {config.triggers?.map((trigger, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{trigger.type}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTrigger(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                          className="p-2 border rounded"
                          value={trigger.type}
                          onChange={(e) => updateTrigger(index, { 
                            type: e.target.value as 'schedule' | 'threshold' | 'event' 
                          })}
                        >
                          <option value="schedule">Schedule</option>
                          <option value="threshold">Threshold</option>
                          <option value="event">Event</option>
                        </select>
                        <Input
                          placeholder="Condition field"
                          value={trigger.condition?.field || ''}
                          onChange={(e) => updateTrigger(index, {
                            condition: { ...trigger.condition, field: e.target.value }
                          })}
                        />
                        <Switch
                          checked={trigger.enabled}
                          onCheckedChange={(checked) => updateTrigger(index, { enabled: checked })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}