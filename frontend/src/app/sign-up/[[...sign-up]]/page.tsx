'use client';

import { SignUp } from "@clerk/nextjs";
import { Package, TrendingUp, Shield } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex space-x-2">
                <Package className="w-8 h-8 text-blue-600" />
                <TrendingUp className="w-8 h-8 text-green-600" />
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">Finkargo</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join the future of supply chain intelligence. Transform your data into strategic insights with AI-powered analytics.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Benefits */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Why Choose Finkargo?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Smart Inventory Management</h4>
                      <p className="text-gray-600 text-sm">AI-powered insights for optimal stock levels and demand forecasting</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Real-time Analytics</h4>
                      <p className="text-gray-600 text-sm">Live dashboards with predictive modeling and trend analysis</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Intelligent Agents</h4>
                      <p className="text-gray-600 text-sm">Automated monitoring and optimization for your supply chain</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100">
                <p className="text-sm text-gray-600 text-center">
                  <span className="font-semibold text-blue-600">14-day free trial</span> • No credit card required • 
                  <span className="font-semibold text-green-600"> Cancel anytime</span>
                </p>
              </div>
            </div>

            {/* Right Side - Sign Up Form */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Create your account
                    </h2>
                    <p className="text-gray-600">
                      Join your team or create a new organization
                    </p>
                  </div>
                  
                  <SignUp 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-0 bg-transparent p-0",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        formButtonPrimary: "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105",
                        formFieldInput: "border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg",
                        footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                        socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50 rounded-lg transition-colors duration-200",
                        dividerLine: "bg-gray-200",
                        dividerText: "text-gray-500 bg-white px-4",
                      }
                    }}
                    routing="path"
                    path="/sign-up"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/sign-in" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}