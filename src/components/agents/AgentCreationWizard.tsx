'use client';

import React, { useState, useEffect } from 'react';
import { X, Bot, Clock, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AgentType, AgentTemplate, AgentCreationRequest, AgentConfiguration } from '@/types/agent';
import { agentApiClient } from '@/lib/agent-api-client';

interface AgentCreationWizardProps {
  onClose: () => void;
  onAgentCreated: (agent: any) => void;
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'inventory-monitor-basic',
    name: 'Inventory Monitor',
    type: AgentType.INVENTORY_MONITOR,
    description: 'Monitors inventory levels and sends alerts when items fall below threshold',
    icon: '📦',
    category: 'inventory',
    difficulty: 'beginner',
    estimated_setup_time: 5,
    features: [
      'Real-time inventory tracking',
      'Threshold-based alerts',
      'Automated reorder recommendations',
      'Historical trend analysis'
    ],
    use_cases: [
      'Prevent stockouts',
      'Optimize inventory levels',
      'Automate reorder processes',
      'Track inventory trends'
    ],
    requirements: [
      'Inventory data access',
      'Threshold configuration',
      'Notification settings'
    ],
    default_configuration: {
      parameters: {
        check_frequency: 'hourly',
        alert_threshold: 100,
        reorder_point: 50
      },
      schedule: {
        frequency: 'hourly',
        timezone: 'UTC'
      },
      notifications: {
        email: true,
        slack: false
      }
    }
  },
  {
    id: 'supplier-evaluator-basic',
    name: 'Supplier Performance Evaluator',
    type: AgentType.SUPPLIER_EVALUATOR,
    description: 'Evaluates supplier performance based on delivery, quality, and cost metrics',
    icon: '🏢',
    category: 'supplier',
    difficulty: 'intermediate',
    estimated_setup_time: 10,
    features: [
      'Performance scoring',
      'Quality metrics tracking',
      'Delivery performance analysis',
      'Cost efficiency evaluation'
    ],
    use_cases: [
      'Supplier benchmarking',
      'Performance improvement',
      'Contract negotiations',
      'Risk assessment'
    ],
    requirements: [
      'Supplier data access',
      'Performance metrics definition',
      'Scoring criteria configuration'
    ],
    default_configuration: {
      parameters: {
        evaluation_frequency: 'weekly',
        quality_weight: 0.4,
        delivery_weight: 0.3,
        cost_weight: 0.3
      },
      schedule: {
        frequency: 'weekly',
        time: '09:00',
        timezone: 'UTC'
      },
      notifications: {
        email: true,
        slack: true
      }
    }
  },
  {
    id: 'demand-forecaster-basic',
    name: 'Demand Forecaster',
    type: AgentType.DEMAND_FORECASTER,
    description: 'Predicts future demand using historical data and market trends',
    icon: '📈',
    category: 'demand',
    difficulty: 'advanced',
    estimated_setup_time: 15,
    features: [
      'ML-based forecasting',
      'Seasonal pattern recognition',
      'Market trend analysis',
      'Confidence intervals'
    ],
    use_cases: [
      'Production planning',
      'Inventory optimization',
      'Resource allocation',
      'Budget forecasting'
    ],
    requirements: [
      'Historical sales data',
      'Market data access',
      'Forecasting model selection'
    ],
    default_configuration: {
      parameters: {
        forecast_horizon: 30,
        confidence_level: 0.95,
        seasonal_adjustment: true
      },
      schedule: {
        frequency: 'daily',
        time: '06:00',
        timezone: 'UTC'
      },
      notifications: {
        email: true,
        slack: false
      }
    }
  }
];

export function AgentCreationWizard({ onClose, onAgentCreated }: AgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    configuration: {} as AgentConfiguration
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 1, title: 'Select Template', description: 'Choose an agent template' },
    { id: 2, title: 'Configure Agent', description: 'Set up agent parameters' },
    { id: 3, title: 'Review & Create', description: 'Review and create agent' }
  ];

  useEffect(() => {
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        configuration: selectedTemplate.default_configuration
      }));
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(2);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigurationChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [key]: value
      }
    }));
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    setError(null);

    try {
      const request: AgentCreationRequest = {
        name: formData.name,
        type: selectedTemplate.type,
        description: formData.description,
        org_id: 'default-org', // TODO: Get from context
        configuration: formData.configuration,
        template_id: selectedTemplate.id
      };

      const response = await agentApiClient.createAgent(request);
      
      if (response.success && response.agent) {
        onAgentCreated(response.agent);
      } else {
        setError(response.error || 'Failed to create agent');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Agent</h2>
            <p className="text-gray-600 mt-1">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].description}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-px mx-4
                    ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Agent Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AGENT_TEMPLATES.map((template) => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl">{template.icon}</div>
                          <Badge className={getDifficultyColor(template.difficulty)}>
                            {template.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {template.estimated_setup_time} min setup
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-2">Key Features:</div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {template.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-green-500 mr-2">•</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {currentStep === 2 && selectedTemplate && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Configure Agent</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Agent Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="Enter agent name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        placeholder="Enter agent description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Schedule</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="frequency" className="text-sm">Frequency</Label>
                          <select
                            id="frequency"
                            className="w-full p-2 border rounded-md"
                            value={formData.configuration.schedule?.frequency || 'daily'}
                            onChange={(e) => handleConfigurationChange('schedule', {
                              ...formData.configuration.schedule,
                              frequency: e.target.value
                            })}
                          >
                            <option value="realtime">Real-time</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="time" className="text-sm">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={formData.configuration.schedule?.time || '09:00'}
                            onChange={(e) => handleConfigurationChange('schedule', {
                              ...formData.configuration.schedule,
                              time: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Notifications</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="email"
                            checked={formData.configuration.notifications?.email || false}
                            onChange={(e) => handleConfigurationChange('notifications', {
                              ...formData.configuration.notifications,
                              email: e.target.checked
                            })}
                          />
                          <Label htmlFor="email" className="text-sm">Email notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="slack"
                            checked={formData.configuration.notifications?.slack || false}
                            onChange={(e) => handleConfigurationChange('notifications', {
                              ...formData.configuration.notifications,
                              slack: e.target.checked
                            })}
                          />
                          <Label htmlFor="slack" className="text-sm">Slack notifications</Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Parameters</Label>
                      <div className="space-y-3">
                        {Object.entries(formData.configuration.parameters || {}).map(([key, value]) => (
                          <div key={key}>
                            <Label htmlFor={key} className="text-sm capitalize">
                              {key.replace('_', ' ')}
                            </Label>
                            <Input
                              id={key}
                              value={value}
                              onChange={(e) => handleConfigurationChange('parameters', {
                                ...formData.configuration.parameters,
                                [key]: e.target.value
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && selectedTemplate && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Review & Create</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Agent Name</div>
                      <div className="text-lg">{formData.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Type</div>
                      <div className="text-lg">{selectedTemplate.name}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-gray-700">Description</div>
                      <div>{formData.description}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Schedule</div>
                      <div>
                        {formData.configuration.schedule?.frequency} 
                        {formData.configuration.schedule?.time && ` at ${formData.configuration.schedule.time}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Notifications</div>
                      <div className="flex space-x-2">
                        {formData.configuration.notifications?.email && (
                          <Badge variant="outline">Email</Badge>
                        )}
                        {formData.configuration.notifications?.slack && (
                          <Badge variant="outline">Slack</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <div className="text-red-800">{error}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t">
          <Button 
            variant="outline" 
            onClick={currentStep === 1 ? onClose : handleBack}
            disabled={isCreating}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex space-x-3">
            {currentStep < 3 && (
              <Button 
                onClick={handleNext}
                disabled={currentStep === 1 && !selectedTemplate}
              >
                Next
              </Button>
            )}
            {currentStep === 3 && (
              <Button 
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}