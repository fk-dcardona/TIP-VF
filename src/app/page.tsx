'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, TrendingUp, Shield, Play } from "lucide-react";

export default function HomePage() {
  // Check if Clerk is configured
  const isClerkConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (isClerkConfigured) {
    // Use Clerk components when configured
    const { SignedIn, SignedOut } = require("@clerk/nextjs");
    const { redirect } = require("next/navigation");
    
    return (
      <div className="min-h-screen bg-gray-50">
        <SignedOut>
          <HomePage_Content showAuth={true} />
        </SignedOut>
        
        <SignedIn>
          {redirect("/dashboard")}
        </SignedIn>
      </div>
    );
  }

  // Demo mode without authentication
  return (
    <div className="min-h-screen bg-gray-50">
      <HomePage_Content showAuth={false} />
    </div>
  );
}

function HomePage_Content({ showAuth }: { showAuth: boolean }) {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Supply Chain Intelligence
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your supply chain data into strategic insights with AI-powered analytics
          </p>
          
          {showAuth ? (
            <div className="flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8">
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  <Play className="mr-2 w-5 h-5" />
                  Try Demo Dashboard
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Living Interface Demo
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Demo Notice */}
      {!showAuth && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              <strong>Demo Mode:</strong> Authentication is disabled for testing. 
              You can explore the dashboard and features without signing up.
            </p>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Package className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Inventory</h3>
            <p className="text-gray-600">
              Upload CSV files and get instant insights on inventory levels and optimization opportunities
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">
              Visualize trends, track KPIs, and make data-driven decisions with powerful analytics
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Shield className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Agents</h3>
            <p className="text-gray-600">
              Deploy intelligent agents to monitor, alert, and optimize your supply chain automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}