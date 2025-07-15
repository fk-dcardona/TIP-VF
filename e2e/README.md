# E2E Testing Suite for Finkargo.ai

Comprehensive end-to-end testing for all 15 business intelligence components in production.

## Overview

This test suite validates:
- **Functionality**: All features work as expected
- **Responsiveness**: Components adapt to different screen sizes
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Load times and interaction responsiveness
- **Data Accuracy**: Calculations and visualizations are correct

## Components Tested

### Sales Intelligence (Q1)
1. **CustomerSegmentation.tsx** - Interactive customer analysis
2. **GeographicSalesMap.tsx** - SVG map visualization
3. **PricingOptimization.tsx** - AI pricing engine
4. **MarketAnalysis.tsx** - Market intelligence
5. **SalesForecasting.tsx** - Multi-scenario predictions

### Financial Intelligence (Q2)
6. **CashConversionCycle.tsx** - Cash flow timeline
7. **TrappedCashAnalysis.tsx** - Root cause analysis
8. **PaymentTermsCalculator.tsx** - Impact simulation
9. **WorkingCapitalSimulator.tsx** - Scenario modeling
10. **FinancialDrillDown.tsx** - Hierarchical metrics

### Supply Chain Intelligence (Q3)
11. **PredictiveReordering.tsx** - AI recommendations
12. **SupplierHealthScoring.tsx** - Performance monitoring
13. **LeadTimeIntelligence.tsx** - AI analysis
14. **SupplierComparison.tsx** - Multi-supplier analysis
15. **SupplyChainRiskVisualization.tsx** - Risk heatmaps

## Running Tests

### Quick Start
```bash
# Run all E2E tests
npm run test:e2e

# Run with coverage
npm run test:e2e:coverage

# Run in watch mode
npm run test:e2e:watch

# Run with visible browser (debugging)
npm run test:e2e:headful
```

### Using the Test Script
```bash
# Run comprehensive test suite
./scripts/run-e2e-tests.sh

# Run against staging environment
TEST_URL=https://staging.finkargo.ai ./scripts/run-e2e-tests.sh

# Run with visible browser
HEADLESS=false ./scripts/run-e2e-tests.sh
```

### Running Specific Test Suites
```bash
# Sales Intelligence only
npm run test:e2e -- e2e/sales-intelligence.test.ts

# Financial Intelligence only
npm run test:e2e -- e2e/financial-intelligence.test.ts

# Supply Chain Intelligence only
npm run test:e2e -- e2e/supply-chain-intelligence.test.ts
```

## Test Structure

Each component is tested for:

### 1. Functionality Tests
- Component loads correctly
- Interactive elements work
- Data displays properly
- Calculations are accurate
- State management functions

### 2. Accessibility Tests
- ARIA labels present
- Keyboard navigation works
- Screen reader compatible
- Color contrast adequate
- Focus indicators visible

### 3. Performance Tests
- Load time < 3 seconds
- Interaction response < 1 second
- Memory usage reasonable
- No memory leaks
- Efficient re-renders

### 4. Responsive Design Tests
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)
- Component adapts properly
- Touch interactions work

### 5. Data Accuracy Tests
- Calculations correct
- Real-time updates work
- Data consistency maintained
- Edge cases handled
- Error states managed

## Coverage Requirements

Target coverage goals:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 90%+
- **Lines**: 80%+

Current coverage can be viewed at: `coverage/lcov-report/index.html`

## Debugging Tests

### Visual Debugging
```bash
# Run with visible browser
HEADLESS=false npm run test:e2e

# Slow down actions for debugging
SLOW_MO=250 npm run test:e2e
```

### Using Puppeteer Inspector
```javascript
// Add this line in your test to pause execution
await page.evaluate(() => { debugger; });
```

### Screenshot on Failure
Tests automatically capture screenshots on failure in `e2e-results/screenshots/`

## Writing New Tests

### Test Template
```typescript
describe('ComponentName Tests', () => {
  test('should validate specific functionality', async () => {
    // Arrange
    await page.goto(TEST_URL);
    await page.waitForSelector('[data-testid="component"]');
    
    // Act
    await page.click('[data-testid="action-button"]');
    
    // Assert
    const result = await page.$eval(
      '[data-testid="result"]',
      el => el.textContent
    );
    expect(result).toBe('Expected Value');
  });
  
  test('should be accessible', async () => {
    await expect(page).toBeAccessible();
  });
  
  test('should perform within budget', async () => {
    const performance = await measurePerformance(page);
    expect(performance.timing.loadTime).toBeLessThan(3000);
  });
});
```

### Best Practices
1. Use data-testid attributes for reliable selectors
2. Wait for elements before interacting
3. Test both happy path and edge cases
4. Include accessibility checks
5. Measure performance metrics
6. Clean up after tests

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: |
    npm ci --legacy-peer-deps
    npm run test:e2e:coverage
  env:
    TEST_URL: ${{ secrets.PRODUCTION_URL }}
```

### Environment Variables
- `TEST_URL`: Target URL for testing
- `HEADLESS`: Run browser in headless mode
- `SLOW_MO`: Slow down actions (ms)
- `COVERAGE`: Generate coverage reports

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in jest.e2e.config.js
   - Check for missing waitForSelector calls
   - Verify selectors are correct

2. **Flaky tests**
   - Add explicit waits for dynamic content
   - Use waitForFunction for complex conditions
   - Check for race conditions

3. **Memory issues**
   - Close pages after each test
   - Clear browser cache between tests
   - Monitor memory usage

4. **Authentication issues**
   - Implement proper login flow
   - Use test accounts
   - Handle session management

## Test Reports

Reports are generated in multiple formats:
- **Markdown Report**: `e2e-test-report.md`
- **HTML Coverage**: `coverage/lcov-report/index.html`
- **JSON Results**: `e2e-results/test-results.json`
- **Screenshots**: `e2e-results/screenshots/`

## Maintenance

### Regular Tasks
1. Update selectors when UI changes
2. Add tests for new features
3. Review and update performance budgets
4. Check accessibility standards
5. Update test data

### Monthly Review
- Analyze flaky tests
- Review coverage metrics
- Update performance benchmarks
- Check for deprecated practices
- Update dependencies

## Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Axe Accessibility](https://www.deque.com/axe/)
- [Web Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

---

**Note**: These tests run against the production environment by default. Use appropriate test data and accounts to avoid affecting real user data.