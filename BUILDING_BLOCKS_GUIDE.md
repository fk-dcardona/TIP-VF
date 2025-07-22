# Building Blocks Guide: Modular Analytics Engine

## 🎯 Mission Accomplished

We have successfully transformed the supply chain dashboard into a **plug-and-play modular analytics engine** using SOLID principles. This guide shows you how to extract and adapt these building blocks to any project.

## 🏗️ Core Building Blocks

### 1. **Core Analytics Engine** (`src/core/analytics/`)
```
📁 core/analytics/
├── 📄 types.ts              # Core interfaces and types
├── 📄 engine.ts             # Main analytics engine
├── 📄 index.ts              # Main export file
├── 📁 supply-chain/         # Domain-specific implementations
│   ├── 📄 types.ts          # Supply chain data types
│   ├── 📄 processors.ts     # Data processors
│   ├── 📄 calculators.ts    # KPI calculators
│   ├── 📄 alerters.ts       # Alert generators
│   └── 📄 factory.ts        # Factory for creating modules
└── 📄 README.md             # Comprehensive documentation
```

### 2. **Key Components**

#### **Core Engine** (`engine.ts`)
- **Purpose**: Orchestrates all analytics operations
- **SOLID Implementation**: 
  - Single Responsibility: Each method has one clear purpose
  - Open/Closed: Extensible through registration
  - Liskov Substitution: All implementations follow interfaces
  - Interface Segregation: Clean, focused interfaces
  - Dependency Inversion: Depends on abstractions

#### **Data Processors** (`processors.ts`)
- **Purpose**: Transform and validate raw data
- **Examples**: `InventoryDataProcessor`, `SalesDataProcessor`
- **Extensible**: Add new processors for different data types

#### **Calculators** (`calculators.ts`)
- **Purpose**: Calculate KPIs and metrics
- **Examples**: `SupplyChainHealthCalculator`, `TotalRevenueCalculator`
- **Extensible**: Add domain-specific calculations

#### **Alerters** (`alerters.ts`)
- **Purpose**: Generate alerts based on conditions
- **Examples**: `OutOfStockAlerter`, `LowStockAlerter`
- **Extensible**: Add custom alert conditions

#### **Factory** (`factory.ts`)
- **Purpose**: Create configured analytics modules
- **Methods**: 
  - `createSupplyChainAnalytics()` - Full module
  - `createMinimalSupplyChainAnalytics()` - Basic module
  - `createCustomSupplyChainAnalytics()` - Custom module

## 🔄 How to Adapt to Other Projects

### Step 1: Copy Core Files
```bash
# Copy the entire analytics core to your project
cp -r src/core/analytics/ your-project/src/analytics/
```

### Step 2: Install Dependencies
```bash
npm install papaparse # For CSV processing
```

### Step 3: Create Domain-Specific Implementations

#### Example: E-commerce Analytics
```typescript
// src/analytics/ecommerce/types.ts
export interface ProductRecord {
  productId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  date: string;
}

// src/analytics/ecommerce/processors.ts
export class ProductDataProcessor implements DataProcessor<ProductRecord> {
  process(data: unknown[]): ProductRecord[] {
    // Transform e-commerce data
  }
  
  validate(data: unknown[]): ValidationResult {
    // Validate e-commerce data
  }
}

// src/analytics/ecommerce/calculators.ts
export class RevenueCalculator implements Calculator {
  id = 'revenue';
  name = 'Total Revenue';
  
  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    // Calculate e-commerce revenue
  }
}

// src/analytics/ecommerce/factory.ts
export class EcommerceAnalyticsFactory {
  static createEcommerceAnalytics() {
    const engine = new CoreAnalyticsEngine(config);
    
    engine.registerProcessor('products', new ProductDataProcessor());
    engine.registerCalculator('revenue', new RevenueCalculator());
    engine.registerAlerter('low-stock', new LowStockAlerter());
    
    return { engine, config };
  }
}
```

### Step 4: Configure for Your Data
```typescript
const customConfig: AnalyticsConfig = {
  dataSources: [
    {
      id: 'products',
      name: 'Product Data',
      type: 'csv',
      schema: {
        productId: 'string',
        name: 'string',
        category: 'string',
        price: 'number',
        stock: 'number',
        sales: 'number',
        date: 'date'
      }
    }
  ],
  calculations: [
    {
      id: 'revenue',
      name: 'Total Revenue',
      type: 'metric',
      formula: 'sum(price * sales)',
      inputs: ['price', 'sales'],
      outputs: ['revenue']
    }
  ],
  alerts: [
    {
      id: 'low-stock',
      name: 'Low Stock Alert',
      type: 'threshold',
      condition: 'stock < 10',
      severity: 'high',
      message: 'Product is running low on stock'
    }
  ],
  timeRanges: [
    { id: '7d', label: '7 days', days: 7 },
    { id: '30d', label: '30 days', days: 30, default: true }
  ]
};
```

## 🎨 Integration Patterns

### Pattern 1: React Hook Integration
```typescript
// hooks/useAnalytics.ts
import { useState, useCallback } from 'react';
import { EcommerceAnalyticsFactory } from '@/analytics/ecommerce/factory';

export function useAnalytics() {
  const [analytics] = useState(() => EcommerceAnalyticsFactory.createEcommerceAnalytics());
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const processData = useCallback(async (file: File) => {
    const rawData = await parseCSV(file);
    const processedData = await analytics.engine.processData('products', rawData);
    const calculatedMetrics = await analytics.engine.calculateMetrics(processedData, configs);
    const generatedAlerts = await analytics.engine.generateAlerts(processedData, alertConfigs);
    
    setData(processedData);
    setMetrics(calculatedMetrics);
    setAlerts(generatedAlerts);
  }, [analytics]);

  return { data, metrics, alerts, processData };
}
```

### Pattern 2: Service Layer Integration
```typescript
// services/analyticsService.ts
import { EcommerceAnalyticsFactory } from '@/analytics/ecommerce/factory';

export class AnalyticsService {
  private analytics = EcommerceAnalyticsFactory.createEcommerceAnalytics();

  async processUpload(file: File) {
    const data = await this.parseFile(file);
    const validation = this.analytics.engine.validateData('products', data);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await this.analytics.engine.processData('products', data);
  }

  async calculateKPIs(processedData: ProcessedData) {
    return await this.analytics.engine.calculateMetrics(processedData, [
      { id: 'revenue', name: 'Revenue', type: 'metric', formula: '', inputs: [], outputs: [] },
      { id: 'profit', name: 'Profit', type: 'metric', formula: '', inputs: [], outputs: [] }
    ]);
  }

  async generateAlerts(processedData: ProcessedData) {
    return await this.analytics.engine.generateAlerts(processedData, [
      { id: 'low-stock', name: 'Low Stock', type: 'threshold', condition: '', severity: 'high', message: '' }
    ]);
  }
}
```

### Pattern 3: Dashboard Component Integration
```typescript
// components/AnalyticsDashboard.tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsDashboard() {
  const { data, metrics, alerts, processData, loading } = useAnalytics();

  const handleFileUpload = async (file: File) => {
    await processData(file);
  };

  return (
    <div>
      <FileUpload onUpload={handleFileUpload} />
      
      {loading && <LoadingSpinner />}
      
      {metrics.length > 0 && (
        <MetricsGrid metrics={metrics} />
      )}
      
      {alerts.length > 0 && (
        <AlertsPanel alerts={alerts} />
      )}
    </div>
  );
}
```

## 🔧 Customization Examples

### Example 1: Financial Analytics
```typescript
// calculators.ts
export class ProfitMarginCalculator implements Calculator {
  id = 'profit-margin';
  name = 'Profit Margin';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const records = data.records as FinancialRecord[];
    const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    return {
      id: this.id,
      name: this.name,
      value: Math.round(profitMargin * 100) / 100,
      unit: 'percentage',
      timestamp: new Date().toISOString()
    };
  }
}
```

### Example 2: Marketing Analytics
```typescript
// alerters.ts
export class ConversionRateAlerter implements Alerter {
  id = 'conversion-rate';
  name = 'Conversion Rate Alert';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const records = data.records as MarketingRecord[];
    const threshold = config.value as number || 2.5; // Default 2.5%
    
    return records
      .filter(record => record.conversionRate < threshold)
      .map(record => ({
        id: `${record.campaignId}-conversion`,
        type: 'LOW_CONVERSION',
        severity: 'medium',
        title: 'Low Conversion Rate',
        message: `Campaign ${record.campaignName} has low conversion rate (${record.conversionRate}%)`,
        timestamp: new Date().toISOString(),
        isAcknowledged: false
      }));
  }
}
```

### Example 3: Healthcare Analytics
```typescript
// processors.ts
export class PatientDataProcessor implements DataProcessor<PatientRecord> {
  process(data: unknown[]): PatientRecord[] {
    return data.map((row: any) => ({
      patientId: String(row.patientId).trim(),
      diagnosis: String(row.diagnosis).trim(),
      treatmentCost: this.parseNumber(row.treatmentCost),
      admissionDate: this.parseDate(row.admissionDate),
      dischargeDate: this.parseDate(row.dischargeDate),
      lengthOfStay: this.calculateLengthOfStay(row.admissionDate, row.dischargeDate)
    }));
  }

  validate(data: unknown[]): ValidationResult {
    // Healthcare-specific validation
    const errors: string[] = [];
    
    data.forEach((row: any, index) => {
      if (!row.patientId) {
        errors.push(`Row ${index + 1}: Patient ID is required`);
      }
      if (!row.diagnosis) {
        errors.push(`Row ${index + 1}: Diagnosis is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      rowCount: data.length,
      columnCount: Object.keys(data[0] || {}).length,
      preview: data.slice(0, 5)
    };
  }
}
```

## 📊 Data Format Templates

### Template 1: Sales Data
```csv
product_id,product_name,category,quantity_sold,unit_price,total_revenue,sale_date
PROD001,Product A,Electronics,5,25.50,127.50,2024-01-15
PROD002,Product B,Clothing,3,15.00,45.00,2024-01-15
```

### Template 2: Inventory Data
```csv
product_id,product_name,category,current_stock,unit_cost,reorder_level,max_stock,last_updated
PROD001,Product A,Electronics,150,20.00,50,200,2024-01-31
PROD002,Product B,Clothing,75,12.00,25,100,2024-01-31
```

### Template 3: Customer Data
```csv
customer_id,customer_name,segment,total_purchases,last_purchase_date,avg_order_value
CUST001,John Doe,Premium,1500.00,2024-01-15,75.00
CUST002,Jane Smith,Standard,800.00,2024-01-10,40.00
```

## 🚀 Performance Optimization

### 1. Caching Strategy
```typescript
// Implement caching for expensive operations
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedResult = (key: string, ttl: number = 300000) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
};

const setCachedResult = (key: string, data: any, ttl: number = 300000) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};
```

### 2. Batch Processing
```typescript
// Process large datasets in chunks
const processBatch = async (data: any[], batchSize: number = 1000) => {
  const results = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const processed = await processData(batch);
    results.push(...processed);
    
    // Yield control to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
};
```

### 3. Memory Management
```typescript
// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}, 60000); // Check every minute
```

## 🔒 Security Considerations

### 1. Input Validation
```typescript
// Sanitize all inputs
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
};
```

### 2. Data Encryption
```typescript
// Encrypt sensitive data
const encryptData = (data: string): string => {
  // Use your preferred encryption library
  return btoa(data); // Simple base64 for demo
};
```

### 3. Access Control
```typescript
// Implement role-based access
const checkPermission = (user: User, operation: string): boolean => {
  return user.permissions.includes(operation);
};
```

## 📈 Scaling Strategies

### 1. Horizontal Scaling
```typescript
// Distribute processing across multiple workers
const distributeWork = async (data: any[], workerCount: number) => {
  const chunkSize = Math.ceil(data.length / workerCount);
  const chunks = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  const promises = chunks.map(chunk => processChunk(chunk));
  return await Promise.all(promises);
};
```

### 2. Database Integration
```typescript
// Store processed results in database
const storeResults = async (results: any[]) => {
  const batchSize = 1000;
  
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    await database.insertMany('analytics_results', batch);
  }
};
```

### 3. Real-time Updates
```typescript
// WebSocket integration for real-time updates
const setupRealTimeUpdates = (socket: WebSocket) => {
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateDashboard(data);
  };
};
```

## 🎯 Next Steps

1. **Choose Your Domain**: Identify the specific analytics needs for your project
2. **Copy Core Files**: Extract the analytics engine to your project
3. **Customize Types**: Define your domain-specific data types
4. **Implement Processors**: Create data processors for your data format
5. **Add Calculators**: Implement domain-specific KPIs and metrics
6. **Configure Alerters**: Set up relevant alert conditions
7. **Integrate with UI**: Connect to your dashboard components
8. **Test and Optimize**: Ensure performance meets your requirements

## 📚 Resources

- **Documentation**: `src/core/analytics/README.md`
- **Examples**: `src/core/analytics/example-usage.ts`
- **Types**: `src/core/analytics/types.ts`
- **Supply Chain Implementation**: `src/core/analytics/supply-chain/`

## 🤝 Support

The modular design makes it easy to:
- **Start Simple**: Begin with basic functionality
- **Grow Complex**: Add features as needed
- **Maintain**: Clear separation of concerns
- **Extend**: Add new capabilities without breaking existing code
- **Test**: Isolated components are easier to test
- **Deploy**: Modular components can be deployed independently

---

**Remember**: The power of this system lies in its modularity. Each component can be developed, tested, and deployed independently while working together seamlessly through well-defined interfaces. 