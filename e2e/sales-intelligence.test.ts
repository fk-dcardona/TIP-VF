import { Page } from 'puppeteer';
import { TEST_URL, SELECTORS, measurePerformance } from './setup';

describe('Sales Intelligence Components E2E Tests', () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the application
    await page.goto(TEST_URL, { waitUntil: 'networkidle0' });
    
    // TODO: Add authentication if required
    // await page.click('[data-testid="sign-in"]');
    // await page.type('[name="email"]', 'test@example.com');
    // await page.type('[name="password"]', 'password');
    // await page.click('[type="submit"]');
    
    // Navigate to sales dashboard
    await page.waitForSelector(SELECTORS.dashboard);
    await page.click(SELECTORS.salesDashboard);
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  });

  afterAll(async () => {
    await page.close();
  });

  describe('1. CustomerSegmentation.tsx - Interactive analysis functionality', () => {
    test('should load customer segmentation component', async () => {
      const element = await page.waitForSelector(SELECTORS.customerSegmentation);
      expect(element).toBeTruthy();
    });

    test('should display customer segments with filtering', async () => {
      // Wait for data to load
      await page.waitForSelector('[data-testid="segment-enterprise"]');
      
      // Verify segments are displayed
      const segments = await page.$$('[data-testid^="segment-"]');
      expect(segments.length).toBeGreaterThanOrEqual(3); // Enterprise, Mid-market, Small business
    });

    test('should allow filtering by segment', async () => {
      // Click filter button
      await page.click('[data-testid="segment-filter"]');
      
      // Select enterprise filter
      await page.click('[data-testid="filter-enterprise"]');
      
      // Verify filtered results
      await page.waitForFunction(
        () => document.querySelectorAll('[data-testid="customer-row"]').length > 0
      );
      
      const customerRows = await page.$$('[data-testid="customer-row"]');
      expect(customerRows.length).toBeGreaterThan(0);
    });

    test('should show growth tracking metrics', async () => {
      const growthMetric = await page.$('[data-testid="growth-metric"]');
      expect(growthMetric).toBeTruthy();
      
      const growthValue = await page.$eval(
        '[data-testid="growth-value"]',
        el => el.textContent
      );
      expect(growthValue).toMatch(/[\d.]+%/);
    });

    test('should be accessible', async () => {
      await expect(page).toBeAccessible();
    });

    test('should be responsive', async () => {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      const mobileElement = await page.$(SELECTORS.customerSegmentation);
      expect(mobileElement).toBeTruthy();
      
      // Reset viewport
      await page.setViewport({ width: 1920, height: 1080 });
    });
  });

  describe('2. GeographicSalesMap.tsx - SVG visualization and interactions', () => {
    test('should render SVG map', async () => {
      await page.waitForSelector('[data-testid="sales-map-svg"]');
      const svgElement = await page.$('svg[data-testid="sales-map-svg"]');
      expect(svgElement).toBeTruthy();
    });

    test('should show hover tooltips on regions', async () => {
      // Hover over a region
      const region = await page.$('[data-testid="region-northeast"]');
      await region?.hover();
      
      // Wait for tooltip
      await page.waitForSelector('[data-testid="map-tooltip"]', { visible: true });
      
      const tooltipText = await page.$eval(
        '[data-testid="map-tooltip"]',
        el => el.textContent
      );
      expect(tooltipText).toContain('Sales');
      expect(tooltipText).toContain('$');
    });

    test('should handle click interactions', async () => {
      // Click on a region
      await page.click('[data-testid="region-west"]');
      
      // Verify detail panel opens
      await page.waitForSelector('[data-testid="region-detail-panel"]');
      
      const detailTitle = await page.$eval(
        '[data-testid="region-detail-title"]',
        el => el.textContent
      );
      expect(detailTitle).toContain('West');
    });

    test('should display market penetration metrics', async () => {
      const penetrationMetric = await page.$('[data-testid="market-penetration"]');
      expect(penetrationMetric).toBeTruthy();
      
      const penetrationValue = await page.$eval(
        '[data-testid="penetration-value"]',
        el => el.textContent
      );
      expect(penetrationValue).toMatch(/[\d.]+%/);
    });
  });

  describe('3. PricingOptimization.tsx - AI pricing engine responses', () => {
    test('should load pricing optimization component', async () => {
      const element = await page.waitForSelector(SELECTORS.pricingOptimization);
      expect(element).toBeTruthy();
    });

    test('should display elasticity modeling', async () => {
      await page.waitForSelector('[data-testid="elasticity-chart"]');
      
      const elasticityValue = await page.$eval(
        '[data-testid="elasticity-coefficient"]',
        el => el.textContent
      );
      expect(elasticityValue).toMatch(/-?[\d.]+/);
    });

    test('should provide pricing recommendations', async () => {
      // Wait for AI recommendations
      await page.waitForSelector('[data-testid="pricing-recommendations"]');
      
      const recommendations = await page.$$('[data-testid="recommendation-item"]');
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('should simulate pricing scenarios', async () => {
      // Adjust price slider
      const slider = await page.$('[data-testid="price-slider"]');
      const sliderBox = await slider?.boundingBox();
      
      if (sliderBox) {
        await page.mouse.move(sliderBox.x + sliderBox.width / 2, sliderBox.y);
        await page.mouse.down();
        await page.mouse.move(sliderBox.x + sliderBox.width * 0.7, sliderBox.y);
        await page.mouse.up();
      }
      
      // Verify impact calculation
      await page.waitForSelector('[data-testid="revenue-impact"]');
      const impactValue = await page.$eval(
        '[data-testid="revenue-impact-value"]',
        el => el.textContent
      );
      expect(impactValue).toMatch(/[+-]?[\d.]+%/);
    });
  });

  describe('4. MarketAnalysis.tsx - Market intelligence data flow', () => {
    test('should display competitor analysis', async () => {
      await page.waitForSelector('[data-testid="competitor-analysis"]');
      
      const competitors = await page.$$('[data-testid="competitor-row"]');
      expect(competitors.length).toBeGreaterThan(0);
    });

    test('should show market trends', async () => {
      const trendsChart = await page.$('[data-testid="market-trends-chart"]');
      expect(trendsChart).toBeTruthy();
      
      // Verify trend indicators
      const trendIndicators = await page.$$('[data-testid="trend-indicator"]');
      expect(trendIndicators.length).toBeGreaterThan(0);
    });

    test('should provide customer acquisition insights', async () => {
      const acquisitionMetrics = await page.$('[data-testid="acquisition-metrics"]');
      expect(acquisitionMetrics).toBeTruthy();
      
      const cacValue = await page.$eval(
        '[data-testid="cac-value"]',
        el => el.textContent
      );
      expect(cacValue).toMatch(/\$[\d,]+/);
    });
  });

  describe('5. SalesForecasting.tsx - Multi-scenario predictions', () => {
    test('should display forecast scenarios', async () => {
      await page.waitForSelector('[data-testid="forecast-scenarios"]');
      
      // Verify all three scenarios
      const scenarios = ['bull', 'base', 'bear'];
      for (const scenario of scenarios) {
        const element = await page.$(`[data-testid="scenario-${scenario}"]`);
        expect(element).toBeTruthy();
      }
    });

    test('should show confidence intervals', async () => {
      const confidenceInterval = await page.$('[data-testid="confidence-interval"]');
      expect(confidenceInterval).toBeTruthy();
      
      const confidenceValue = await page.$eval(
        '[data-testid="confidence-value"]',
        el => el.textContent
      );
      expect(confidenceValue).toMatch(/[\d.]+%/);
    });

    test('should update forecasts based on parameters', async () => {
      // Change forecast period
      await page.click('[data-testid="forecast-period-select"]');
      await page.click('[data-testid="period-6months"]');
      
      // Wait for chart update
      await page.waitForTimeout(1000);
      
      // Verify forecast updated
      const forecastValue = await page.$eval(
        '[data-testid="forecast-total"]',
        el => el.textContent
      );
      expect(forecastValue).toMatch(/\$[\d.,]+[KMB]?/);
    });

    test('should track ML accuracy metrics', async () => {
      const accuracyMetric = await page.$('[data-testid="ml-accuracy"]');
      expect(accuracyMetric).toBeTruthy();
      
      const accuracyValue = await page.$eval(
        '[data-testid="accuracy-percentage"]',
        el => el.textContent
      );
      expect(parseFloat(accuracyValue || '0')).toBeGreaterThan(70);
    });
  });

  describe('Performance Tests for Sales Intelligence', () => {
    test('should load sales dashboard within performance budget', async () => {
      const performance = await measurePerformance(page);
      
      expect(performance.timing.loadTime).toBeLessThan(3000); // 3 seconds
      expect(performance.timing.domContentLoaded).toBeLessThan(1500); // 1.5 seconds
      expect(performance.metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    test('should handle data updates efficiently', async () => {
      const startTime = Date.now();
      
      // Trigger data refresh
      await page.click('[data-testid="refresh-data"]');
      await page.waitForSelector('[data-testid="loading-complete"]');
      
      const endTime = Date.now();
      const refreshTime = endTime - startTime;
      
      expect(refreshTime).toBeLessThan(1000); // 1 second
    });
  });
});