/**
 * Browser-based API Integration Test
 * 
 * This script can be run in the browser console to test API integration
 * Usage: Copy and paste this into the browser console while on the dashboard page
 */

export async function testAPIInBrowser() {
  // Import the API client
  const { apiClient } = await import('@/lib/api-client');
  
  const TEST_ORG_ID = 'org_test_123';
  
  console.log('%c🚀 Starting API Integration Tests...', 'color: blue; font-size: 16px; font-weight: bold');
  
  const tests = [
    {
      name: 'Analytics Health',
      fn: () => apiClient.getAnalyticsHealth()
    },
    {
      name: 'Triangle Analytics',
      fn: () => apiClient.getTriangleAnalytics(TEST_ORG_ID)
    },
    {
      name: 'Cross-Reference Analytics',
      fn: () => apiClient.getCrossReferenceAnalytics(TEST_ORG_ID)
    },
    {
      name: 'Supplier Performance',
      fn: () => apiClient.getSupplierPerformanceAnalytics(TEST_ORG_ID)
    },
    {
      name: 'Market Intelligence',
      fn: () => apiClient.getMarketIntelligenceAnalytics(TEST_ORG_ID)
    },
    {
      name: 'Dashboard Analytics',
      fn: () => apiClient.getDashboardAnalytics(TEST_ORG_ID)
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n%c📋 Testing: ${test.name}...`, 'color: orange; font-weight: bold');
    
    try {
      const data = await test.fn();
      console.log('%c✅ Success:', 'color: green; font-weight: bold', data);
      results.push({ test: test.name, status: 'success', data });
    } catch (error) {
      console.error('%c❌ Error:', 'color: red; font-weight: bold', error);
      results.push({ test: test.name, status: 'error', error });
    }
  }
  
  // Summary
  console.log('\n%c📊 TEST SUMMARY', 'color: blue; font-size: 18px; font-weight: bold');
  console.table(results.map(r => ({
    Test: r.test,
    Status: r.status === 'success' ? '✅ Success' : '❌ Failed',
    'Has Data': r.status === 'success' ? (r.data ? 'Yes' : 'No') : 'N/A'
  })));
  
  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`\n%cSuccess Rate: ${((successCount / results.length) * 100).toFixed(1)}%`, 
    successCount === results.length ? 'color: green; font-size: 16px; font-weight: bold' : 'color: orange; font-size: 16px; font-weight: bold'
  );
  
  return results;
}

// Auto-execute if loaded in browser
if (typeof window !== 'undefined') {
  (window as any).testAPIInBrowser = testAPIInBrowser;
  console.log('%c✨ API Test Function Loaded!', 'color: green; font-weight: bold');
  console.log('Run: testAPIInBrowser() to start testing');
}