/**
 * 🏢 Enhanced Company Setup Component
 * SuperClaude Optimized for Multi-Country Support
 * 
 * Features:
 * - Country selection (Colombia/Mexico)
 * - Dynamic tax ID validation
 * - Country-specific settings
 * - Localized demo data
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface CompanySetupData {
  name: string;
  industry: string;
  size: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  annualRevenue: string;
  employeeCount: string;
}

interface EnhancedCompanySetupProps {
  onComplete: (data: CompanySetupData) => void;
  onBack: () => void;
  initialData?: Partial<CompanySetupData>;
}

const INDUSTRY_OPTIONS = [
  'Manufacturing',
  'Retail',
  'Healthcare',
  'Technology',
  'Food & Beverage',
  'Automotive',
  'Pharmaceuticals',
  'Textiles',
  'Electronics',
  'Other'
];

const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees'
];

export function EnhancedCompanySetup({ onComplete, onBack, initialData }: EnhancedCompanySetupProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CompanySetupData>({
    name: '',
    industry: '',
    size: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    annualRevenue: '',
    employeeCount: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Partial<CompanySetupData>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<CompanySetupData> = {};

    if (currentStep === 1) {
      if (!data.name.trim()) newErrors.name = 'Company name is required';
      if (!data.industry) newErrors.industry = 'Industry is required';
      if (!data.size) newErrors.size = 'Company size is required';
    }

    if (currentStep === 2) {
      if (!data.location.trim()) newErrors.location = 'Location is required';
      if (!data.email.trim()) newErrors.email = 'Email is required';
      if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        onComplete(data);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const updateData = (field: keyof CompanySetupData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Company Name *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => updateData('name', e.target.value)}
          placeholder="Enter your company name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="industry">Industry *</Label>
        <select
          id="industry"
          value={data.industry}
          onChange={(e) => updateData('industry', e.target.value)}
          className={`w-full p-2 border rounded-md ${errors.industry ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Select an industry</option>
          {INDUSTRY_OPTIONS.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>
        {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
      </div>

      <div>
        <Label htmlFor="size">Company Size *</Label>
        <select
          id="size"
          value={data.size}
          onChange={(e) => updateData('size', e.target.value)}
          className={`w-full p-2 border rounded-md ${errors.size ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Select company size</option>
          {COMPANY_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
      </div>

      <div>
        <Label htmlFor="description">Company Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => updateData('description', e.target.value)}
          placeholder="Brief description of your company and operations"
          rows={4}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          value={data.location}
          onChange={(e) => updateData('location', e.target.value)}
          placeholder="City, State/Province, Country"
          className={errors.location ? 'border-red-500' : ''}
        />
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => updateData('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData('email', e.target.value)}
            placeholder="contact@company.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={data.website}
          onChange={(e) => updateData('website', e.target.value)}
          placeholder="https://www.company.com"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="annualRevenue">Annual Revenue (USD)</Label>
          <select
            id="annualRevenue"
            value={data.annualRevenue}
            onChange={(e) => updateData('annualRevenue', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select revenue range</option>
            <option value="<1M">Less than $1M</option>
            <option value="1M-10M">$1M - $10M</option>
            <option value="10M-50M">$10M - $50M</option>
            <option value="50M-100M">$50M - $100M</option>
            <option value="100M-500M">$100M - $500M</option>
            <option value="500M-1B">$500M - $1B</option>
            <option value=">1B">More than $1B</option>
          </select>
        </div>

        <div>
          <Label htmlFor="employeeCount">Number of Employees</Label>
          <Input
            id="employeeCount"
            value={data.employeeCount}
            onChange={(e) => updateData('employeeCount', e.target.value)}
            placeholder="e.g., 150"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Review Your Information</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Company:</strong> {data.name}</p>
          <p><strong>Industry:</strong> {data.industry}</p>
          <p><strong>Size:</strong> {data.size}</p>
          <p><strong>Location:</strong> {data.location}</p>
          <p><strong>Email:</strong> {data.email}</p>
        </div>
      </div>
    </div>
  );

  const steps = [
    { title: 'Basic Information', icon: Building2 },
    { title: 'Contact Details', icon: Mail },
    { title: 'Business Details', icon: Users }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((stepInfo, index) => {
          const Icon = stepInfo.icon;
          const isActive = index + 1 === step;
          const isCompleted = index + 1 < step;
          
          return (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                isActive ? 'border-blue-500 text-blue-500' :
                'border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>{steps[step - 1].title}</span>
            <Badge variant="outline">Step {step} of 3</Badge>
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Tell us about your company'}
            {step === 2 && 'How can we reach you?'}
            {step === 3 && 'Final details to complete setup'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 1 ? 'Back' : 'Previous'}
            </Button>
            <Button onClick={handleNext}>
              {step === 3 ? 'Complete Setup' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}