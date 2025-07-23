/**
 * useErrorHandler Hook - Centralized Error Handling
 * 
 * Provides consistent error handling across the application with:
 * - User-friendly error messages
 * - Retry logic
 * - Offline detection
 * - Error logging
 */

import { useState, useCallback, useEffect } from 'react';
import { NetworkError, TimeoutError } from '@/lib/api-client';

export interface ErrorState {
  message: string;
  code?: string;
  isRetryable: boolean;
  details?: any;
}

export interface UseErrorHandlerReturn {
  error: ErrorState | null;
  isOffline: boolean;
  clearError: () => void;
  handleError: (error: any) => void;
  retryCount: number;
  canRetry: boolean;
}

const MAX_RETRY_COUNT = 3;

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT_ERROR: 'The request took too long. Please try again.',
  AUTH_ERROR: 'You need to be logged in to access this feature.',
  NOT_FOUND: 'The requested data was not found.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
  DEFAULT: 'An unexpected error occurred. Please try again.'
};

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorState | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const handleError = useCallback((err: any) => {
    console.error('[ErrorHandler]', err);

    let errorState: ErrorState = {
      message: ERROR_MESSAGES.DEFAULT,
      isRetryable: true
    };

    // Handle offline state
    if (isOffline) {
      errorState = {
        message: 'You are currently offline. Please check your connection.',
        code: 'OFFLINE',
        isRetryable: true
      };
    }
    // Handle network errors
    else if (err instanceof NetworkError) {
      const status = err.status;
      
      if (status === 401) {
        errorState = {
          message: ERROR_MESSAGES.AUTH_ERROR,
          code: 'AUTH_ERROR',
          isRetryable: false
        };
      } else if (status === 404) {
        errorState = {
          message: ERROR_MESSAGES.NOT_FOUND,
          code: 'NOT_FOUND',
          isRetryable: false
        };
      } else if (status === 429) {
        errorState = {
          message: ERROR_MESSAGES.RATE_LIMIT,
          code: 'RATE_LIMIT',
          isRetryable: true
        };
      } else if (status && status >= 500) {
        errorState = {
          message: ERROR_MESSAGES.SERVER_ERROR,
          code: 'SERVER_ERROR',
          isRetryable: true
        };
      } else {
        errorState = {
          message: ERROR_MESSAGES.NETWORK_ERROR,
          code: 'NETWORK_ERROR',
          isRetryable: true
        };
      }
    }
    // Handle timeout errors
    else if (err instanceof TimeoutError) {
      errorState = {
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        code: 'TIMEOUT',
        isRetryable: true
      };
    }
    // Handle API response errors
    else if (err?.response?.data?.message) {
      errorState = {
        message: err.response.data.message,
        code: err.response.data.code || 'API_ERROR',
        isRetryable: err.response.status >= 500
      };
    }
    // Handle generic errors
    else if (err instanceof Error) {
      errorState = {
        message: err.message || ERROR_MESSAGES.DEFAULT,
        code: 'ERROR',
        isRetryable: true,
        details: err
      };
    }

    setError(errorState);
    
    // Increment retry count if retryable
    if (errorState.isRetryable) {
      setRetryCount(prev => prev + 1);
    }
  }, [isOffline]);

  const canRetry = error?.isRetryable && retryCount < MAX_RETRY_COUNT;

  return {
    error,
    isOffline,
    clearError,
    handleError,
    retryCount,
    canRetry
  };
}