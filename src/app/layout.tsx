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
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}

