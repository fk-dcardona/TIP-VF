/**
 * Global Error Handler Component
 * 
 * Provides application-wide error handling and toast notifications
 */

'use client';

import React, { useEffect } from 'react';
// import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

interface GlobalErrorHandlerProps {
  children: React.ReactNode;
}

export const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = ({ children }) => {
  // const { toast } = useToast();

  useEffect(() => {
    // Handle network status changes
    const handleOnline = () => {
      console.log('[GlobalErrorHandler] Connection restored - back online');
      // Toast notification would go here
    };

    const handleOffline = () => {
      console.log('[GlobalErrorHandler] Connection lost - now offline');
      // Toast notification would go here
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event);
      
      // Don't show toast for network errors (handled by useErrorHandler)
      if (event.reason?.message?.includes('fetch')) {
        return;
      }

      console.error('[GlobalErrorHandler] Unexpected error - would show toast notification');
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event);
      
      // Don't show toast for script loading errors in development
      if (process.env.NODE_ENV === 'development' && event.message.includes('Script error')) {
        return;
      }

      console.error('[GlobalErrorHandler] Application error - would show toast notification');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Check initial online status
    if (!navigator.onLine) {
      handleOffline();
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <>{children}</>;
};