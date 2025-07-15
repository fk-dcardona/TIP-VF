import { Page } from 'puppeteer';
import { TEST_URL, SELECTORS, measurePerformance } from './setup';

describe('Financial Intelligence Components E2E Tests', () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the application
    await page.goto(TEST_URL, { waitUntil: 'networkidle0' });
    
    // Navigate to finance dashboard
    await page.waitForSelector(SELECTORS.dashboard);
    await page.click(SELECTORS.financeDashboard);
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  });

  afterAll(async () => {
    await page.close();
  });

  describe('6. CashConversionCycle.tsx - Cash flow timeline visualization', () => {
    test('should load cash conversion cycle component', async () => {
      const element = await page.waitForSelector(SELECTORS.cashConversionCycle);
      expect(element).toBeTruthy();
    });

    test('should display DIO, DSO, and DPO metrics', async () => {
      // Days Inventory Outstanding
      const dioElement = await page.waitForSelector('[data-testid="dio-metric"]');
      const dioValue = await page.$eval('[data-testid="dio-value"]', el => el.textContent);
      expect(dioValue).toMatch(/\d+ days/);

      // Days Sales Outstanding
      const dsoElement = await page.$('[data-testid="dso-metric"]');
      const dsoValue = await page.$eval('[data-testid="dso-value"]', el => el.textContent);
      expect(dsoValue).toMatch(/\d+ days/);

      // Days Payables Outstanding
      const dpoElement = await page.$('[data-testid="dpo-metric"]');
      const dpoValue = await page.$eval('[data-testid="dpo-value"]', el => el.textContent);
      expect(dpoValue).toMatch(/\d+ days/);
    });

    test('should visualize cash flow timeline', async () => {
      const timeline = await page.$('[data-testid="cash-flow-timeline"]');
      expect(timeline).toBeTruthy();

      // Verify timeline segments
      const segments = await page.$$('[data-testid^="timeline-segment-"]');
      expect(segments.length).toBeGreaterThanOrEqual(3);
    });

    test('should show optimization opportunities', async () => {
      const opportunities = await page.$$('[data-testid="optimization-opportunity"]');
      expect(opportunities.length).toBeGreaterThan(0);

      // Click on first opportunity
      await opportunities[0].click();
      
      // Verify detail modal
      await page.waitForSelector('[data-testid="opportunity-detail"]');
      const impactValue = await page.$eval(
        '[data-testid="potential-impact"]',
        el => el.textContent
      );
      expect(impactValue).toMatch(/\$[\d,]+/);
    });

    test('should compare with benchmarks', async () => {
      const benchmarkToggle = await page.$('[data-testid="show-benchmarks"]');
      await benchmarkToggle?.click();

      await page.waitForSelector('[data-testid="benchmark-comparison"]');
      const benchmarkData = await page.$('[data-testid="industry-benchmark"]');
      expect(benchmarkData).toBeTruthy();
    });
  });

  describe('7. TrappedCashAnalysis.tsx - Root cause analysis logic', () => {
    test('should categorize trapped cash issues', async () => {
      await page.waitForSelector(SELECTORS.trappedCashAnalysis);
      
      const categories = await page.$$('[data-testid^="trapped-cash-category-"]');
      expect(categories.length).toBeGreaterThan(0);

      // Verify category details
      for (const category of categories) {
        const amount = await category.$eval(
          '[data-testid="category-amount"]',
          el => el.textContent
        );
        expect(amount).toMatch(/\$[\d.,]+[KMB]?/);
      }
    });

    test('should provide actionable recommendations', async () => {
      const recommendations = await page.$$('[data-testid="cash-recommendation"]');
      expect(recommendations.length).toBeGreaterThan(0);

      // Each recommendation should have priority and impact
      for (const rec of recommendations) {
        const priority = await rec.$('[data-testid="recommendation-priority"]');
        const impact = await rec.$('[data-testid="recommendation-impact"]');
        expect(priority).toBeTruthy();
        expect(impact).toBeTruthy();
      }
    });

    test('should identify quick wins', async () => {
      const quickWins = await page.$$('[data-testid="quick-win"]');
      expect(quickWins.length).toBeGreaterThan(0);

      // Click on a quick win
      await quickWins[0].click();
      
      // Verify implementation guide appears
      await page.waitForSelector('[data-testid="implementation-guide"]');
      const steps = await page.$$('[data-testid="implementation-step"]');
      expect(steps.length).toBeGreaterThan(0);
    });

    test('should calculate ROI for recommendations', async () => {
      const roiElements = await page.$$('[data-testid="recommendation-roi"]');
      
      for (const element of roiElements) {
        const roiValue = await element.evaluate(el => el.textContent);
        expect(roiValue).toMatch(/\d+%/);
      }
    });
  });

  describe('8. PaymentTermsCalculator.tsx - Impact simulation accuracy', () => {
    test('should load payment terms calculator', async () => {
      const element = await page.waitForSelector(SELECTORS.paymentTermsCalculator);
      expect(element).toBeTruthy();
    });

    test('should simulate customer payment terms', async () => {
      // Adjust customer payment terms
      await page.click('[data-testid="customer-terms-input"]');
      await page.keyboard.press('Control+A');
      await page.type('[data-testid="customer-terms-input"]', '45');

      // Wait for calculation
      await page.waitForTimeout(500);

      // Verify cash flow impact
      const customerImpact = await page.$eval(
        '[data-testid="customer-terms-impact"]',
        el => el.textContent
      );
      expect(customerImpact).toMatch(/[+-]\$[\d,]+/);
    });

    test('should simulate supplier payment terms', async () => {
      // Adjust supplier payment terms
      await page.click('[data-testid="supplier-terms-input"]');
      await page.keyboard.press('Control+A');
      await page.type('[data-testid="supplier-terms-input"]', '60');

      // Wait for calculation
      await page.waitForTimeout(500);

      // Verify cash flow impact
      const supplierImpact = await page.$eval(
        '[data-testid="supplier-terms-impact"]',
        el => el.textContent
      );
      expect(supplierImpact).toMatch(/[+-]\$[\d,]+/);
    });

    test('should show combined impact analysis', async () => {
      const combinedImpact = await page.$('[data-testid="combined-impact"]');
      expect(combinedImpact).toBeTruthy();

      // Verify working capital change
      const wcChange = await page.$eval(
        '[data-testid="working-capital-change"]',
        el => el.textContent
      );
      expect(wcChange).toMatch(/[+-]\$[\d,]+/);
    });

    test('should provide optimization scenarios', async () => {
      await page.click('[data-testid="optimize-terms-button"]');
      
      await page.waitForSelector('[data-testid="optimization-scenarios"]');
      const scenarios = await page.$$('[data-testid="terms-scenario"]');
      expect(scenarios.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('9. WorkingCapitalSimulator.tsx - Scenario modeling', () => {
    test('should display scenario controls', async () => {
      await page.waitForSelector(SELECTORS.workingCapitalSimulator);
      
      const scenarioTypes = ['conservative', 'moderate', 'aggressive'];
      for (const type of scenarioTypes) {
        const button = await page.$(`[data-testid="scenario-${type}"]`);
        expect(button).toBeTruthy();
      }
    });

    test('should model seasonal variations', async () => {
      // Enable seasonal modeling
      await page.click('[data-testid="enable-seasonal"]');
      
      // Verify seasonal chart appears
      await page.waitForSelector('[data-testid="seasonal-chart"]');
      
      // Check for monthly variations
      const monthlyData = await page.$$('[data-testid^="month-"]');
      expect(monthlyData.length).toBe(12);
    });

    test('should calculate confidence intervals', async () => {
      const confidenceBands = await page.$('[data-testid="confidence-bands"]');
      expect(confidenceBands).toBeTruthy();

      // Verify upper and lower bounds
      const upperBound = await page.$eval(
        '[data-testid="upper-bound"]',
        el => el.textContent
      );
      const lowerBound = await page.$eval(
        '[data-testid="lower-bound"]',
        el => el.textContent
      );
      
      expect(upperBound).toMatch(/\$[\d.,]+[KMB]?/);
      expect(lowerBound).toMatch(/\$[\d.,]+[KMB]?/);
    });

    test('should allow parameter adjustments', async () => {
      // Adjust growth rate
      const growthSlider = await page.$('[data-testid="growth-rate-slider"]');
      const sliderBox = await growthSlider?.boundingBox();
      
      if (sliderBox) {
        await page.mouse.move(sliderBox.x + sliderBox.width * 0.3, sliderBox.y);
        await page.mouse.down();
        await page.mouse.move(sliderBox.x + sliderBox.width * 0.6, sliderBox.y);
        await page.mouse.up();
      }

      // Verify simulation updates
      await page.waitForTimeout(500);
      const projectedValue = await page.$eval(
        '[data-testid="projected-working-capital"]',
        el => el.textContent
      );
      expect(projectedValue).toMatch(/\$[\d.,]+[KMB]?/);
    });
  });

  describe('10. FinancialDrillDown.tsx - Hierarchical metrics drill-down', () => {
    test('should display top-level financial metrics', async () => {
      await page.waitForSelector(SELECTORS.financialDrillDown);
      
      const topLevelMetrics = ['revenue', 'costs', 'profit', 'margins'];
      for (const metric of topLevelMetrics) {
        const element = await page.$(`[data-testid="metric-${metric}"]`);
        expect(element).toBeTruthy();
      }
    });

    test('should enable drill-down navigation', async () => {
      // Click on revenue to drill down
      await page.click('[data-testid="metric-revenue"]');
      
      // Wait for sub-categories
      await page.waitForSelector('[data-testid="revenue-breakdown"]');
      const subCategories = await page.$$('[data-testid^="revenue-sub-"]');
      expect(subCategories.length).toBeGreaterThan(0);
    });

    test('should show variance analysis', async () => {
      const varianceToggle = await page.$('[data-testid="show-variance"]');
      await varianceToggle?.click();

      // Verify variance indicators
      const varianceElements = await page.$$('[data-testid="variance-indicator"]');
      for (const element of varianceElements) {
        const variance = await element.evaluate(el => el.textContent);
        expect(variance).toMatch(/[+-][\d.]+%/);
      }
    });

    test('should support multi-level drill-down', async () => {
      // Reset to top level
      await page.click('[data-testid="breadcrumb-home"]');
      
      // Drill down multiple levels
      await page.click('[data-testid="metric-costs"]');
      await page.waitForSelector('[data-testid="costs-breakdown"]');
      
      await page.click('[data-testid="cost-sub-operations"]');
      await page.waitForSelector('[data-testid="operations-breakdown"]');
      
      // Verify breadcrumb trail
      const breadcrumbs = await page.$$('[data-testid^="breadcrumb-"]');
      expect(breadcrumbs.length).toBeGreaterThanOrEqual(3);
    });

    test('should export drill-down data', async () => {
      await page.click('[data-testid="export-data"]');
      
      // Verify export options
      await page.waitForSelector('[data-testid="export-options"]');
      const exportFormats = ['csv', 'excel', 'pdf'];
      for (const format of exportFormats) {
        const option = await page.$(`[data-testid="export-${format}"]`);
        expect(option).toBeTruthy();
      }
    });
  });

  describe('Performance Tests for Financial Intelligence', () => {
    test('should load finance dashboard within performance budget', async () => {
      const performance = await measurePerformance(page);
      
      expect(performance.timing.loadTime).toBeLessThan(3000); // 3 seconds
      expect(performance.timing.domContentLoaded).toBeLessThan(1500); // 1.5 seconds
      expect(performance.metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    test('should handle complex calculations efficiently', async () => {
      const startTime = Date.now();
      
      // Trigger recalculation
      await page.click('[data-testid="recalculate-all"]');
      await page.waitForSelector('[data-testid="calculation-complete"]');
      
      const endTime = Date.now();
      const calculationTime = endTime - startTime;
      
      expect(calculationTime).toBeLessThan(2000); // 2 seconds
    });
  });

  describe('Accessibility Tests for Financial Intelligence', () => {
    test('all financial components should be accessible', async () => {
      await expect(page).toBeAccessible();
    });

    test('should support keyboard navigation', async () => {
      // Tab through components
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper ARIA labels', async () => {
      const ariaElements = await page.$$('[aria-label], [aria-describedby]');
      expect(ariaElements.length).toBeGreaterThan(10);
    });
  });
});