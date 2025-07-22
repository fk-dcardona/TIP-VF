/**
 * Document Intelligence Component - Single Responsibility Principle Implementation
 * Single responsibility: Display document intelligence metrics
 */

'use client';

import React from 'react';
import { Card, Metric, Text, Grid } from '@tremor/react';
import { FileText, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { DashboardMetrics } from '@/types/api';

interface DocumentIntelligenceProps {
  documentIntelligence: DashboardMetrics['documentIntelligence'];
}

export function DocumentIntelligence({ documentIntelligence }: DocumentIntelligenceProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">Document Intelligence</h2>
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
        <div className="text-center">
          <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <Text>Total Documents</Text>
          <Metric>{documentIntelligence.totalDocuments}</Metric>
        </div>
        <div className="text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <Text>Validated</Text>
          <Metric>{documentIntelligence.validatedDocuments}</Metric>
        </div>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <Text>Compromised Inventory</Text>
          <Metric>{documentIntelligence.compromisedInventory}</Metric>
        </div>
        <div className="text-center">
          <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <Text>Cross-Reference Score</Text>
          <Metric>{documentIntelligence.crossReferenceScore}%</Metric>
        </div>
      </Grid>
    </Card>
  );
} 