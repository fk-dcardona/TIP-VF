# 🎯 Extract Analytics Engine: Step-by-Step Guide

## 📋 Mission Accomplished ✅

Your supply chain dashboard has been successfully transformed into a **modular, plug-and-play analytics engine** using SOLID principles. Here's exactly how to extract and adapt it to another project.

## 🗂️ Files to Copy (Complete List)

### **Core Analytics Engine**
```bash
# Copy these files to your new project
cp -r src/core/analytics/ your-new-project/src/analytics/
```

**Files included:**
- `src/core/analytics/types.ts` - Core interfaces and types
- `src/core/analytics/engine.ts` - Main analytics engine
- `src/core/analytics/index.ts` - Main export file
- `src/core/analytics/README.md` - Comprehensive documentation
- `src/core/analytics/example-usage.ts` - Integration examples

### **Supply Chain Implementation (Example)**
```bash
# Copy the example implementation
cp -r src/core/analytics/supply-chain/ your-new-project/src/analytics/supply-chain/
```

**Files included:**
- `src/core/analytics/supply-chain/types.ts` - Supply chain data types
- `src/core/analytics/supply-chain/processors.ts` - Data processors
- `src/core/analytics/supply-chain/calculators.ts` - KPI calculators
- `src/core/analytics/supply-chain/alerters.ts` - Alert generators
- `src/core/analytics/supply-chain/factory.ts` - Factory for creating modules

### **Documentation**
```bash
# Copy the guides
cp BUILDING_BLOCKS_GUIDE.md your-new-project/
cp BUILDING_BLOCKS_PACKAGE.md your-new-project/
```

## 📦 Dependencies to Install

```bash
# In your new project
npm install papaparse @types/papaparse
```

## 🚀 Quick Setup (5 Minutes)

### Step 1: Copy Files
```bash
# From your current project directory
mkdir -p your-new-project/src/analytics
cp -r src/core/analytics/* your-new-project/src/analytics/
cp BUILDING_BLOCKS_GUIDE.md your-new-project/
cp BUILDING_BLOCKS_PACKAGE.md your-new-project/
```

### Step 2: Install Dependencies
```bash
cd your-new-project
npm install papaparse @types/papaparse
```

### Step 3: Configure TypeScript Paths
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/analytics": ["./src/analytics"]
    }
  }
}
```

### Step 4: Basic Usage
```typescript
// In your new project
import { SupplyChainAnalyticsFactory } from '@/analytics';

// Create analytics engine
const analytics = SupplyChainAnalyticsFactory.createSupplyChainAnalytics();

// Process data
const processedData = await analytics.engine.processData('inventory', rawData);

// Calculate metrics
const metrics = await analytics.engine.calculateMetrics(processedData, configs);

// Generate alerts
const alerts = await analytics.engine.generateAlerts(processedData, alertConfigs);
```

## 🔄 Adaptation Examples

### **Example 1: E-commerce Analytics**
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
import { DataProcessor, ValidationResult } from '../types';

export class ProductDataProcessor implements DataProcessor<ProductRecord> {
  process(data: unknown[]): ProductRecord[] {
    return data.map((row: any) => ({
      productId: String(row.productId).trim(),
      name: String(row.name).trim(),
      category: String(row.category).trim(),
      price: this.parseNumber(row.price),
      stock: this.parseNumber(row.stock),
      sales: this.parseNumber(row.sales),
      date: this.parseDate(row.date)
    }));
  }

  validate(data: unknown[]): ValidationResult {
    const errors: string[] = [];
    
    data.forEach((row: any, index) => {
      if (!row.productId) errors.push(`Row ${index + 1}: Product ID required`);
      if (!row.name) errors.push(`Row ${index + 1}: Product name required`);
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

  transform(data: ProductRecord[]): unknown[] {
    return data;
  }

  private parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,()]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private parseDate(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  }
}

// src/analytics/ecommerce/calculators.ts
import { Calculator, ProcessedData, CalculationConfig, MetricResult } from '../types';
import { ProductRecord } from './types';

export class RevenueCalculator implements Calculator {
  id = 'revenue';
  name = 'Total Revenue';
  
  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const records = data.records as ProductRecord[];
    const totalRevenue = records.reduce((sum, r) => sum + (r.price * r.sales), 0);
    
    return {
      id: this.id,
      name: this.name,
      value: Math.round(totalRevenue * 100) / 100,
      unit: 'currency',
      timestamp: new Date().toISOString()
    };
  }
}

// src/analytics/ecommerce/factory.ts
import { CoreAnalyticsEngine, AnalyticsConfig } from '../engine';
import { ProductDataProcessor } from './processors';
import { RevenueCalculator } from './calculators';

export class EcommerceAnalyticsFactory {
  static createEcommerceAnalytics() {
    const config: AnalyticsConfig = {
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

    const engine = new CoreAnalyticsEngine(config);
    
    engine.registerProcessor('products', new ProductDataProcessor());
    engine.registerCalculator('revenue', new RevenueCalculator());
    
    return { engine, config };
  }
}
```

### **Example 2: Financial Analytics**
```typescript
// src/analytics/financial/calculators.ts
import { Calculator, ProcessedData, CalculationConfig, MetricResult } from '../types';

export class ProfitMarginCalculator implements Calculator {
  id = 'profit-margin';
  name = 'Profit Margin';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const records = data.records as any[];
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

### **Example 3: Marketing Analytics**
```typescript
// src/analytics/marketing/alerters.ts
import { Alerter, ProcessedData, AlertConfig, Alert } from '../types';

export class ConversionRateAlerter implements Alerter {
  id = 'conversion-rate';
  name = 'Conversion Rate Alert';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const records = data.records as any[];
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

## 🎨 Integration Patterns

### **Pattern 1: React Hook**
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

### **Pattern 2: Service Layer**
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

  async calculateKPIs(processedData: any) {
    return await this.analytics.engine.calculateMetrics(processedData, [
      { id: 'revenue', name: 'Revenue', type: 'metric', formula: '', inputs: [], outputs: [] }
    ]);
  }
}
```

## 📊 Data Format Templates

### **E-commerce Product Data**
```csv
product_id,product_name,category,price,stock,sales,date
PROD001,Product A,Electronics,25.50,150,5,2024-01-15
PROD002,Product B,Clothing,15.00,75,3,2024-01-15
```

### **Financial Data**
```csv
transaction_id,revenue,cost,profit,date
TXN001,1000.00,600.00,400.00,2024-01-15
TXN002,500.00,300.00,200.00,2024-01-15
```

### **Marketing Data**
```csv
campaign_id,campaign_name,conversion_rate,clicks,impressions,date
CAMP001,Summer Sale,3.2,1000,50000,2024-01-15
CAMP002,Winter Clearance,1.8,500,30000,2024-01-15
```

## 🎯 Migration Checklist

### **Phase 1: Setup** ✅
- [ ] Copy analytics core files
- [ ] Install dependencies
- [ ] Configure TypeScript paths
- [ ] Test basic imports

### **Phase 2: Customization** 🔄
- [ ] Define domain-specific types
- [ ] Create custom processors
- [ ] Implement domain calculators
- [ ] Configure alert conditions

### **Phase 3: Integration** 📋
- [ ] Create React hooks
- [ ] Build service layer
- [ ] Implement UI components
- [ ] Add error handling

### **Phase 4: Testing** 🧪
- [ ] Unit tests for components
- [ ] Integration tests
- [ ] Performance testing
- [ ] Security validation

### **Phase 5: Deployment** 🚀
- [ ] Production configuration
- [ ] Monitoring setup
- [ ] Documentation
- [ ] User training

## 📚 Key Files Summary

| File | Purpose | Copy to New Project |
|------|---------|-------------------|
| `src/core/analytics/types.ts` | Core interfaces | ✅ Required |
| `src/core/analytics/engine.ts` | Main engine | ✅ Required |
| `src/core/analytics/index.ts` | Exports | ✅ Required |
| `src/core/analytics/README.md` | Documentation | ✅ Recommended |
| `src/core/analytics/example-usage.ts` | Examples | ✅ Recommended |
| `src/core/analytics/supply-chain/` | Example implementation | ✅ Optional |
| `BUILDING_BLOCKS_GUIDE.md` | Adaptation guide | ✅ Recommended |
| `BUILDING_BLOCKS_PACKAGE.md` | Package overview | ✅ Recommended |

## 🚀 Ready to Transform Your Application?

You now have everything needed to add powerful analytics capabilities to any application:

1. **Copy the core files** - Modular analytics engine
2. **Install dependencies** - Minimal requirements
3. **Create domain-specific implementations** - Custom processors, calculators, alerters
4. **Integrate with your UI** - React hooks, service layers, components
5. **Scale as needed** - Performance optimization, security, monitoring

The modular design ensures easy adaptation, while SOLID principles guarantee maintainable, extensible code.

**Start with the basics, grow with your needs, and scale with confidence!**

---

*Your analytics engine is ready to power any application with data-driven insights.* 🎯 