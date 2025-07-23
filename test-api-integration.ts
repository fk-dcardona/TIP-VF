/**
 * API Integration Test Script
 * 
 * This script tests all the analytics API endpoints to ensure they're working correctly
 * with the real backend API.
 */

import { apiClient } from './src/lib/api-client';

const TEST_ORG_ID = 'org_test_123';

async function testAPIIntegration() {
  console.log('🚀 Starting API Integration Tests...\n');

  const results: { endpoint: string; status: 'success' | 'error'; data?: any; error?: any }[] = [];

  // Test 1: Health Check
  console.log('1. Testing Analytics Health Endpoint...');
  try {
    const health = await apiClient.getAnalyticsHealth();
    console.log('✅ Analytics Health:', health);
    results.push({ endpoint: '/analytics/health', status: 'success', data: health });
  } catch (error) {
    console.error('❌ Analytics Health Error:', error);
    results.push({ endpoint: '/analytics/health', status: 'error', error });
  }

  // Test 2: Triangle Analytics
  console.log('\n2. Testing Triangle Analytics...');
  try {
    const triangleData = await apiClient.getTriangleAnalytics(TEST_ORG_ID);
    console.log('✅ Triangle Analytics:', triangleData);
    results.push({ endpoint: `/analytics/triangle/${TEST_ORG_ID}`, status: 'success', data: triangleData });
  } catch (error) {
    console.error('❌ Triangle Analytics Error:', error);
    results.push({ endpoint: `/analytics/triangle/${TEST_ORG_ID}`, status: 'error', error });
  }

  // Test 3: Cross-Reference Analytics
  console.log('\n3. Testing Cross-Reference Analytics...');
  try {
    const crossRefData = await apiClient.getCrossReferenceAnalytics(TEST_ORG_ID);
    console.log('✅ Cross-Reference Analytics:', crossRefData);
    results.push({ endpoint: `/analytics/cross-reference/${TEST_ORG_ID}`, status: 'success', data: crossRefData });
  } catch (error) {
    console.error('❌ Cross-Reference Analytics Error:', error);
    results.push({ endpoint: `/analytics/cross-reference/${TEST_ORG_ID}`, status: 'error', error });
  }

  // Test 4: Supplier Performance
  console.log('\n4. Testing Supplier Performance Analytics...');
  try {
    const supplierData = await apiClient.getSupplierPerformanceAnalytics(TEST_ORG_ID);
    console.log('✅ Supplier Performance:', supplierData);
    results.push({ endpoint: `/analytics/supplier-performance/${TEST_ORG_ID}`, status: 'success', data: supplierData });
  } catch (error) {
    console.error('❌ Supplier Performance Error:', error);
    results.push({ endpoint: `/analytics/supplier-performance/${TEST_ORG_ID}`, status: 'error', error });
  }

  // Test 5: Market Intelligence
  console.log('\n5. Testing Market Intelligence Analytics...');
  try {
    const marketData = await apiClient.getMarketIntelligenceAnalytics(TEST_ORG_ID);
    console.log('✅ Market Intelligence:', marketData);
    results.push({ endpoint: `/analytics/market-intelligence/${TEST_ORG_ID}`, status: 'success', data: marketData });
  } catch (error) {
    console.error('❌ Market Intelligence Error:', error);
    results.push({ endpoint: `/analytics/market-intelligence/${TEST_ORG_ID}`, status: 'error', error });
  }

  // Test 6: Uploads Analytics
  console.log('\n6. Testing Uploads Analytics...');
  try {
    const uploadsData = await apiClient.getUploadsAnalytics(TEST_ORG_ID);
    console.log('✅ Uploads Analytics:', uploadsData);
    results.push({ endpoint: `/analytics/uploads/${TEST_ORG_ID}`, status: 'success', data: uploadsData });
  } catch (error) {
    console.error('❌ Uploads Analytics Error:', error);
    results.push({ endpoint: `/analytics/uploads/${TEST_ORG_ID}`, status: 'error', error });
  }

  // Test 7: Dashboard Analytics (Comprehensive)
  console.log('\n7. Testing Dashboard Analytics (Comprehensive)...');
  try {
    const dashboardData = await apiClient.getDashboardAnalytics(TEST_ORG_ID);
    console.log('✅ Dashboard Analytics:', dashboardData);
    results.push({ endpoint: `/analytics/dashboard/${TEST_ORG_ID}`, status: 'success', data: dashboardData });
  } catch (error) {
    console.error('❌ Dashboard Analytics Error:', error);
    results.push({ endpoint: `/analytics/dashboard/${TEST_ORG_ID}`, status: 'error', error });
  }

  // Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 API INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📈 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  
  console.log('\nDetailed Results:');
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.endpoint} - ${result.status}`);
    if (result.status === 'error') {
      console.log(`   Error: ${result.error?.message || 'Unknown error'}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('🎯 RECOMMENDATIONS:');
  console.log('='.repeat(60));
  
  if (errorCount === 0) {
    console.log('✨ All API endpoints are working correctly!');
    console.log('✨ The backend integration is ready for production.');
  } else {
    console.log('⚠️  Some endpoints are failing. Please check:');
    console.log('1. Is the backend server running?');
    console.log('2. Are the API endpoints correctly configured?');
    console.log('3. Check CORS configuration for cross-origin requests');
    console.log('4. Verify the organization ID exists in the database');
  }
}

// Run the tests
if (require.main === module) {
  testAPIIntegration()
    .then(() => {
      console.log('\n✅ API Integration tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testAPIIntegration };