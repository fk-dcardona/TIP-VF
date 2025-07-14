import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supply Chain Intelligence",
  description: "Transform your data into strategic insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if Clerk is configured
  const isClerkConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (isClerkConfigured) {
    return (
      <ClerkProvider
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: "#0066CC",
          },
        }}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/onboarding"
      >
        <html lang="en">
          <body className={`${inter.variable} antialiased`}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </body>
        </html>
      </ClerkProvider>
    );
  }

  // Fallback without Clerk for demo/development
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ErrorBoundary>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Demo Mode:</strong> Authentication is not configured. 
                  <a href="/dashboard" className="underline ml-1">View Dashboard</a>
                </p>
              </div>
            </div>
          </div>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

