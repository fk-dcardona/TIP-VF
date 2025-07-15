import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganization } from '@clerk/nextjs';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  useOrganization: jest.fn(),
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  OrganizationSwitcher: () => <div data-testid="org-switcher">Organization Switcher</div>,
  UserButton: () => <div data-testid="user-button">User Button</div>,
}));

// Mock API fetch hook
jest.mock('@/hooks/useAPIFetch', () => ({
  useAPIFetch: jest.fn(() => ({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useDocumentAnalytics: jest.fn(() => ({
    analyticsData: {
      processing_time: 1200,
      total_pages: 50,
      accuracy_score: 95,
      categories: [
        { name: 'Contracts', count: 20, percentage: 40 },
        { name: 'Invoices', count: 30, percentage: 60 }
      ],
      processing_stages: [
        { stage: 'Upload', duration: 100, status: 'completed' },
        { stage: 'Process', duration: 800, status: 'completed' },
        { stage: 'Analyze', duration: 300, status: 'completed' }
      ],
      recent_documents: []
    },
    isLoading: false,
    error: null,
    retry: jest.fn(),
    isRetrying: false
  }))
}));

describe('Critical User Paths', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/',
    });
  });

  describe('1. Authentication Flow', () => {
    it('should show landing page with sign in/sign up buttons when not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({ userId: null });
      
      const HomePage = (await import('@/app/page')).default;
      render(<HomePage />);
      
      expect(screen.getByText('Supply Chain Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should redirect to dashboard when authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({ userId: 'user123' });
      (useOrganization as jest.Mock).mockReturnValue({ 
        organization: { id: 'org123', name: 'Test Org' } 
      });
      
      const HomePage = (await import('@/app/page')).default;
      render(<HomePage />);
      
      // Should redirect to dashboard
      await waitFor(() => {
        expect(require('next/navigation').redirect).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show demo mode when Clerk is not configured', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      
      const HomePage = (await import('@/app/page')).default;
      render(<HomePage />);
      
      expect(screen.getByText('Try Demo Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Demo Mode:/)).toBeInTheDocument();
      
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalEnv;
    });
  });

  describe('2. Dashboard Navigation', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({ userId: 'user123' });
      (useOrganization as jest.Mock).mockReturnValue({ 
        organization: { id: 'org123', name: 'Test Org' } 
      });
    });

    it('should render main dashboard with all navigation cards', async () => {
      const MainDashboard = (await import('@/components/MainDashboard')).default;
      render(<MainDashboard />);
      
      // Check for dashboard sections
      expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Sales Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Procurement Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Agent Management')).toBeInTheDocument();
      expect(screen.getByText('Team Management')).toBeInTheDocument();
    });

    it('should navigate to finance dashboard', async () => {
      const MainDashboard = (await import('@/components/MainDashboard')).default;
      render(<MainDashboard />);
      
      const financeButton = screen.getByText('View Finance');
      fireEvent.click(financeButton);
      
      expect(window.location.href).toContain('/dashboard/finance');
    });

    it('should navigate to sales dashboard', async () => {
      const MainDashboard = (await import('@/components/MainDashboard')).default;
      render(<MainDashboard />);
      
      const salesButton = screen.getByText('View Sales');
      fireEvent.click(salesButton);
      
      expect(window.location.href).toContain('/dashboard/sales');
    });

    it('should navigate to procurement dashboard', async () => {
      const MainDashboard = (await import('@/components/MainDashboard')).default;
      render(<MainDashboard />);
      
      const procurementButton = screen.getByText('View Procurement');
      fireEvent.click(procurementButton);
      
      expect(window.location.href).toContain('/dashboard/procurement');
    });
  });

  describe('3. Business Intelligence Components', () => {
    // Sales Intelligence (Q1)
    describe('Sales Intelligence Components', () => {
      it('should render CustomerSegmentation component', async () => {
        const CustomerSegmentation = (await import('@/components/CustomerSegmentation')).default;
        render(<CustomerSegmentation customers={[]} />);
        
        expect(screen.getByText(/Customer Segmentation/i)).toBeInTheDocument();
      });

      it('should render GeographicSalesMap component', async () => {
        const GeographicSalesMap = (await import('@/components/GeographicSalesMap')).default;
        render(<GeographicSalesMap regionData={[]} />);
        
        expect(screen.getByText(/Geographic Sales/i)).toBeInTheDocument();
      });

      it('should render PricingOptimization component', async () => {
        const PricingOptimization = (await import('@/components/PricingOptimization')).default;
        render(<PricingOptimization products={[]} />);
        
        expect(screen.getByText(/Pricing Optimization/i)).toBeInTheDocument();
      });

      it('should render MarketAnalysis component', async () => {
        const MarketAnalysis = (await import('@/components/MarketAnalysis')).default;
        render(<MarketAnalysis data={{ market_trends: [], competitor_analysis: [], market_opportunities: [] }} />);
        
        expect(screen.getByText(/Market Analysis/i)).toBeInTheDocument();
      });

      it('should render SalesForecasting component', async () => {
        const SalesForecasting = (await import('@/components/SalesForecasting')).default;
        render(<SalesForecasting data={{ predictions: [], confidence_intervals: [], seasonal_factors: [] }} />);
        
        expect(screen.getByText(/Sales Forecasting/i)).toBeInTheDocument();
      });
    });

    // Financial Intelligence (Q2)
    describe('Financial Intelligence Components', () => {
      it('should render CashConversionCycle component', async () => {
        const CashConversionCycle = (await import('@/components/CashConversionCycle')).default;
        render(<CashConversionCycle data={{ cycle_days: 45, components: { inventory_days: 30, receivable_days: 25, payable_days: 10 }, trends: [] }} />);
        
        expect(screen.getByText(/Cash Conversion Cycle/i)).toBeInTheDocument();
      });

      it('should render TrappedCashAnalysis component', async () => {
        const TrappedCashAnalysis = (await import('@/components/TrappedCashAnalysis')).default;
        render(<TrappedCashAnalysis cashTraps={[]} totalWorkingCapital={100000} />);
        
        expect(screen.getByText(/Trapped Cash Analysis/i)).toBeInTheDocument();
      });

      it('should render PaymentTermsCalculator component', async () => {
        const PaymentTermsCalculator = (await import('@/components/PaymentTermsCalculator')).default;
        render(<PaymentTermsCalculator data={{ current_terms: { payment_days: 30, discount_rate: 2 }, optimization_scenarios: [] }} />);
        
        expect(screen.getByText(/Payment Terms/i)).toBeInTheDocument();
      });

      it('should render WorkingCapitalSimulator component', async () => {
        const WorkingCapitalSimulator = (await import('@/components/WorkingCapitalSimulator')).default;
        render(<WorkingCapitalSimulator data={{ current_working_capital: 100000, scenarios: [], optimization_opportunities: [] }} />);
        
        expect(screen.getByText(/Working Capital/i)).toBeInTheDocument();
      });

      it('should render FinancialDrillDown component', async () => {
        const FinancialDrillDown = (await import('@/components/FinancialDrillDown')).default;
        render(<FinancialDrillDown data={{ metrics: [], hierarchies: {}, variance_analysis: [] }} />);
        
        expect(screen.getByText(/Financial.*Drill.*Down/i)).toBeInTheDocument();
      });
    });

    // Supply Chain Intelligence (Q3)
    describe('Supply Chain Intelligence Components', () => {
      it('should render PredictiveReordering component', async () => {
        const PredictiveReordering = (await import('@/components/PredictiveReordering')).default;
        render(<PredictiveReordering data={{ recommendations: [], reorder_points: {}, lead_time_predictions: {} }} />);
        
        expect(screen.getByText(/Predictive Reordering/i)).toBeInTheDocument();
      });

      it('should render SupplierHealthScoring component', async () => {
        const SupplierHealthScoring = (await import('@/components/SupplierHealthScoring')).default;
        render(<SupplierHealthScoring data={{ suppliers: [], health_metrics: {}, risk_indicators: [] }} />);
        
        expect(screen.getByText(/Supplier Health/i)).toBeInTheDocument();
      });

      it('should render LeadTimeIntelligence component', async () => {
        const LeadTimeIntelligence = (await import('@/components/LeadTimeIntelligence')).default;
        render(<LeadTimeIntelligence data={{ suppliers: [], average_lead_times: {}, optimization_opportunities: [] }} />);
        
        expect(screen.getByText(/Lead Time/i)).toBeInTheDocument();
      });

      it('should render SupplierComparison component', async () => {
        const SupplierComparison = (await import('@/components/SupplierComparison')).default;
        render(<SupplierComparison data={{ suppliers: [], comparison_metrics: [], recommendations: [] }} />);
        
        expect(screen.getByText(/Supplier Comparison/i)).toBeInTheDocument();
      });

      it('should render SupplyChainRiskVisualization component', async () => {
        const SupplyChainRiskVisualization = (await import('@/components/SupplyChainRiskVisualization')).default;
        render(<SupplyChainRiskVisualization data={{ risk_matrix: [], risk_categories: [], mitigation_strategies: [] }} />);
        
        expect(screen.getByText(/Supply Chain Risk/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Living Interface System', () => {
    it('should render OrganicDashboard with breathing animations', async () => {
      const OrganicDashboard = (await import('@/components/DocumentIntelligence/OrganicDashboard')).default;
      render(<OrganicDashboard orgId="org123" />);
      
      expect(screen.getByText(/Document Intelligence/i)).toBeInTheDocument();
      // Check for breathing animation classes
      const animatedElements = screen.getAllByTestId(/breathing|organic|living/i);
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const OrganicDashboard = (await import('@/components/DocumentIntelligence/OrganicDashboard')).default;
      render(<OrganicDashboard orgId="org123" />);
      
      // Should not have motion classes when reduced motion is preferred
      const elements = screen.queryAllByTestId(/animate|motion/i);
      elements.forEach(el => {
        expect(el).not.toHaveClass(/animate/);
      });
    });
  });

  describe('5. Quick Actions', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({ userId: 'user123' });
      (useOrganization as jest.Mock).mockReturnValue({ 
        organization: { id: 'org123', name: 'Test Org' } 
      });
    });

    it('should display quick action buttons', async () => {
      const MainDashboard = (await import('@/components/MainDashboard')).default;
      render(<MainDashboard />);
      
      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
      expect(screen.getByText('Create Agent')).toBeInTheDocument();
    });

    it('should handle upload documents action', async () => {
      const MainDashboard = (await import('@/components/MainDashboard')).default;
      render(<MainDashboard />);
      
      const uploadButton = screen.getByText('Upload Documents');
      fireEvent.click(uploadButton);
      
      // Should trigger upload action (implementation specific)
    });
  });

  describe('6. Error Handling', () => {
    it('should display error boundary for component failures', async () => {
      const ErrorBoundary = (await import('@/components/ErrorBoundary')).default;
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should handle missing organization gracefully', async () => {
      (useAuth as jest.Mock).mockReturnValue({ userId: 'user123' });
      (useOrganization as jest.Mock).mockReturnValue({ organization: null });
      
      const MainDashboard = (await import('@/components/MainDashboard')).default;
      render(<MainDashboard />);
      
      expect(screen.getByText(/select or create an organization/i)).toBeInTheDocument();
    });
  });
});