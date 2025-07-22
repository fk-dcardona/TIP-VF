import type { Alerter, ProcessedData, AlertConfig, Alert } from '../types';
import type { 
  ProcessedProduct, 
  SupplyChainAlert,
  SupplyChainConfig 
} from './types';

/**
 * Out of Stock Alerter
 * Generates alerts for products that are out of stock
 */
export class OutOfStockAlerter implements Alerter {
  id = 'out-of-stock';
  name = 'Out of Stock Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    products.forEach(product => {
      if (product.stockStatus === 'OUT_OF_STOCK') {
        alerts.push({
          id: `${product.code}-out`,
          type: 'OUT_OF_STOCK',
          severity: 'critical',
          title: 'Product Out of Stock',
          message: `${product.name} is out of stock`,
          affectedEntity: product.code,
          currentValue: product.currentStock,
          thresholdValue: product.minimumLevel,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Create emergency purchase order', 'Check supplier availability']
        });
      }
    });

    return alerts;
  }
}

/**
 * Low Stock Alerter
 * Generates alerts for products that are below minimum stock levels
 */
export class LowStockAlerter implements Alerter {
  id = 'low-stock';
  name = 'Low Stock Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    products.forEach(product => {
      if (product.stockStatus === 'LOW_STOCK') {
        const urgency = product.daysOfSupply < 7 ? 'high' : 'medium';
        
        alerts.push({
          id: `${product.code}-low`,
          type: 'LOW_STOCK',
          severity: urgency,
          title: 'Low Stock Alert',
          message: `${product.name} is below minimum stock level (${product.daysOfSupply.toFixed(1)} days remaining)`,
          affectedEntity: product.code,
          currentValue: product.currentStock,
          thresholdValue: product.minimumLevel,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Schedule purchase order', 'Review lead time']
        });
      }
    });

    return alerts;
  }
}

/**
 * Overstock Alerter
 * Generates alerts for products that have excess inventory
 */
export class OverstockAlerter implements Alerter {
  id = 'overstock';
  name = 'Overstock Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    products.forEach(product => {
      if (product.stockStatus === 'OVERSTOCK') {
        alerts.push({
          id: `${product.code}-over`,
          type: 'OVERSTOCK',
          severity: 'medium',
          title: 'Overstock Alert',
          message: `${product.name} has excess inventory (${product.daysOfSupply.toFixed(1)} days of supply)`,
          affectedEntity: product.code,
          currentValue: product.currentStock,
          thresholdValue: product.maximumLevel,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Consider promotional pricing', 'Review ordering frequency']
        });
      }
    });

    return alerts;
  }
}

/**
 * Slow Moving Inventory Alerter
 * Generates alerts for products with low turnover rates
 */
export class SlowMovingInventoryAlerter implements Alerter {
  id = 'slow-moving';
  name = 'Slow Moving Inventory Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    const turnoverThreshold = config.value as number || 2; // Default 2 times per year

    products.forEach(product => {
      if (product.turnoverRate < turnoverThreshold && product.currentStock > 0) {
        alerts.push({
          id: `${product.code}-slow`,
          type: 'SLOW_MOVING',
          severity: 'low',
          title: 'Slow Moving Inventory',
          message: `${product.name} has low turnover rate (${product.turnoverRate.toFixed(2)} times/year)`,
          affectedEntity: product.code,
          currentValue: product.turnoverRate,
          thresholdValue: turnoverThreshold,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Review pricing strategy', 'Consider discontinuation']
        });
      }
    });

    return alerts;
  }
}

/**
 * Margin Compression Alerter
 * Generates alerts for products with declining margins
 */
export class MarginCompressionAlerter implements Alerter {
  id = 'margin-compression';
  name = 'Margin Compression Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    const marginThreshold = config.value as number || 10; // Default 10% margin

    products.forEach(product => {
      if (product.margin < marginThreshold && product.revenue > 0) {
        alerts.push({
          id: `${product.code}-margin`,
          type: 'MARGIN_COMPRESSION',
          severity: product.margin < 5 ? 'high' : 'medium',
          title: 'Low Margin Alert',
          message: `${product.name} has low margin (${product.margin.toFixed(1)}%)`,
          affectedEntity: product.code,
          currentValue: product.margin,
          thresholdValue: marginThreshold,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Review pricing', 'Negotiate with suppliers']
        });
      }
    });

    return alerts;
  }
}

/**
 * Discontinued Product Alerter
 * Generates alerts for products that haven't been seen in recent periods
 */
export class DiscontinuedProductAlerter implements Alerter {
  id = 'discontinued';
  name = 'Discontinued Product Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    const monthsThreshold = config.value as number || 3; // Default 3 months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsThreshold);

    products.forEach(product => {
      const lastSeenDate = new Date(product.lastSeenPeriod);
      if (lastSeenDate < cutoffDate && product.revenue > 0) {
        alerts.push({
          id: `${product.code}-discontinued`,
          type: 'DISCONTINUED',
          severity: 'medium',
          title: 'Potential Discontinued Product',
          message: `${product.name} hasn't been seen in ${monthsThreshold} months`,
          affectedEntity: product.code,
          currentValue: 0,
          thresholdValue: monthsThreshold,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Verify product status', 'Consider replacement']
        });
      }
    });

    return alerts;
  }
}

/**
 * High Value Product Alerter
 * Generates alerts for high-value products that need special attention
 */
export class HighValueProductAlerter implements Alerter {
  id = 'high-value';
  name = 'High Value Product Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    const revenueThreshold = config.value as number || 10000; // Default $10,000

    products.forEach(product => {
      if (product.revenue > revenueThreshold) {
        const severity = product.stockStatus === 'OUT_OF_STOCK' ? 'critical' : 
                        product.stockStatus === 'LOW_STOCK' ? 'high' : 'medium';

        alerts.push({
          id: `${product.code}-high-value`,
          type: 'HIGH_VALUE',
          severity,
          title: 'High Value Product Alert',
          message: `${product.name} is a high-value product ($${product.revenue.toLocaleString()})`,
          affectedEntity: product.code,
          currentValue: product.revenue,
          thresholdValue: revenueThreshold,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Monitor closely', 'Ensure adequate stock']
        });
      }
    });

    return alerts;
  }
}

/**
 * Lead Time Risk Alerter
 * Generates alerts for products with lead time risks
 */
export class LeadTimeRiskAlerter implements Alerter {
  id = 'lead-time-risk';
  name = 'Lead Time Risk Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    products.forEach(product => {
      if (product.daysOfSupply < product.leadTimeDays && product.stockStatus !== 'OUT_OF_STOCK') {
        alerts.push({
          id: `${product.code}-lead-time`,
          type: 'LEAD_TIME_RISK',
          severity: 'high',
          title: 'Lead Time Risk Alert',
          message: `${product.name} stock will deplete before next delivery (${product.daysOfSupply.toFixed(1)} days vs ${product.leadTimeDays} days lead time)`,
          affectedEntity: product.code,
          currentValue: product.daysOfSupply,
          thresholdValue: product.leadTimeDays,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Expedite order', 'Find alternative supplier']
        });
      }
    });

    return alerts;
  }
}

/**
 * Seasonal Demand Alerter
 * Generates alerts for products with seasonal demand patterns
 */
export class SeasonalDemandAlerter implements Alerter {
  id = 'seasonal-demand';
  name = 'Seasonal Demand Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    const currentMonth = new Date().getMonth();
    
    // Simple seasonal pattern detection (can be enhanced with historical data)
    const seasonalProducts = products.filter(product => {
      const productName = product.name.toLowerCase();
      return (
        productName.includes('christmas') || productName.includes('holiday') ||
        productName.includes('summer') || productName.includes('winter') ||
        productName.includes('spring') || productName.includes('fall')
      );
    });

    seasonalProducts.forEach(product => {
      if (product.stockStatus === 'LOW_STOCK' || product.stockStatus === 'OUT_OF_STOCK') {
        alerts.push({
          id: `${product.code}-seasonal`,
          type: 'SEASONAL_DEMAND',
          severity: 'high',
          title: 'Seasonal Demand Alert',
          message: `${product.name} is a seasonal product with stock issues`,
          affectedEntity: product.code,
          currentValue: product.currentStock,
          thresholdValue: product.minimumLevel,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Increase stock for season', 'Plan ahead for next season']
        });
      }
    });

    return alerts;
  }
}

/**
 * Supplier Risk Alerter
 * Generates alerts for products with supplier-related risks
 */
export class SupplierRiskAlerter implements Alerter {
  id = 'supplier-risk';
  name = 'Supplier Risk Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    // This would typically integrate with supplier data
    // For now, we'll use a simple heuristic based on lead time and stock status
    products.forEach(product => {
      if (product.leadTimeDays > 30 && product.stockStatus === 'LOW_STOCK') {
        alerts.push({
          id: `${product.code}-supplier`,
          type: 'SUPPLIER_RISK',
          severity: 'medium',
          title: 'Supplier Risk Alert',
          message: `${product.name} has long lead time (${product.leadTimeDays} days) and low stock`,
          affectedEntity: product.code,
          currentValue: product.leadTimeDays,
          thresholdValue: 30,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Find backup supplier', 'Negotiate shorter lead time']
        });
      }
    });

    return alerts;
  }
}

/**
 * Cash Flow Impact Alerter
 * Generates alerts for products with significant cash flow impact
 */
export class CashFlowImpactAlerter implements Alerter {
  id = 'cash-flow-impact';
  name = 'Cash Flow Impact Alerter';

  async check(data: ProcessedData, config: AlertConfig): Promise<Alert[]> {
    const products = data.records as ProcessedProduct[];
    const alerts: Alert[] = [];

    const impactThreshold = config.value as number || 5000; // Default $5,000

    products.forEach(product => {
      let impact = 0;
      let impactType = '';

      if (product.stockStatus === 'OUT_OF_STOCK') {
        impact = product.revenue;
        impactType = 'Revenue Loss';
      } else if (product.stockStatus === 'OVERSTOCK') {
        impact = product.inventoryCarryingCost || 0;
        impactType = 'Carrying Cost';
      }

      if (impact > impactThreshold) {
        alerts.push({
          id: `${product.code}-cash-flow`,
          type: 'CASH_FLOW_IMPACT',
          severity: impact > 10000 ? 'high' : 'medium',
          title: 'Cash Flow Impact Alert',
          message: `${product.name} has significant ${impactType} ($${impact.toLocaleString()})`,
          affectedEntity: product.code,
          currentValue: impact,
          thresholdValue: impactThreshold,
          timestamp: new Date().toISOString(),
          isAcknowledged: false,
          actions: ['Review inventory strategy', 'Optimize ordering']
        });
      }
    });

    return alerts;
  }
} 