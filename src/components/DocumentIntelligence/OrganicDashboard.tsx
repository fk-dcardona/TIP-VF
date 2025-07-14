'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, TrendingUp, CheckCircle, AlertCircle, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBreathing } from '@/hooks/useBreathing';
import LivingScore from './LivingScore';
import FlowingTimeline from './FlowingTimeline';
import GrowingMetrics from './GrowingMetrics';

interface OrganicDashboardProps {
  orgId: string;
}

interface DocumentScore {
  document_intelligence_score: number;
  components: {
    compliance: number;
    visibility: number;
    efficiency: number;
    accuracy: number;
  };
  insights: string[];
}

interface DocumentMetrics {
  total_documents: number;
  average_confidence: number;
  automation_rate: number;
  error_rate: number;
  compliance_score: number;
}

export default function OrganicDashboard({ orgId }: OrganicDashboardProps) {
  const [score, setScore] = useState<DocumentScore | null>(null);
  const [metrics, setMetrics] = useState<DocumentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [hoveredInsight, setHoveredInsight] = useState<string | null>(null);
  const breathing = useBreathing();

  useEffect(() => {
    fetchDocumentAnalytics();
  }, [orgId]);

  const fetchDocumentAnalytics = async () => {
    try {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScore({
        document_intelligence_score: 87,
        components: {
          compliance: 92,
          visibility: 88,
          efficiency: 82,
          accuracy: 85
        },
        insights: [
          "Documents processed 23% faster this week",
          "Compliance rate improved across all regions",
          "New anomaly detection preventing $12K in potential fraud"
        ]
      });
      
      setMetrics({
        total_documents: 1247,
        average_confidence: 94.2,
        automation_rate: 87.5,
        error_rate: 2.3,
        compliance_score: 92.1
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch document analytics:', error);
      setLoading(false);
    }
  };

  const timelineSteps = [
    { id: 'upload', label: 'Upload', count: 12, status: 'completed' as const, icon: Upload },
    { id: 'parse', label: 'Parse', count: 11, status: 'completed' as const, icon: FileText },
    { id: 'validate', label: 'Validate', count: 10, status: 'active' as const, icon: CheckCircle },
    { id: 'extract', label: 'Extract', count: 9, status: 'pending' as const, icon: TrendingUp },
    { id: 'analyze', label: 'Analyze', count: 8, status: 'pending' as const, icon: Activity },
  ];

  const metricsData = metrics ? [
    {
      id: 'total',
      label: 'Total Documents',
      value: metrics.total_documents,
      unit: '',
      trend: 'up' as const,
      color: '#0066CC',
      icon: FileText
    },
    {
      id: 'confidence',
      label: 'Avg Confidence',
      value: Math.round(metrics.average_confidence),
      unit: '%',
      trend: 'up' as const,
      color: '#00AA44',
      icon: CheckCircle
    },
    {
      id: 'automation',
      label: 'Automation Rate',
      value: Math.round(metrics.automation_rate),
      unit: '%',
      trend: 'up' as const,
      color: '#8B5CF6',
      icon: Zap
    },
    {
      id: 'error',
      label: 'Error Rate',
      value: Math.round(metrics.error_rate),
      unit: '%',
      trend: 'down' as const,
      color: '#FFAA00',
      icon: AlertCircle
    }
  ] : [];

  if (loading) {
    return (
      <motion.div 
        className="flex items-center justify-center h-64"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <div className="relative">
          <motion.div
            className="w-16 h-16 border-4 border-blue-200 rounded-full"
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity },
            }}
          />
          <motion.div
            className="absolute inset-2 w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-8 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Organic Header */}
      <motion.div
        className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 rounded-2xl p-8 overflow-hidden"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        {/* Flowing background elements */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            background: 'radial-gradient(circle at 20% 30%, #0066CC 0%, transparent 40%), radial-gradient(circle at 80% 70%, #00AA44 0%, transparent 40%)',
          }}
          animate={{
            scale: breathing.scale,
            rotate: breathing.rotate,
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Document Intelligence Center
            </h1>
            <p className="text-gray-600">
              Transform your trade documents into actionable insights
            </p>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Document
            </Button>
          </motion.div>
        </div>

        {/* Score Display */}
        {score && (
          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Main Score */}
            <div className="md:col-span-1 flex justify-center">
              <LivingScore
                score={score.document_intelligence_score}
                label="Overall"
                color="#0066CC"
                delay={0}
              />
            </div>

            {/* Component Scores */}
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(score.components).map(([key, value], index) => (
                <LivingScore
                  key={key}
                  score={value}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  color={
                    key === 'compliance' ? '#00AA44' :
                    key === 'visibility' ? '#8B5CF6' :
                    key === 'efficiency' ? '#FFAA00' :
                    '#FF6B6B'
                  }
                  delay={index + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Flowing Timeline */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <FlowingTimeline steps={timelineSteps} />
      </motion.div>

      {/* Growing Metrics */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <GrowingMetrics metrics={metricsData} />
      </motion.div>

      {/* Organic Insights */}
      {score && score.insights.length > 0 && (
        <motion.div
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="mr-3"
            >
              💡
            </motion.div>
            Key Insights & Recommendations
          </h3>

          <div className="space-y-4">
            {score.insights.map((insight, index) => (
              <motion.div
                key={index}
                className="relative group cursor-pointer"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
                onMouseEnter={() => setHoveredInsight(insight)}
                onMouseLeave={() => setHoveredInsight(null)}
              >
                {/* Growing vine effect */}
                <motion.div
                  className="absolute left-0 top-0 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-full"
                  initial={{ height: 0 }}
                  animate={{ 
                    height: hoveredInsight === insight ? '100%' : '50%',
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />

                <motion.div
                  className="pl-6 p-4 rounded-lg border border-gray-100 bg-gradient-to-r from-green-50/50 to-transparent"
                  animate={{
                    backgroundColor: hoveredInsight === insight 
                      ? 'rgba(34, 197, 94, 0.05)' 
                      : 'rgba(0, 0, 0, 0)',
                    borderColor: hoveredInsight === insight 
                      ? '#22c55e' 
                      : '#f3f4f6',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.p
                    className="text-gray-700"
                    animate={{
                      x: hoveredInsight === insight ? 5 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {insight}
                  </motion.p>

                  {/* Floating particles on hover */}
                  <AnimatePresence>
                    {hoveredInsight === insight && (
                      <>
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-green-400 rounded-full"
                            style={{
                              right: `${10 + i * 15}%`,
                              top: `${30 + (i % 2) * 40}%`,
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: [0, 1.5, 0],
                              opacity: [0, 0.8, 0],
                              y: [0, -20],
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                              duration: 2,
                              delay: i * 0.2,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Natural Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUploadModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Flowing background */}
              <motion.div
                className="absolute inset-0 opacity-5"
                style={{
                  background: 'linear-gradient(45deg, #0066CC, #00AA44, #8B5CF6)',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />

              <div className="relative z-10">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  Upload Trade Document
                </h3>

                <motion.div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center relative overflow-hidden"
                  whileHover={{ 
                    borderColor: '#0066CC',
                    backgroundColor: '#eff6ff',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    Drag & drop your document here
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    or click to browse
                  </p>

                  {/* Ripple effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-blue-400"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{
                      scale: [1, 1.05, 1.1],
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                </motion.div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 px-6">
                    Upload
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}