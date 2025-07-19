#!/usr/bin/env node

/**
 * Simple UX/UI Status Check - Real Data Verification
 * 
 * This script verifies that dashboards and charts are pulling real data 
 * from the actual engine, not showing mocked data.
 */

const fs = require('fs');
const path = require('path');

class SimpleUXUIStatusChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      frontendUrl: 'http://localhost:3001',
      backendUrl: 'http://localhost:5000',
      checks: {},
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async run() {
    console.log('🔍 Starting Simple UX/UI Status Check...\n');
    
    try {
      // Check 1: Backend API Health
      await this.checkBackendAPI();
      
      // Check 2: Frontend Component Analysis
      await this.checkFrontendComponents();
      
      // Check 3: Data Flow Analysis
      await this.checkDataFlow();
      
      // Generate Report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Status check failed:', error);
      this.results.error = error.message;
    }
  }

  async checkBackendAPI() {
    console.log('📡 Checking Backend API...');
    
    const checks = {
      health: await this.testEndpoint('/api/health'),
      docs: await this.testEndpoint('/api/docs'),
      documentsAnalytics: await this.testEndpoint('/api/documents/analytics/org_2zvTUkeLsZvSJEK084YTlOFhBvD'),
      dashboard: await this.testEndpoint('/api/dashboard/org_2zvTUkeLsZvSJEK084YTlOFhBvD'),
      uploads: await this.testEndpoint('/api/uploads/org_2zvTUkeLsZvSJEK084YTlOFhBvD')
    };

    this.results.checks.backendAPI = {
      status: 'completed',
      checks,
      summary: this.summarizeChecks(checks)
    };

    console.log(`   ✅ Health: ${checks.health.status}`);
    console.log(`   📚 Docs: ${checks.docs.status}`);
    console.log(`   📊 Documents Analytics: ${checks.documentsAnalytics.status}`);
    console.log(`   🎯 Dashboard: ${checks.dashboard.status}`);
    console.log(`   📁 Uploads: ${checks.uploads.status}\n`);
  }

  async checkFrontendComponents() {
    console.log('🎨 Checking Frontend Components...');
    
    const componentChecks = {
      mainDashboard: await this.analyzeComponent('src/components/MainDashboard.tsx'),
      organicDashboard: await this.analyzeComponent('src/components/DocumentIntelligence/OrganicDashboard.tsx'),
      apiClient: await this.analyzeComponent('src/lib/api-client.ts'),
      hooks: await this.analyzeComponent('src/hooks/useAPIFetch.ts'),
      dashboardPage: await this.analyzeComponent('src/app/dashboard/page.tsx')
    };

    this.results.checks.frontendComponents = {
      status: 'completed',
      components: componentChecks,
      summary: this.summarizeComponentChecks(componentChecks)
    };

    console.log(`   🎯 MainDashboard: ${componentChecks.mainDashboard.status}`);
    console.log(`   🌱 OrganicDashboard: ${componentChecks.organicDashboard.status}`);
    console.log(`   🔗 API Client: ${componentChecks.apiClient.status}`);
    console.log(`   🎣 Hooks: ${componentChecks.hooks.status}`);
    console.log(`   📄 Dashboard Page: ${componentChecks.dashboardPage.status}\n`);
  }

  async checkDataFlow() {
    console.log('🔍 Checking Data Flow...');
    
    const dataFlowChecks = {
      hasRealAPIEndpoints: await this.checkRealAPIEndpoints(),
      hasHardcodedValues: await this.checkHardcodedValues(),
      hasLoadingStates: await this.checkLoadingStates(),
      hasErrorHandling: await this.checkErrorHandling(),
      hasRealTimeUpdates: await this.checkRealTimeUpdates()
    };

    this.results.checks.dataFlow = {
      status: 'completed',
      checks: dataFlowChecks,
      summary: this.summarizeDataFlowChecks(dataFlowChecks)
    };

    console.log(`   🔗 Real API Endpoints: ${dataFlowChecks.hasRealAPIEndpoints ? '✅ Yes' : '❌ No'}`);
    console.log(`   📝 Hardcoded Values: ${dataFlowChecks.hasHardcodedValues ? '⚠️  Found' : '✅ None'}`);
    console.log(`   ⏳ Loading States: ${dataFlowChecks.hasLoadingStates ? '✅ Present' : '❌ Missing'}`);
    console.log(`   ⚠️  Error Handling: ${dataFlowChecks.hasErrorHandling ? '✅ Present' : '❌ Missing'}`);
    console.log(`   🔄 Real-time Updates: ${dataFlowChecks.hasRealTimeUpdates ? '✅ Present' : '❌ Missing'}\n`);
  }

  async testEndpoint(endpoint) {
    try {
      const response = await fetch(`${this.results.backendUrl}${endpoint}`);
      const data = await response.json();
      
      return {
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        hasData: !!data && Object.keys(data).length > 0,
        isRealData: this.isRealData(data),
        data: data
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        isRealData: false
      };
    }
  }

  isRealData(data) {
    if (!data) return false;
    
    // Check for real data indicators
    const hasTimestamp = data.timestamp || data.created_at || data.updated_at;
    const hasDynamicValues = data.id || data.uuid || data.guid;
    const hasRealMetrics = data.metrics || data.analytics || data.performance;
    
    return hasTimestamp || hasDynamicValues || hasRealMetrics;
  }

  async analyzeComponent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for hardcoded values
      const hardcodedPatterns = [
        /"[0-9]+"/g,  // Hardcoded numbers in quotes
        /'[0-9]+'/g,  // Hardcoded numbers in single quotes
        /const.*=.*[0-9]+/g,  // Const assignments with numbers
        /let.*=.*[0-9]+/g,    // Let assignments with numbers
        /text-2xl.*>.*[0-9]+/g,  // Large text with numbers
      ];
      
      const hardcodedMatches = [];
      hardcodedPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          hardcodedMatches.push(...matches.slice(0, 3)); // Limit to first 3 matches
        }
      });
      
      // Check for API calls
      const hasAPICalls = content.includes('fetch(') || 
                         content.includes('apiClient') || 
                         content.includes('useAPIFetch') ||
                         content.includes('useDocumentAnalytics');
      
      // Check for loading states
      const hasLoadingStates = content.includes('loading') || 
                              content.includes('Loading') ||
                              content.includes('skeleton') ||
                              content.includes('Skeleton');
      
      // Check for error handling
      const hasErrorHandling = content.includes('error') || 
                              content.includes('Error') ||
                              content.includes('catch') ||
                              content.includes('Alert');
      
      return {
        status: hasAPICalls ? 'uses-api' : (hardcodedMatches.length > 0 ? 'hardcoded' : 'unknown'),
        hasHardcoded: hardcodedMatches.length > 0,
        hardcodedValues: hardcodedMatches,
        hasAPICalls,
        hasLoadingStates,
        hasErrorHandling,
        fileExists: true,
        fileSize: content.length
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        fileExists: false
      };
    }
  }

  async checkRealAPIEndpoints() {
    const apiFiles = [
      'src/lib/api-client.ts',
      'src/hooks/useAPIFetch.ts'
    ];
    
    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('localhost:5000') || content.includes('/api/')) {
          return true;
        }
      } catch (error) {
        // File doesn't exist
      }
    }
    return false;
  }

  async checkHardcodedValues() {
    const componentFiles = [
      'src/components/MainDashboard.tsx',
      'src/components/DocumentIntelligence/OrganicDashboard.tsx'
    ];
    
    for (const file of componentFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const hardcodedPattern = /"[0-9]+"/g;
        if (hardcodedPattern.test(content)) {
          return true;
        }
      } catch (error) {
        // File doesn't exist
      }
    }
    return false;
  }

  async checkLoadingStates() {
    const componentFiles = [
      'src/components/MainDashboard.tsx',
      'src/components/DocumentIntelligence/OrganicDashboard.tsx',
      'src/components/ui/skeleton.tsx'
    ];
    
    for (const file of componentFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('loading') || content.includes('Loading') || content.includes('skeleton')) {
          return true;
        }
      } catch (error) {
        // File doesn't exist
      }
    }
    return false;
  }

  async checkErrorHandling() {
    const componentFiles = [
      'src/components/MainDashboard.tsx',
      'src/components/DocumentIntelligence/OrganicDashboard.tsx',
      'src/hooks/useAPIFetch.ts'
    ];
    
    for (const file of componentFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('error') || content.includes('Error') || content.includes('catch')) {
          return true;
        }
      } catch (error) {
        // File doesn't exist
      }
    }
    return false;
  }

  async checkRealTimeUpdates() {
    const componentFiles = [
      'src/components/MainDashboard.tsx',
      'src/components/DocumentIntelligence/OrganicDashboard.tsx',
      'src/hooks/useAPIFetch.ts'
    ];
    
    for (const file of componentFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('useEffect') || content.includes('setInterval') || content.includes('refetch')) {
          return true;
        }
      } catch (error) {
        // File doesn't exist
      }
    }
    return false;
  }

  summarizeChecks(checks) {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(c => c.status === 'success').length;
    const failed = Object.values(checks).filter(c => c.status === 'error').length;
    
    return { total, passed, failed };
  }

  summarizeComponentChecks(checks) {
    const total = Object.keys(checks).length;
    const usesAPI = Object.values(checks).filter(c => c.status === 'uses-api').length;
    const hardcoded = Object.values(checks).filter(c => c.status === 'hardcoded').length;
    const hasLoadingStates = Object.values(checks).filter(c => c.hasLoadingStates).length;
    const hasErrorHandling = Object.values(checks).filter(c => c.hasErrorHandling).length;
    
    return { total, usesAPI, hardcoded, hasLoadingStates, hasErrorHandling };
  }

  summarizeDataFlowChecks(checks) {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(c => c === true).length;
    const failed = Object.values(checks).filter(c => c === false).length;
    
    return { total, passed, failed };
  }

  generateReport() {
    console.log('📋 Generating UX/UI Status Report...\n');
    
    // Calculate summary
    const allChecks = Object.values(this.results.checks);
    this.results.summary.totalChecks = allChecks.length;
    this.results.summary.passed = allChecks.filter(c => c.summary?.passed > 0).length;
    this.results.summary.failed = allChecks.filter(c => c.summary?.failed > 0).length;
    
    // Save report
    const reportPath = `test-results/simple-ux-ui-status-report-${Date.now()}.json`;
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Print summary
    console.log('🎯 UX/UI Status Check Summary:');
    console.log(`   📊 Total Checks: ${this.results.summary.totalChecks}`);
    console.log(`   ✅ Passed: ${this.results.summary.passed}`);
    console.log(`   ❌ Failed: ${this.results.summary.failed}`);
    console.log(`   📄 Report saved to: ${reportPath}\n`);
    
    // Print key findings
    this.printKeyFindings();
  }

  printKeyFindings() {
    console.log('🔍 Key Findings:');
    
    // Backend API findings
    const backend = this.results.checks.backendAPI;
    if (backend) {
      const healthStatus = backend.checks.health.status;
      console.log(`   📡 Backend Health: ${healthStatus === 'success' ? '✅ Healthy' : '❌ Unhealthy'}`);
      
      const docsStatus = backend.checks.documentsAnalytics.status;
      console.log(`   📊 Document Analytics: ${docsStatus === 'success' ? '✅ Available' : '❌ Missing'}`);
    }
    
    // Frontend findings
    const frontend = this.results.checks.frontendComponents;
    if (frontend) {
      const apiComponents = frontend.summary.usesAPI;
      const hardcodedComponents = frontend.summary.hardcoded;
      const loadingStates = frontend.summary.hasLoadingStates;
      const errorHandling = frontend.summary.hasErrorHandling;
      
      console.log(`   🔗 Components Using API: ${apiComponents}/${frontend.summary.total}`);
      console.log(`   📝 Components with Hardcoded Data: ${hardcodedComponents}/${frontend.summary.total}`);
      console.log(`   ⏳ Components with Loading States: ${loadingStates}/${frontend.summary.total}`);
      console.log(`   ⚠️  Components with Error Handling: ${errorHandling}/${frontend.summary.total}`);
    }
    
    // Data flow findings
    const dataFlow = this.results.checks.dataFlow;
    if (dataFlow) {
      console.log(`   🔗 Real API Endpoints: ${dataFlow.checks.hasRealAPIEndpoints ? '✅ Yes' : '❌ No'}`);
      console.log(`   📝 Hardcoded Values Found: ${dataFlow.checks.hasHardcodedValues ? '⚠️  Yes' : '✅ No'}`);
      console.log(`   ⏳ Loading States: ${dataFlow.checks.hasLoadingStates ? '✅ Present' : '❌ Missing'}`);
      console.log(`   ⚠️  Error Handling: ${dataFlow.checks.hasErrorHandling ? '✅ Present' : '❌ Missing'}`);
      console.log(`   🔄 Real-time Updates: ${dataFlow.checks.hasRealTimeUpdates ? '✅ Present' : '❌ Missing'}`);
    }
    
    console.log('\n💡 Recommendations:');
    
    if (dataFlow?.checks.hasHardcodedValues) {
      console.log('   • Replace hardcoded values with real API data');
    }
    
    if (!dataFlow?.checks.hasRealTimeUpdates) {
      console.log('   • Implement real-time data updates');
    }
    
    if (!dataFlow?.checks.hasLoadingStates) {
      console.log('   • Add loading states for better UX');
    }
    
    if (!dataFlow?.checks.hasErrorHandling) {
      console.log('   • Improve error handling and user feedback');
    }
    
    console.log('\n✅ Simple UX/UI Status Check Complete!\n');
  }
}

// Run the check
async function main() {
  const checker = new SimpleUXUIStatusChecker();
  await checker.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleUXUIStatusChecker; 