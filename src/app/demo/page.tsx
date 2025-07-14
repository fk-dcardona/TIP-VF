'use client';

import React from 'react';
import { motion } from 'framer-motion';
import DocumentIntelligence from '@/components/DocumentIntelligence';
import { WaveBackground, FloatingElements } from '@/components/DocumentIntelligence/MagicInteractions';

export default function DemoPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Living background */}
      <WaveBackground color1="#0066CC" color2="#00AA44" />
      <FloatingElements count={30} color="#0066CC" />
      
      {/* Main content */}
      <motion.main 
        className="relative z-10 container mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Living Document Intelligence
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience interfaces that breathe, flow like water, and grow like plants. 
            This is the future of human-computer interaction.
          </p>
        </motion.div>

        {/* Demo Dashboard */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <DocumentIntelligence orgId="demo-org" />
        </motion.div>

        {/* Feature Highlights */}
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          {[
            {
              title: "Breathing UI",
              description: "Components pulse with natural respiratory rhythm",
              emoji: "🫁",
              color: "#0066CC"
            },
            {
              title: "Flowing Water",
              description: "Transitions that feel like liquid motion",
              emoji: "🌊", 
              color: "#00AA44"
            },
            {
              title: "Growing Plants",
              description: "Information reveals itself organically",
              emoji: "🌱",
              color: "#8B5CF6"
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center relative overflow-hidden"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 + index * 0.2 }}
              whileHover={{
                scale: 1.05,
                y: -10,
                transition: { type: "spring", stiffness: 300 }
              }}
            >
              <motion.div
                className="text-4xl mb-4"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              >
                {feature.emoji}
              </motion.div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: feature.color }}>
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
              
              {/* Organic background element */}
              <motion.div
                className="absolute inset-0 opacity-5 rounded-2xl"
                style={{
                  background: `radial-gradient(circle at 30% 70%, ${feature.color} 0%, transparent 60%)`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.05, 0.1, 0.05],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <motion.button
            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold relative overflow-hidden"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(0, 102, 204, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Experience the Magic</span>
            
            {/* Flowing background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600"
              initial={{ x: "-100%" }}
              whileHover={{ x: "0%" }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        </motion.div>
      </motion.main>
    </div>
  );
}