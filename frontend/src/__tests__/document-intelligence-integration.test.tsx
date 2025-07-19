import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentCreationWizard } from '@/components/agents/AgentCreationWizard';
import { AgentType } from '@/types/agent';

// Mock the agent API client
jest.mock('@/lib/agent-api-client', () => ({
  agentApiClient: {
    createAgent: jest.fn(),
    listAgents: jest.fn(),
    executeAgent: jest.fn(),
  },
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useOrganization: () => ({
    organization: {
      id: 'test-org-id',
      name: 'Test Organization',
    },
  }),
}));

describe('Document Intelligence Agent Integration', () => {
  test('Document Intelligence Agent template is available in creation wizard', () => {
    const mockOnClose = jest.fn();
    const mockOnAgentCreated = jest.fn();

    render(
      <AgentCreationWizard 
        onClose={mockOnClose} 
        onAgentCreated={mockOnAgentCreated} 
      />
    );

    // Check if Document Intelligence Agent template is present
    expect(screen.getByText('Document Intelligence Agent')).toBeInTheDocument();
    
    // Check if it has the correct description
    expect(screen.getByText(/Advanced document analysis with 4D triangle scoring/)).toBeInTheDocument();
    
    // Check if it shows as advanced difficulty (there are multiple advanced agents, so use getAllByText)
    expect(screen.getAllByText('advanced')).toHaveLength(2); // Demand Forecaster + Document Intelligence
    
    // Check if it shows 20 min setup time
    expect(screen.getByText('20 min setup')).toBeInTheDocument();
  });

  test('Document Intelligence Agent type is defined in AgentType enum', () => {
    expect(AgentType.DOCUMENT_INTELLIGENCE).toBe('document_intelligence');
  });

  test('Document Intelligence Agent template has correct basic information', () => {
    const mockOnClose = jest.fn();
    const mockOnAgentCreated = jest.fn();

    render(
      <AgentCreationWizard 
        onClose={mockOnClose} 
        onAgentCreated={mockOnAgentCreated} 
      />
    );

    // Check for basic template information that should be visible
    expect(screen.getByText('Document Intelligence Agent')).toBeInTheDocument();
    expect(screen.getByText(/Advanced document analysis/)).toBeInTheDocument();
    expect(screen.getByText('20 min setup')).toBeInTheDocument();
  });
}); 