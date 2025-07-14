# Data Contract - Frontend/Backend Interface

## Overview
This document defines the data structures and contracts between the Flask backend and Next.js frontend.

## Data Processing Flow

1. **CSV Upload** → 2. **Automatic Processing** → 3. **Store Analytics** → 4. **API Response**

## API Response Structures

### 1. Upload Response
```typescript
POST /api/upload
Response: {
  success: boolean;
  upload: {
    id: number;
    filename: string;
    status: 'processing' | 'completed' | 'error';
    row_count: number;
    analytics_id?: number; // Reference to processed data
  }
}
```

### 2. Dashboard Data
```typescript
GET /api/dashboard/{userId}
Response: {
  metrics: {
    total_inventory_value: number;
    total_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
    avg_inventory_turnover: number;
    monthly_burn_rate: number;
    working_capital_efficiency: number;
  },
  product_performance: Array<{
    product_id: string;
    product_name: string;
    current_stock: number;
    sales_velocity: number;
    days_of_stock: number;
    inventory_turnover: number;
    roi_percentage: number;
    selling_price: number;
    cost_per_unit: number;
    status: 'healthy' | 'low_stock' | 'out_of_stock' | 'overstock';
    reorder_point: number;
    supplier_name: string;
  }>,
  inventory_alerts: Array<{
    type: 'low_stock' | 'out_of_stock' | 'overstock';
    product_id: string;
    product_name: string;
    current_stock: number;
    days_remaining: number;
    severity: 'critical' | 'warning' | 'info';
  }>,
  financial_insights: {
    cash_tied_up: number;
    inventory_to_sales_ratio: number;
    days_of_cash_in_inventory: number;
    high_value_products: Array<{product_id: string; value: number}>;
    low_turnover_products: Array<{product_id: string; turnover: number}>;
  }
}
```

### 3. Processed Analytics Structure
```typescript
// Stored in ProcessedData.processed_data (JSON)
{
  timestamp: string;
  summary: {
    total_products: number;
    total_inventory_value: number;
    avg_inventory_turnover: number;
    overall_health_score: number;
  },
  products: Array<{
    // All fields from product_performance above
  }>,
  alerts: Array<{
    // Alert structure
  }>,
  financial_metrics: {
    // Financial insights structure
  }
}
```

## Required CSV Columns

### Inventory Data
- product_id (required)
- product_name (required)
- current_stock (required)
- cost_per_unit (required)
- selling_price (optional, defaults to cost * 1.3)
- reorder_point (optional, defaults to sales_velocity * 14)
- supplier_name (optional)

### Sales Data
- product_id (required)
- sales_quantity (required)
- sales_period_days (optional, defaults to 30)

### Calculated Fields (by backend)
- sales_velocity = sales_quantity / sales_period_days
- days_of_stock = current_stock / sales_velocity
- inventory_turnover = (sales_quantity * 365/sales_period_days) / current_stock
- roi_percentage = ((selling_price - cost_per_unit) / cost_per_unit) * 100
- monthly_burn_rate = sum(sales_velocity * cost_per_unit * 30)
- working_capital_efficiency = (inventory_turnover * 30) / 365

## Implementation Priority

1. **Phase 1**: Fix upload processing to automatically run analytics
2. **Phase 2**: Create missing /api/dashboard/{userId} endpoint
3. **Phase 3**: Remove all hardcoded values from frontend
4. **Phase 4**: Implement real-time analytics updates
5. **Phase 5**: Add data validation and error handling