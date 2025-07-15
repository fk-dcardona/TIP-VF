import { AxePuppeteer } from '@axe-core/puppeteer';
import { Page } from 'puppeteer';

// Extend global test timeout for E2E tests
jest.setTimeout(120000);

// Custom matchers for accessibility testing
expect.extend({
  async toBeAccessible(page: Page) {
    const results = await new AxePuppeteer(page).analyze();
    const pass = results.violations.length === 0;
    
    if (pass) {
      return {
        message: () => 'Page is accessible',
        pass: true,
      };
    } else {
      return {
        message: () => {
          const violations = results.violations
            .map((v) => `${v.id}: ${v.description} (${v.nodes.length} instances)`)
            .join('\n');
          return `Page has accessibility violations:\n${violations}`;
        },
        pass: false,
      };
    }
  },
});

// Performance monitoring utilities
export const measurePerformance = async (page: Page) => {
  const metrics = await page.metrics();
  const performanceTiming = JSON.parse(
    await page.evaluate(() => JSON.stringify(window.performance.timing))
  );
  
  return {
    metrics,
    timing: {
      loadTime: performanceTiming.loadEventEnd - performanceTiming.navigationStart,
      domContentLoaded: performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart,
      firstPaint: metrics.FirstMeaningfulPaint,
    },
  };
};

// Test environment configuration
export const TEST_URL = process.env.TEST_URL || 'https://finkargo.ai';
export const TEST_TIMEOUT = 30000;

// Common selectors for business intelligence components
export const SELECTORS = {
  // Navigation
  dashboard: '[data-testid="dashboard"]',
  salesDashboard: '[href="/dashboard/sales"]',
  financeDashboard: '[href="/dashboard/finance"]',
  procurementDashboard: '[href="/dashboard/procurement"]',
  
  // Sales Intelligence Components
  customerSegmentation: '[data-testid="customer-segmentation"]',
  geographicSalesMap: '[data-testid="geographic-sales-map"]',
  pricingOptimization: '[data-testid="pricing-optimization"]',
  marketAnalysis: '[data-testid="market-analysis"]',
  salesForecasting: '[data-testid="sales-forecasting"]',
  
  // Financial Intelligence Components
  cashConversionCycle: '[data-testid="cash-conversion-cycle"]',
  trappedCashAnalysis: '[data-testid="trapped-cash-analysis"]',
  paymentTermsCalculator: '[data-testid="payment-terms-calculator"]',
  workingCapitalSimulator: '[data-testid="working-capital-simulator"]',
  financialDrillDown: '[data-testid="financial-drill-down"]',
  
  // Supply Chain Intelligence Components
  predictiveReordering: '[data-testid="predictive-reordering"]',
  supplierHealthScoring: '[data-testid="supplier-health-scoring"]',
  leadTimeIntelligence: '[data-testid="lead-time-intelligence"]',
  supplierComparison: '[data-testid="supplier-comparison"]',
  supplyChainRiskVisualization: '[data-testid="supply-chain-risk-visualization"]',
};