/**
 * useOrganization Hook - Get current organization ID
 * 
 * This hook provides the current organization ID for API calls.
 * In development mode, it returns a default test organization ID.
 * In production, it will use Clerk's organization context.
 */

import { useOrganization as useClerkOrganization, useAuth } from '@clerk/nextjs';

export function useOrganization() {
  const { isLoaded, isSignedIn } = useAuth();
  const { organization, isLoaded: orgLoaded } = useClerkOrganization();

  // Default organization ID for development/testing
  const DEFAULT_ORG_ID = 'org_test_123';

  // In development mode, always return the default org ID
  if (process.env.NODE_ENV === 'development' || !isSignedIn) {
    return {
      orgId: DEFAULT_ORG_ID,
      isLoaded: true,
      organization: null
    };
  }

  // In production, wait for Clerk to load
  if (!isLoaded || !orgLoaded) {
    return {
      orgId: null,
      isLoaded: false,
      organization: null
    };
  }

  // Return the actual organization ID from Clerk
  return {
    orgId: organization?.id || DEFAULT_ORG_ID,
    isLoaded: true,
    organization
  };
}