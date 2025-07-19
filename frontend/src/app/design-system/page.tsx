'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  Package, 
  Truck, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-5xl font-bold mb-4">Finkargo Design System</h1>
          <p className="text-xl text-white/90">
            A comprehensive design system for building consistent, accessible, and beautiful supply chain interfaces
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Colors Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">Colors</h2>
          
          {/* Brand Colors */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">Brand Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((shade) => (
                  <div key={shade} className="space-y-2">
                    <div className={`h-20 rounded-lg bg-primary-${shade} border border-border`} />
                    <p className="text-sm font-medium text-text-primary">Primary {shade}</p>
                    <p className="text-xs text-text-tertiary">primary-{shade}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Semantic Colors */}
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">Semantic Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-success flex items-center justify-center text-white">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Success</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-warning-main flex items-center justify-center text-white">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Warning</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-error flex items-center justify-center text-white">
                    <XCircle className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Error</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-info-main flex items-center justify-center text-white">
                    <Info className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Info</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">Typography</h2>
          <div className="card-elevated space-y-4">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-text-primary">Heading 1</h1>
              <p className="text-text-tertiary">text-6xl font-bold</p>
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-bold text-text-primary">Heading 2</h2>
              <p className="text-text-tertiary">text-5xl font-bold</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-text-primary">Heading 3</h3>
              <p className="text-text-tertiary">text-4xl font-bold</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-semibold text-text-primary">Heading 4</h4>
              <p className="text-text-tertiary">text-3xl font-semibold</p>
            </div>
            <div className="space-y-2">
              <h5 className="text-2xl font-semibold text-text-primary">Heading 5</h5>
              <p className="text-text-tertiary">text-2xl font-semibold</p>
            </div>
            <div className="space-y-2">
              <h6 className="text-xl font-semibold text-text-primary">Heading 6</h6>
              <p className="text-text-tertiary">text-xl font-semibold</p>
            </div>
            <div className="space-y-2">
              <p className="text-base text-text-primary">Body text - Regular paragraph text for content</p>
              <p className="text-text-tertiary">text-base text-text-primary</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">Small text - Supporting information</p>
              <p className="text-text-tertiary">text-sm text-text-secondary</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">Buttons</h2>
          <div className="card-elevated space-y-6">
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary px-6 py-3">
                Primary Button
              </button>
              <button className="btn-secondary px-6 py-3">
                Secondary Button
              </button>
              <button className="btn-outline px-6 py-3">
                Outline Button
              </button>
              <button className="btn-ghost px-6 py-3">
                Ghost Button
              </button>
              <button className="btn-primary px-6 py-3" disabled>
                Disabled
              </button>
            </div>
            
            {/* Button with Icons */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
              <button className="btn-primary px-6 py-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                With Icon
              </button>
              <button className="btn-secondary px-6 py-3 flex items-center gap-2">
                Action
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Default Card</h3>
              <p className="text-text-secondary">Basic card with border and padding</p>
            </div>
            
            <div className="card-elevated">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Elevated Card</h3>
              <p className="text-text-secondary">Card with shadow for emphasis</p>
            </div>
            
            <div className="card-gradient">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Gradient Card</h3>
              <p className="text-text-secondary">Card with gradient background</p>
            </div>
          </div>
        </section>

        {/* KPI Cards Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">KPI Cards</h2>
          <div className="dashboard-grid">
            <div className="kpi-card breathing">
              <p className="kpi-title">Total Revenue</p>
              <h3 className="kpi-value">$2.4M</h3>
              <div className="kpi-change kpi-change-positive">
                <ChevronRight className="h-4 w-4 transform -rotate-45" />
                <span>12.5%</span>
              </div>
            </div>
            
            <div className="kpi-card">
              <p className="kpi-title">Active Users</p>
              <h3 className="kpi-value">1,234</h3>
              <div className="kpi-change kpi-change-negative">
                <ChevronRight className="h-4 w-4 transform rotate-45" />
                <span>5.2%</span>
              </div>
            </div>
            
            <div className="kpi-card">
              <p className="kpi-title">Conversion Rate</p>
              <h3 className="kpi-value">3.45%</h3>
              <div className="kpi-change text-text-secondary">
                <span>No change</span>
              </div>
            </div>
          </div>
        </section>

        {/* Form Elements Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">Form Elements</h2>
          <div className="card-elevated space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Input Field</label>
              <input type="text" className="input" placeholder="Enter text..." />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Select Dropdown</label>
              <select className="input">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Textarea</label>
              <textarea className="input min-h-[100px] resize-y" placeholder="Enter description..." />
            </div>
          </div>
        </section>

        {/* Living Interface Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">Living Interface</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              className="card-elevated text-center breathing"
              animate={{
                scale: [0.98, 1.02, 0.98],
                opacity: [0.9, 1, 0.9]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-2">Breathing Card</h3>
              <p className="text-text-secondary">Gentle pulsing animation</p>
            </motion.div>
            
            <motion.div 
              className="card-elevated text-center floating"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-2">Floating Card</h3>
              <p className="text-text-secondary">Hovering motion effect</p>
            </motion.div>
            
            <motion.div 
              className="card-gradient text-center organic-hover"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-2">Interactive Card</h3>
              <p className="text-text-secondary">Hover to see effect</p>
            </motion.div>
          </div>
        </section>

        {/* Gradients Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">Gradients & Effects</h2>
          <div className="space-y-6">
            <div className="water-bg rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gradient-brand mb-2">Water Background</h3>
              <p className="text-text-secondary">Flowing water effect with gradient</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg p-8 text-white text-center">
                <h3 className="text-xl font-bold mb-2">Primary Gradient</h3>
                <p className="text-white/90">from-primary-500 to-primary-700</p>
              </div>
              
              <div className="bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-lg p-8 text-white text-center">
                <h3 className="text-xl font-bold mb-2">Secondary Gradient</h3>
                <p className="text-white/90">from-secondary-500 to-secondary-700</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing & Layout Section */}
        <section>
          <h2 className="text-3xl font-bold text-text-primary mb-6">Spacing & Layout</h2>
          <div className="card-elevated">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Spacing Scale</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((space) => (
                <div key={space} className="flex items-center gap-4">
                  <span className="text-sm font-mono text-text-tertiary w-12">{space}</span>
                  <div className={`h-8 bg-primary-500 rounded`} style={{ width: `${space * 0.25}rem` }} />
                  <span className="text-sm text-text-secondary">{space * 0.25}rem / {space * 4}px</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}