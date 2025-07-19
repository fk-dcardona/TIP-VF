#!/usr/bin/env node

/**
 * UX/UI Status Check - Real Data Verification
 * 
 * This script verifies that dashboards and charts are pulling real data 
 * from the actual engine, not showing mocked data.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class UXUIStatusChecker {
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
    console.log('🔍 Starting UX/UI Status Check...\n');
    
    try {
      // Check 1: Backend API Health
      await this.checkBackendAPI();
      
      // Check 2: Frontend Data Sources
      await this.checkFrontendDataSources();
      
      // Check 3: Real-time Data Verification
      await this.checkRealTimeData();
      
      // Check 4: Component Data Flow
      await this.checkComponentDataFlow();
      
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

  async checkFrontendDataSources() {
    console.log('🎨 Checking Frontend Data Sources...');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Enable request interception
      await page.setRequestInterception(true);
      const requests = [];
      
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        request.continue();
      });

      // Navigate to dashboard
      await page.goto(`${this.results.frontendUrl}/dashboard`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for components to load
      await page.waitForTimeout(3000);

      // Check for hardcoded values in KPI cards
      const kpiData = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="text-2xl"]');
        const values = [];
        cards.forEach(card => {
          const text = card.textContent?.trim();
          if (text && /^\d+/.test(text)) {
            values.push(text);
          }
        });
        return values;
      });

      // Check for API calls
      const apiCalls = requests.filter(req => 
        req.url.includes('/api/') || 
        req.url.includes('localhost:5000')
      );

      this.results.checks.frontendDataSources = {
        status: 'completed',
        kpiValues: kpiData,
        apiCalls: apiCalls.length,
        requests: requests.slice(0, 10), // First 10 requests
        hasRealData: kpiData.length > 0,
        hasAPICalls: apiCalls.length > 0
      };

      console.log(`   📊 KPI Values Found: ${kpiData.length}`);
      console.log(`   🔗 API Calls Made: ${apiCalls.length}`);
      console.log(`   📈 Sample Values: ${kpiData.slice(0, 3).join(', ')}\n`);

    } finally {
      await browser.close();
    }
  }

  async checkRealTimeData() {
    console.log('⏰ Checking Real-time Data...');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Navigate to dashboard
      await page.goto(`${this.results.frontendUrl}/dashboard`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Get initial data
      const initialData = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="text-2xl"], [class*="text-xl"]');
        return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
      });

      // Wait and refresh
      await page.waitForTimeout(2000);
      await page.reload({ waitUntil: 'networkidle2' });

      // Get data after refresh
      const refreshedData = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="text-2xl"], [class*="text-xl"]');
        return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
      });

      // Check for dynamic values
      const isDynamic = JSON.stringify(initialData) !== JSON.stringify(refreshedData);

      this.results.checks.realTimeData = {
        status: 'completed',
        initialData: initialData.slice(0, 5),
        refreshedData: refreshedData.slice(0, 5),
        isDynamic,
        hasLoadingStates: await this.checkLoadingStates(page),
        hasErrorStates: await this.checkErrorStates(page)
      };

      console.log(`   🔄 Data is Dynamic: ${isDynamic ? '✅ Yes' : '❌ No'}`);
      console.log(`   ⏳ Has Loading States: ${this.results.checks.realTimeData.hasLoadingStates ? '✅ Yes' : '❌ No'}`);
      console.log(`   ⚠️  Has Error States: ${this.results.checks.realTimeData.hasErrorStates ? '✅ Yes' : '❌ No'}\n`);

    } finally {
      await browser.close();
    }
  }

  async checkComponentDataFlow() {
    console.log('🔍 Checking Component Data Flow...');
    
    // Check specific components for hardcoded data
    const componentChecks = {
      mainDashboard: await this.checkComponentFile('src/components/MainDashboard.tsx'),
      organicDashboard: await this.checkComponentFile('src/components/DocumentIntelligence/OrganicDashboard.tsx'),
      apiClient: await this.checkComponentFile('src/lib/api-client.ts'),
      hooks: await this.checkComponentFile('src/hooks/useAPIFetch.ts')
    };

    this.results.checks.componentDataFlow = {
      status: 'completed',
      components: componentChecks,
      summary: this.summarizeComponentChecks(componentChecks)
    };

    console.log(`   🎯 MainDashboard: ${componentChecks.mainDashboard.status}`);
    console.log(`   🌱 OrganicDashboard: ${componentChecks.organicDashboard.status}`);
    console.log(`   🔗 API Client: ${componentChecks.apiClient.status}`);
    console.log(`   🎣 Hooks: ${componentChecks.hooks.status}\n`);
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
        responseTime: Date.now(), // Simplified
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

  async checkLoadingStates(page) {
    try {
      const loadingElements = await page.$$('[class*="animate-spin"], [class*="loading"], [class*="skeleton"]');
      return loadingElements.length > 0;
    } catch {
      return false;
    }
  }

  async checkErrorStates(page) {
    try {
      const errorElements = await page.$$('[class*="error"], [class*="alert"], [class*="danger"]');
      return errorElements.length > 0;
    } catch {
      return false;
    }
  }

  async checkComponentFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for hardcoded values
      const hardcodedPatterns = [
        /"[0-9]+"/g,  // Hardcoded numbers
        /'[0-9]+'/g,  // Hardcoded numbers
        /const.*=.*[0-9]+/g,  // Const assignments with numbers
        /let.*=.*[0-9]+/g,    // Let assignments with numbers
      ];
      
      const hasHardcoded = hardcodedPatterns.some(pattern => 
        pattern.test(content)
      );
      
      // Check for API calls
      const hasAPICalls = content.includes('fetch(') || 
                         content.includes('apiClient') || 
                         content.includes('useAPIFetch');
      
      return {
        status: hasAPICalls ? 'uses-api' : (hasHardcoded ? 'hardcoded' : 'unknown'),
        hasHardcoded,
        hasAPICalls,
        fileExists: true
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        fileExists: false
      };
    }
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
    
    return { total, usesAPI, hardcoded };
  }

  generateReport() {
    console.log('📋 Generating UX/UI Status Report...\n');
    
    // Calculate summary
    const allChecks = Object.values(this.results.checks);
    this.results.summary.totalChecks = allChecks.length;
    this.results.summary.passed = allChecks.filter(c => c.summary?.passed > 0).length;
    this.results.summary.failed = allChecks.filter(c => c.summary?.failed > 0).length;
    
    // Save report
    const reportPath = `test-results/ux-ui-status-report-${Date.now()}.json`;
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
    const frontend = this.results.checks.frontendDataSources;
    if (frontend) {
      console.log(`   🎨 API Calls Made: ${frontend.apiCalls}`);
      console.log(`   📈 KPI Values Found: ${frontend.kpiValues.length}`);
      
      if (frontend.kpiValues.length > 0) {
        console.log(`   ⚠️  Potential Hardcoded Values: ${frontend.kpiValues.slice(0, 3).join(', ')}`);
      }
    }
    
    // Real-time findings
    const realtime = this.results.checks.realTimeData;
    if (realtime) {
      console.log(`   🔄 Dynamic Data: ${realtime.isDynamic ? '✅ Yes' : '❌ No'}`);
      console.log(`   ⏳ Loading States: ${realtime.hasLoadingStates ? '✅ Present' : '❌ Missing'}`);
    }
    
    // Component findings
    const components = this.results.checks.componentDataFlow;
    if (components) {
      const apiComponents = components.summary.usesAPI;
      const hardcodedComponents = components.summary.hardcoded;
      console.log(`   🔗 Components Using API: ${apiComponents}`);
      console.log(`   📝 Components with Hardcoded Data: ${hardcodedComponents}`);
    }
    
    console.log('\n💡 Recommendations:');
    
    if (this.results.checks.frontendDataSources?.kpiValues.length > 0) {
      console.log('   • Replace hardcoded KPI values with real API data');
    }
    
    if (!this.results.checks.realTimeData?.isDynamic) {
      console.log('   • Implement real-time data updates');
    }
    
    if (!this.results.checks.realTimeData?.hasLoadingStates) {
      console.log('   • Add loading states for better UX');
    }
    
    console.log('\n✅ UX/UI Status Check Complete!\n');
  }
}

// Run the check
async function main() {
  const checker = new UXUIStatusChecker();
  await checker.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = UXUIStatusChecker; 