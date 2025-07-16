'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, Package, Zap, Brain, Palette, TestTube } from 'lucide-react';
import KPIEvolutionCard from '@/components/psychology/KPIEvolutionCard';
import LivingOrganismDemo from '@/components/psychology/LivingOrganismDemo';
import PsychologyDashboard from '@/components/psychology/PsychologyDashboard';
import WaterFlowBackground from '@/components/magic/WaterFlowBackground';
import BreathingContainer from '@/components/magic/BreathingContainer';
import PsychologyFlowIndicator from '@/components/magic/PsychologyFlowIndicator';
import { PsychologyLevel } from '@/design-system/psychology-flow';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PsychologyDemoPage() {
  const [psychologyLevel, setPsychologyLevel] = useState<PsychologyLevel>('trust');
  const [userEngagement, setUserEngagement] = useState(0);
  const [activeDemo, setActiveDemo] = useState<'components' | 'flow' | 'dashboard'>('components');
  
  // Track user engagement
  useEffect(() => {
    const interval = setInterval(() => {
      setUserEngagement(prev => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  // Sample KPIs for component demo
  const demoKPIs = [
    {
      title: "Document Intelligence",
      value: "94%",
      icon: Brain,
      trend: { value: 12, direction: 'up' as const, label: 'accuracy improvement' },
      insight: "AI model performing 40% better than baseline",
      action: { label: "Train Model", onClick: () => console.log('Training...') }
    },
    {
      title: "Processing Volume",
      value: "12.4K",
      icon: FileText,
      trend: { value: 34, direction: 'up' as const, label: 'documents this month' },
      insight: "Peak capacity reached, consider scaling",
      action: { label: "Scale Infrastructure", onClick: () => console.log('Scaling...') }
    },
    {
      title: "Supply Chain Health",
      value: "Good",
      icon: Package,
      trend: { value: 5, direction: 'neutral' as const, label: 'stable performance' },
      insight: "All suppliers meeting SLA requirements",
      action: { label: "View Details", onClick: () => console.log('Details...') }
    }
  ];
  
  return (
    <div className="min-h-screen relative">
      {/* Living background */}
      <div className="fixed inset-0">
        <WaterFlowBackground 
          psychologyLevel={psychologyLevel} 
          intensity={0.5}
        />
      </div>
      
      {/* Psychology Flow Indicator */}
      <PsychologyFlowIndicator
        currentLevel={psychologyLevel}
        userEngagement={userEngagement}
        onLevelChange={setPsychologyLevel}
        position="top-right"
      />
      
      {/* Main content */}
      <div className="relative z-10 p-8">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <BreathingContainer 
            psychologyLevel={psychologyLevel}
            className="mb-12 text-center"
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
              Psychology-Driven Design System
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience how interfaces can breathe, flow, and evolve with user psychology. 
              This platform feels like it exists in the natural world, not the digital one.
            </p>
          </BreathingContainer>
          
          {/* Demo selector */}
          <div className="mb-8">
            <Tabs value={activeDemo} onValueChange={(v: any) => setActiveDemo(v)}>
              <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto">
                <TabsTrigger value="components" className="flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  Components
                </TabsTrigger>
                <TabsTrigger value="flow" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Living Flow
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Full Dashboard
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Component Showcase */}
          {activeDemo === 'components' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              {/* KPI Evolution Cards */}
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  KPI Evolution Cards
                </h2>
                <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
                  Watch how metrics evolve through trust → confidence → intelligence as users engage
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {demoKPIs.map((kpi, index) => (
                    <BreathingContainer
                      key={kpi.title}
                      psychologyLevel={psychologyLevel}
                      intensity={0.8}
                    >
                      <KPIEvolutionCard
                        {...kpi}
                        startingStage={psychologyLevel}
                        evolutionSpeed="natural"
                      />
                    </BreathingContainer>
                  ))}
                </div>
              </section>
              
              {/* Psychology Level Controls */}
              <section className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-xl">
                <h3 className="text-xl font-semibold mb-6">
                  Experience Different Psychology Levels
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant={psychologyLevel === 'trust' ? 'default' : 'outline'}
                    onClick={() => setPsychologyLevel('trust')}
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                  >
                    <span className="text-2xl">🌊</span>
                    <span>Trust (Deep Ocean)</span>
                    <span className="text-xs opacity-70">Slow, authoritative breathing</span>
                  </Button>
                  
                  <Button
                    variant={psychologyLevel === 'confidence' ? 'default' : 'outline'}
                    onClick={() => setPsychologyLevel('confidence')}
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                  >
                    <span className="text-2xl">💙</span>
                    <span>Confidence (River)</span>
                    <span className="text-xs opacity-70">Steady, purposeful flow</span>
                  </Button>
                  
                  <Button
                    variant={psychologyLevel === 'intelligence' ? 'default' : 'outline'}
                    onClick={() => setPsychologyLevel('intelligence')}
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                  >
                    <span className="text-2xl">✨</span>
                    <span>Intelligence (Stream)</span>
                    <span className="text-xs opacity-70">Quick, sparkling insights</span>
                  </Button>
                </div>
              </section>
              
              {/* Living Interface Examples */}
              <section>
                <h3 className="text-xl font-semibold mb-6 text-center">
                  Living Interface Patterns
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Breathing Container Example */}
                  <BreathingContainer
                    psychologyLevel={psychologyLevel}
                    className="bg-white/90 rounded-xl p-6 shadow-lg"
                  >
                    <h4 className="font-semibold mb-2">Breathing Container</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      This container breathes with the interface, creating a living feeling. 
                      Hover to see how it responds to your presence.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-100 rounded p-2">
                        <span className="text-gray-500">Breath Rate:</span>
                        <span className="block font-medium">
                          {psychologyLevel === 'trust' ? '6s' : 
                           psychologyLevel === 'confidence' ? '3s' : '1.5s'}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <span className="text-gray-500">Response:</span>
                        <span className="block font-medium">
                          {psychologyLevel === 'trust' ? 'Gentle' : 
                           psychologyLevel === 'confidence' ? 'Active' : 'Instant'}
                        </span>
                      </div>
                    </div>
                  </BreathingContainer>
                  
                  {/* Water Flow Example */}
                  <div className="relative bg-white/90 rounded-xl overflow-hidden shadow-lg">
                    <WaterFlowBackground psychologyLevel={psychologyLevel} intensity={1}>
                      <div className="p-6">
                        <h4 className="font-semibold mb-2">Water Flow Background</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          The background flows like water, with characteristics matching the psychology level.
                        </p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Flow Type:</span>
                            <span className="font-medium">
                              {psychologyLevel === 'trust' ? 'Deep Currents' : 
                               psychologyLevel === 'confidence' ? 'River Flow' : 'Mountain Stream'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Particles:</span>
                            <span className="font-medium">
                              {psychologyLevel === 'trust' ? '20 slow' : 
                               psychologyLevel === 'confidence' ? '40 steady' : '60 quick'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </WaterFlowBackground>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
          
          {/* Living Flow Demo */}
          {activeDemo === 'flow' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <LivingOrganismDemo />
            </motion.div>
          )}
          
          {/* Full Dashboard Demo */}
          {activeDemo === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl"
            >
              <PsychologyDashboard />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}