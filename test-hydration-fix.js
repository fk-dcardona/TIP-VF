const puppeteer = require('puppeteer');

async function testHydrationFix() {
  console.log('🧪 Testing Hydration Error Fix...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to the application
    console.log('📱 Loading application...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for hydration to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for hydration errors
    const hydrationErrors = errors.filter(error => 
      error.includes('hydration') || 
      error.includes('originalFactory.call') ||
      error.includes('react-server-dom')
    );
    
    if (hydrationErrors.length > 0) {
      console.log('❌ Hydration errors detected:');
      hydrationErrors.forEach(error => console.log(`   - ${error}`));
      return false;
    }
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log(`✅ Page loaded successfully: ${title}`);
    
    // Check for error boundaries
    const errorBoundary = await page.$('[data-testid="error-boundary"]');
    if (errorBoundary) {
      console.log('⚠️  Error boundary is visible');
    } else {
      console.log('✅ No error boundaries triggered');
    }
    
    // Check for loading states
    const loadingStates = await page.$$('.animate-pulse');
    if (loadingStates.length > 0) {
      console.log(`✅ Loading states working: ${loadingStates.length} skeleton elements`);
    }
    
    console.log('🎉 Hydration fix test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testHydrationFix().then(success => {
  process.exit(success ? 0 : 1);
}); 