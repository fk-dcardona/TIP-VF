# Modular Analytics Engine

A complete, plug-and-play analytics solution built with SOLID principles for maximum reusability and extensibility.

## 🎯 Vision

Transform any application into a data-driven powerhouse with our modular analytics engine. Process CSV files, analyze data, generate insights, and create alerts with minimal setup.

## 🏗️ Architecture

### SOLID Principles Implementation

- **Single Responsibility**: Each component has one clear purpose
- **Open/Closed**: Extensible through registration of new processors, calculators, alerters
- **Liskov Substitution**: All implementations follow the same interfaces
- **Interface Segregation**: Clean, focused interfaces
- **Dependency Inversion**: Depends on abstractions, not concrete implementations

### Core Components

```
src/core/analytics/
├── types.ts              # Core interfaces and types
├── engine.ts             # Main analytics engine
├── supply-chain/         # Supply chain specific implementations
│   ├── types.ts          # Supply chain data types
│   ├── processors.ts     # Data processors for inventory/sales
│   ├── calculators.ts    # KPI and metric calculators
│   ├── alerters.ts       # Alert generators
│   └── factory.ts        # Factory for creating modules
└── index.ts              # Main export file
```

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import { SupplyChainAnalyticsFactory } from '@/core/analytics';

// Create a complete analytics module
const analytics = SupplyChainAnalyticsFactory.createSupplyChainAnalytics();

// Process inventory data
const inventoryData = await analytics.engine.processData('inventory', rawInventoryData);

// Calculate metrics
const metrics = await analytics.engine.calculateMetrics(inventoryData, [
  { id: 'supply-chain-health', name: 'Health Score', type: 'kpi', formula: '', inputs: [], outputs: [] }
]);

// Generate alerts
const alerts = await analytics.engine.generateAlerts(inventoryData, [
  { id: 'out-of-stock', name: 'Out of Stock', type: 'threshold', condition: '', severity: 'critical', message: '' }
]);
```

### 2. Minimal Setup

```typescript
// For basic functionality only
const minimalAnalytics = SupplyChainAnalyticsFactory.createMinimalSupplyChainAnalytics();
```

### 3. Custom Configuration

```typescript
// Customize with specific components
const customAnalytics = SupplyChainAnalyticsFactory.createCustomSupplyChainAnalytics({
  processors: ['inventory', 'sales'],
  calculators: ['supply-chain-health', 'total-revenue'],
  alerters: ['out-of-stock', 'low-stock'],
  config: {
    safetyStockMultiplier: 0.3,
    alertThresholds: {
      lowStockDays: 5,
      overstockDays: 60
    }
  }
});
```

## 📊 Data Processing

### Supported Data Formats

#### Inventory CSV
```csv
k_sc_codigo_articulo,sc_detalle_articulo,sc_detalle_grupo,n_saldo_actual,n_costo_promedio,period
PROD001,Product Name,Electronics,150,25.50,2024-01-31
PROD002,Another Product,Clothing,75,15.00,2024-01-31
```

#### Sales CSV
```csv
k_sc_codigo_articulo,d_fecha_documento,n_cantidad,v_neta
PROD001,1/15/2024,5,127.50
PROD002,1/15/2024,3,45.00
```

### Data Validation

```typescript
// Validate data before processing
const validation = analytics.engine.validateData('inventory', rawData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  return;
}
```

## 🧮 Available Calculators

### Core Metrics
- **Supply Chain Health Score**: Overall health based on stock levels and margins
- **Total Revenue**: Sum of all product revenues
- **Critical Alerts**: Count of out-of-stock and low-stock items
- **Average Gross Margin**: Average margin across all products

### Advanced Metrics
- **Inventory Turnover Rate**: How quickly inventory moves
- **Days in Inventory**: Average days products stay in stock
- **Inventory Carrying Cost**: Total cost of holding inventory
- **Stock Status Distribution**: Breakdown by stock status
- **Product Performance Score**: Composite performance metric
- **Cash Flow Impact**: Financial impact of inventory decisions

## 🚨 Available Alerters

### Stock Alerts
- **Out of Stock**: Critical alerts for zero inventory
- **Low Stock**: Warnings for below minimum levels
- **Overstock**: Notifications for excess inventory

### Performance Alerts
- **Slow Moving Inventory**: Products with low turnover
- **Margin Compression**: Products with declining margins
- **High Value Products**: Special attention for high-revenue items

### Risk Alerts
- **Lead Time Risk**: Stock depletion before delivery
- **Supplier Risk**: Long lead times with low stock
- **Seasonal Demand**: Seasonal products with stock issues
- **Cash Flow Impact**: Significant financial impact

## 🔧 Extending the Engine

### Adding Custom Processors

```typescript
import { DataProcessor } from '@/core/analytics';

class CustomDataProcessor implements DataProcessor<CustomData> {
  process(data: unknown[]): CustomData[] {
    // Transform raw data to your format
    return data.map(row => ({
      // Your transformation logic
    }));
  }

  validate(data: unknown[]): ValidationResult {
    // Your validation logic
    return {
      isValid: true,
      errors: [],
      warnings: [],
      rowCount: data.length,
      columnCount: 0,
      preview: []
    };
  }

  transform(data: CustomData[]): unknown[] {
    // Optional transformation
    return data;
  }
}

// Register with engine
analytics.engine.registerProcessor('custom', new CustomDataProcessor());
```

### Adding Custom Calculators

```typescript
import { Calculator } from '@/core/analytics';

class CustomCalculator implements Calculator {
  id = 'custom-metric';
  name = 'Custom Metric';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    // Your calculation logic
    return {
      id: this.id,
      name: this.name,
      value: calculatedValue,
      unit: 'custom_unit',
      timestamp: new Date().toISOString(),
      metadata: { /* additional info */ }
    };
  }
}

// Register with engine
analytics.engine.registerCalculator('custom-metric', new CustomCalculator());
```

### Adding Custom Alerters

```typescript
import { Alerter } from '@/core/analytics';

class CustomAlerter implements Alerter {
  id = 'custom-alert';
  name = 'Custom Alert';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    // Your alert logic
    return [{
      id: 'custom-alert-1',
      type: 'CUSTOM',
      severity: 'medium',
      title: 'Custom Alert',
      message: 'Custom alert message',
      timestamp: new Date().toISOString(),
      isAcknowledged: false
    }];
  }
}

// Register with engine
analytics.engine.registerAlerter('custom-alert', new CustomAlerter());
```

## 🎨 Dashboard Integration

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { SupplyChainAnalyticsFactory } from '@/core/analytics';

export function useAnalytics() {
  const [analytics] = useState(() => SupplyChainAnalyticsFactory.createSupplyChainAnalytics());
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const processData = async (inventoryData, salesData) => {
    // Process both data sources
    const processedInventory = await analytics.engine.processData('inventory', inventoryData);
    const processedSales = await analytics.engine.processData('sales', salesData);

    // Calculate metrics
    const calculatedMetrics = await analytics.engine.calculateMetrics(processedInventory, [
      { id: 'supply-chain-health', name: 'Health Score', type: 'kpi', formula: '', inputs: [], outputs: [] },
      { id: 'total-revenue', name: 'Total Revenue', type: 'metric', formula: '', inputs: [], outputs: [] }
    ]);

    // Generate alerts
    const generatedAlerts = await analytics.engine.generateAlerts(processedInventory, [
      { id: 'out-of-stock', name: 'Out of Stock', type: 'threshold', condition: '', severity: 'critical', message: '' },
      { id: 'low-stock', name: 'Low Stock', type: 'threshold', condition: '', severity: 'high', message: '' }
    ]);

    setData({ inventory: processedInventory, sales: processedSales });
    setMetrics(calculatedMetrics);
    setAlerts(generatedAlerts);
  };

  return { data, metrics, alerts, processData };
}
```

## 🔄 Adapting to Other Projects

### 1. Copy Core Files
Copy the entire `src/core/analytics/` directory to your new project.

### 2. Install Dependencies
```bash
npm install papaparse # For CSV processing
```

### 3. Create Domain-Specific Implementations
```typescript
// Create your own processors, calculators, and alerters
// following the same patterns as the supply chain examples
```

### 4. Configure for Your Data
```typescript
// Update schemas and validation rules for your data format
const customConfig = {
  dataSources: [
    {
      id: 'your-data',
      name: 'Your Data',
      type: 'csv',
      schema: {
        // Your data schema
      }
    }
  ],
  // ... rest of configuration
};
```

## 🧪 Testing

### Unit Tests
```typescript
import { SupplyChainAnalyticsFactory } from '@/core/analytics';

describe('Analytics Engine', () => {
  let analytics;

  beforeEach(() => {
    analytics = SupplyChainAnalyticsFactory.createSupplyChainAnalytics();
  });

  test('should process inventory data', async () => {
    const testData = [/* your test data */];
    const result = await analytics.engine.processData('inventory', testData);
    expect(result.records).toHaveLength(testData.length);
  });

  test('should calculate metrics', async () => {
    // Test metric calculations
  });

  test('should generate alerts', async () => {
    // Test alert generation
  });
});
```

## 📈 Performance Considerations

### Caching
The engine includes built-in caching for expensive operations:
- Metric calculations are cached for 10 minutes
- Data processing results are cached for 5 minutes
- Cache can be cleared manually when needed

### Batch Processing
For large datasets:
- Process data in chunks
- Use the transform methods to optimize data
- Consider pre-aggregating data for better performance

### Memory Management
- Process data streams for very large files
- Clear cache periodically
- Use pagination for large result sets

## 🔒 Security

### Data Validation
- All input data is validated before processing
- Type checking prevents injection attacks
- Sanitization of string inputs

### Access Control
- Implement your own authentication/authorization
- Validate data sources before processing
- Audit all analytics operations

## 🚀 Deployment

### Build Configuration
```typescript
// vite.config.ts or webpack.config.js
export default {
  build: {
    rollupOptions: {
      external: ['papaparse'], // External dependencies
    }
  }
};
```

### Environment Variables
```bash
# .env
VITE_ANALYTICS_CACHE_TTL=300000
VITE_ANALYTICS_MAX_FILE_SIZE=10485760
```

## 📚 API Reference

### Core Classes

#### `CoreAnalyticsEngine`
Main analytics engine that orchestrates all operations.

**Methods:**
- `processData(sourceId, data)`: Process raw data
- `validateData(sourceId, data)`: Validate data format
- `calculateMetrics(data, configs)`: Calculate metrics
- `generateAlerts(data, configs)`: Generate alerts
- `createTimeSeries(data, timeField, valueField)`: Create time series
- `exportResults(results, format)`: Export results

#### `SupplyChainAnalyticsFactory`
Factory for creating supply chain analytics modules.

**Static Methods:**
- `createSupplyChainAnalytics(config?)`: Full module
- `createMinimalSupplyChainAnalytics()`: Basic module
- `createCustomSupplyChainAnalytics(options)`: Custom module

### Interfaces

#### `DataProcessor<T>`
Interface for data processing components.

#### `Calculator`
Interface for metric calculation components.

#### `Alerter`
Interface for alert generation components.

## 🤝 Contributing

### Adding New Features
1. Follow SOLID principles
2. Add comprehensive tests
3. Update documentation
4. Maintain backward compatibility

### Code Style
- Use TypeScript strictly (no `any` types)
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use meaningful variable names

## 📄 License

This analytics engine is part of the supply chain dashboard project and follows the same licensing terms.

---

## 🎯 Next Steps

1. **Customize for Your Domain**: Adapt the supply chain examples to your specific use case
2. **Add More Calculators**: Implement domain-specific metrics
3. **Enhance Alerting**: Add more sophisticated alert conditions
4. **Integrate with UI**: Connect to your dashboard components
5. **Add Real-time Features**: Implement WebSocket connections for live updates
6. **Scale Up**: Add database persistence and caching layers

The modular design makes it easy to start simple and grow complex as your needs evolve! 