'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, Package, TrendingUp, Users, FileText, Upload,
  Zap, Bot, DollarSign, ShoppingCart, Truck, Activity,
  Waves, Sparkles, Heart
} from 'lucide-react';
import OrganicDashboard from '@/components/DocumentIntelligence/OrganicDashboard';
import KPIEvolutionCard from './KPIEvolutionCard';
import { PsychologyFlow, getCurrentFlow, PsychologyLevel } from '@/design-system/psychology-flow';
import { useBreathing } from '@/hooks/useBreathing';

export default function PsychologyDashboard() {
  const { userId } = useAuth();
  const { organization } = useOrganization();
  const [psychologyLevel, setPsychologyLevel] = useState<PsychologyLevel>('trust');
  const [userJourneyTime, setUserJourneyTime] = useState(0);
  const breathing = useBreathing(psychologyLevel === 'trust' ? 6000 : psychologyLevel === 'confidence' ? 3000 : 1500);
  
  // Track user journey time
  useEffect(() => {
    const interval = setInterval(() => {
      setUserJourneyTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Natural psychology progression
  useEffect(() => {
    if (userJourneyTime > 10 && psychologyLevel === 'trust') {
      setPsychologyLevel('confidence');
    } else if (userJourneyTime > 25 && psychologyLevel === 'confidence') {
      setPsychologyLevel('intelligence');
    }
  }, [userJourneyTime, psychologyLevel]);
  
  const currentFlow = getCurrentFlow(psychologyLevel);
  
  if (!organization) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Welcome to Supply Chain Intelligence</h2>
        <p className="text-gray-600">Please select or create an organization to continue.</p>
      </div>
    );
  }
  
  // Psychology-aware KPI data
  const kpiData = [
    {
      title: "Total Documents",
      value: "1,247",
      icon: FileText,
      trend: { value: 23, direction: 'up' as const, label: 'from last month' },
      insight: "Your document processing is 40% faster than industry average",
      action: { label: "Bulk Upload", onClick: () => console.log('Upload') },
      psychologyColor: { trust: '#060735', confidence: '#00AA44', intelligence: '#3B82F6' }
    },
    {
      title: "Processing Speed",
      value: "23%",
      icon: Zap,
      trend: { value: 5, direction: 'up' as const, label: 'faster this week' },
      insight: "AI optimization saved 12 hours of manual work",
      action: { label: "View Details", onClick: () => console.log('Details') },
      psychologyColor: { trust: '#1e1b4b', confidence: '#8B5CF6', intelligence: '#2563eb' }
    },
    {
      title: "Automation Rate",
      value: "87.5%",
      icon: TrendingUp,
      trend: { value: 5.2, direction: 'up' as const, label: 'improvement' },
      insight: "3 more processes ready for automation",
      action: { label: "Automate Now", onClick: () => console.log('Automate') },
      psychologyColor: { trust: '#312e81', confidence: '#2128B1', intelligence: '#1d4ed8' }
    },
    {
      title: "Error Rate",
      value: "2.3%",
      icon: Package,
      trend: { value: 1.2, direction: 'down' as const, label: 'improvement' },
      insight: "Quality score exceeds targets by 15%",
      action: { label: "Quality Report", onClick: () => console.log('Report') },
      psychologyColor: { trust: '#4c4083', confidence: '#3A40C9', intelligence: '#1e40af' }
    }
  ];
  
  return (
    <motion.div 
      className="space-y-6"
      style={{
        background: `linear-gradient(180deg, transparent 0%, ${currentFlow.colors.glow} 100%)`,
      }}
    >
      {/* Psychology State Indicator */}
      <motion.div
        className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-white/90 backdrop-blur shadow-lg"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center space-x-3 mb-2">
          {psychologyLevel === 'trust' && <Waves className="w-5 h-5 text-blue-900" />}
          {psychologyLevel === 'confidence' && <Heart className="w-5 h-5 text-blue-600" />}
          {psychologyLevel === 'intelligence' && <Sparkles className="w-5 h-5 text-blue-400" />}
          <span className="font-semibold" style={{ color: currentFlow.colors.primary }}>
            {currentFlow.name}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {currentFlow.characteristics.rhythm} rhythm • {userJourneyTime}s
        </p>
        
        {/* Mini flow indicator */}
        <div className="flex space-x-1 mt-2">
          {(['trust', 'confidence', 'intelligence'] as PsychologyLevel[]).map((level) => (
            <motion.div
              key={level}
              className="h-1 flex-1 rounded-full"
              style={{
                background: psychologyLevel === level ? 
                  PsychologyFlow.waters[level].colors.primary : 
                  `${PsychologyFlow.waters[level].colors.primary}20`
              }}
              animate={psychologyLevel === level ? {
                scaleX: [1, 1.1, 1]
              } : {}}
              transition={{
                duration: PsychologyFlow.waters[level].animation.timing.breath / 1000,
                repeat: Infinity
              }}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Psychology-Enhanced Quick Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        animate={{
          scale: breathing.scale,
          opacity: 0.9 + breathing.opacity * 0.1
        }}
        transition={{
          duration: currentFlow.animation.timing.breath / 1000,
          ease: currentFlow.animation.easing.breath
        }}
      >
        {kpiData.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.2,
              ease: currentFlow.animation.easing.primary
            }}
          >
            <KPIEvolutionCard
              {...kpi}
              startingStage={psychologyLevel}
              evolutionSpeed="fast"
              color={kpi.psychologyColor}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Living Document Intelligence */}
      <motion.div
        animate={{
          opacity: [0.95, 1, 0.95],
        }}
        transition={{
          duration: currentFlow.animation.timing.breath / 1000,
          repeat: Infinity
        }}
      >
        <OrganicDashboard orgId={organization.id} />
      </motion.div>
      
      {/* Psychology-Aware Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Finance Dashboard - Trust Level */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
            style={{
              background: psychologyLevel === 'trust' ? 
                `linear-gradient(135deg, ${currentFlow.colors.primary}10 0%, transparent 100%)` :
                'white',
              borderColor: psychologyLevel === 'trust' ? currentFlow.colors.primary : 'transparent'
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              style={{
                background: `radial-gradient(circle at 20% 50%, ${currentFlow.colors.glow} 0%, transparent 50%)`,
              }}
              transition={{
                duration: currentFlow.animation.timing.breath / 1000,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
            <div className="relative z-10 p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="h-6 w-6 mr-2 text-green-600" />
                <h3 className="text-lg font-semibold">Finance Dashboard</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Financial analytics and cash flow management
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/dashboard/finance'}
              >
                View Finance
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Sales Dashboard - Confidence Level */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
            style={{
              background: psychologyLevel === 'confidence' ? 
                `linear-gradient(135deg, ${currentFlow.colors.primary}10 0%, transparent 100%)` :
                'white',
              borderColor: psychologyLevel === 'confidence' ? currentFlow.colors.primary : 'transparent'
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={psychologyLevel === 'confidence' ? {
                scale: [1, 1.05, 1],
              } : {}}
              style={{
                background: `radial-gradient(circle at 50% 50%, ${currentFlow.colors.glow} 0%, transparent 50%)`,
              }}
              transition={{
                duration: currentFlow.animation.timing.breath / 1000,
                repeat: Infinity,
              }}
            />
            <div className="relative z-10 p-6">
              <div className="flex items-center mb-4">
                <ShoppingCart className="h-6 w-6 mr-2 text-blue-600" />
                <h3 className="text-lg font-semibold">Sales Dashboard</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Sales performance and customer analytics
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/dashboard/sales'}
              >
                View Sales
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Procurement Dashboard - Intelligence Level */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
            style={{
              background: psychologyLevel === 'intelligence' ? 
                `linear-gradient(135deg, ${currentFlow.colors.primary}10 0%, transparent 100%)` :
                'white',
              borderColor: psychologyLevel === 'intelligence' ? currentFlow.colors.primary : 'transparent'
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={psychologyLevel === 'intelligence' ? {
                backgroundPosition: ['0% 0%', '100% 0%'],
              } : {}}
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${currentFlow.colors.glow} 50%, transparent 100%)`,
              }}
              transition={{
                duration: currentFlow.animation.timing.breath / 1000,
                repeat: Infinity,
              }}
            />
            <div className="relative z-10 p-6">
              <div className="flex items-center mb-4">
                <Truck className="h-6 w-6 mr-2 text-purple-600" />
                <h3 className="text-lg font-semibold">Procurement Dashboard</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Supplier management and procurement analytics
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/dashboard/procurement'}
              >
                View Procurement
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Additional cards with psychology awareness */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Package className="h-6 w-6 mr-2 text-orange-600" />
              <h3 className="text-lg font-semibold">Inventory Dashboard</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Inventory levels and stock management
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/dashboard/inventory'}
            >
              View Inventory
            </Button>
          </div>
        </Card>

        {/* Agent Management with Intelligence highlight */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          style={{
            background: psychologyLevel === 'intelligence' ? 
              'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)' :
              'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
          }}
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Bot className="h-6 w-6 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold">Agent Management</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              AI agents for supply chain automation
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/dashboard/agents'}
            >
              Manage Agents
            </Button>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold">Team Management</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              User roles and team collaboration
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/dashboard/team'}
            >
              Manage Team
            </Button>
          </div>
        </Card>
      </div>

      {/* Psychology-Enhanced Quick Actions */}
      <Card>
        <motion.div
          className="p-6"
          animate={{
            background: [
              `linear-gradient(90deg, ${currentFlow.colors.glow} 0%, transparent 100%)`,
              `linear-gradient(90deg, transparent 0%, ${currentFlow.colors.glow} 100%)`,
            ]
          }}
          transition={{
            duration: currentFlow.animation.timing.breath / 1000 * 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <h3 className="text-xl font-semibold mb-2">Quick Actions</h3>
          <p className="text-sm text-gray-600 mb-6">
            Common tasks to get you started
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              style={{
                background: psychologyLevel === 'intelligence' ? currentFlow.colors.primary : undefined
              }}
            >
              <Upload className="h-6 w-6" />
              <span>Upload Documents</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              style={{
                borderColor: psychologyLevel === 'confidence' ? currentFlow.colors.primary : undefined,
                color: psychologyLevel === 'confidence' ? currentFlow.colors.primary : undefined
              }}
            >
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              style={{
                borderColor: psychologyLevel === 'trust' ? currentFlow.colors.primary : undefined,
                color: psychologyLevel === 'trust' ? currentFlow.colors.primary : undefined
              }}
            >
              <Bot className="h-6 w-6" />
              <span>Create Agent</span>
            </Button>
          </div>
        </motion.div>
      </Card>
      
      {/* Flowing Psychology Particles */}
      <AnimatePresence>
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="fixed pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              y: psychologyLevel === 'trust' ? -100 : psychologyLevel === 'confidence' ? -200 : -300,
              x: Math.sin(i) * 50,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: currentFlow.animation.timing.breath / 1000,
              delay: i * 0.5,
              repeat: Infinity,
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ background: currentFlow.colors.glow }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}