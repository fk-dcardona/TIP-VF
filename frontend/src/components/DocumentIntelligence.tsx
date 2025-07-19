'use client';

import React from 'react';
import OrganicDashboard from './DocumentIntelligence/OrganicDashboard';

interface DocumentIntelligenceProps {
  orgId: string;
}

export default function DocumentIntelligence({ orgId }: DocumentIntelligenceProps) {
  return <OrganicDashboard orgId={orgId} />;
}