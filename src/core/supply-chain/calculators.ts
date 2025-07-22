import type { Calculator, ProcessedData, CalculationConfig, MetricResult } from '../types';
import type { 
  InventoryRecord, 
  SalesRecord, 
  ProcessedProduct, 
  SupplyChainMetrics,
  SupplyChainConfig 
} from './types';

/**
 * Supply Chain Health Score Calculator
 * Calculates overall supply chain health based on multiple factors
 */
export class SupplyChainHealthCalculator implements Calculator {
  id = 'supply-chain-health';
  name = 'Supply Chain Health Score';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    if (products.length === 0) {
      return {
        id: this.id,
        name: this.name,
        value: 0,
        unit: 'score',
        timestamp: new Date().toISOString(),
        metadata: { reason: 'No products available' }
      };
    }

    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.stockStatus === 'OUT_OF_STOCK').length;
    const lowStock = products.filter(p => p.stockStatus === 'LOW_STOCK').length;
    const overStock = products.filter(p => p.stockStatus === 'OVERSTOCK').length;
    const normalStock = totalProducts - outOfStock - lowStock - overStock;

    // Calculate health score components
    const stockHealth = totalProducts > 0 ? (normalStock / totalProducts) * 100 : 0;
    const overstockPenalty = totalProducts > 0 ? (overStock / totalProducts) * 30 : 0;
    
    const avgGrossMargin = products.length > 0 
      ? products.reduce((sum, p) => sum + p.margin, 0) / products.length 
      : 0;
    const marginBonus = avgGrossMargin > 20 ? 10 : 0;
    
    const supplyChainHealthScore = Math.max(0, Math.min(100, stockHealth - overstockPenalty + marginBonus));

    return {
      id: this.id,
      name: this.name,
      value: Math.round(supplyChainHealthScore),
      unit: 'score',
      timestamp: new Date().toISOString(),
      metadata: {
        totalProducts,
        outOfStock,
        lowStock,
        overStock,
        normalStock,
        avgGrossMargin: Math.round(avgGrossMargin * 10) / 10,
        stockHealth: Math.round(stockHealth * 10) / 10,
        overstockPenalty: Math.round(overstockPenalty * 10) / 10,
        marginBonus
      }
    };
  }
}

/**
 * Total Revenue Calculator
 * Calculates total revenue from sales data
 */
export class TotalRevenueCalculator implements Calculator {
  id = 'total-revenue';
  name = 'Total Revenue';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

    return {
      id: this.id,
      name: this.name,
      value: Math.round(totalRevenue * 100) / 100,
      unit: 'currency',
      timestamp: new Date().toISOString(),
      metadata: {
        productCount: products.length,
        avgRevenuePerProduct: products.length > 0 ? totalRevenue / products.length : 0
      }
    };
  }
}

/**
 * Critical Alerts Calculator
 * Counts critical alerts (out of stock and low stock)
 */
export class CriticalAlertsCalculator implements Calculator {
  id = 'critical-alerts';
  name = 'Critical Alerts';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    const criticalAlerts = products.filter(p => 
      p.stockStatus === 'OUT_OF_STOCK' || p.stockStatus === 'LOW_STOCK'
    ).length;

    return {
      id: this.id,
      name: this.name,
      value: criticalAlerts,
      unit: 'count',
      timestamp: new Date().toISOString(),
      metadata: {
        outOfStock: products.filter(p => p.stockStatus === 'OUT_OF_STOCK').length,
        lowStock: products.filter(p => p.stockStatus === 'LOW_STOCK').length,
        totalProducts: products.length
      }
    };
  }
}

/**
 * Average Gross Margin Calculator
 * Calculates average gross margin across all products
 */
export class AverageGrossMarginCalculator implements Calculator {
  id = 'avg-gross-margin';
  name = 'Average Gross Margin';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    if (products.length === 0) {
      return {
        id: this.id,
        name: this.name,
        value: 0,
        unit: 'percentage',
        timestamp: new Date().toISOString(),
        metadata: { reason: 'No products available' }
      };
    }

    const avgGrossMargin = products.reduce((sum, p) => sum + p.margin, 0) / products.length;

    return {
      id: this.id,
      name: this.name,
      value: Math.round(avgGrossMargin * 10) / 10,
      unit: 'percentage',
      timestamp: new Date().toISOString(),
      metadata: {
        productCount: products.length,
        minMargin: Math.min(...products.map(p => p.margin)),
        maxMargin: Math.max(...products.map(p => p.margin))
      }
    };
  }
}

/**
 * Inventory Turnover Calculator
 * Calculates average inventory turnover rate
 */
export class InventoryTurnoverCalculator implements Calculator {
  id = 'inventory-turnover';
  name = 'Inventory Turnover Rate';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    if (products.length === 0) {
      return {
        id: this.id,
        name: this.name,
        value: 0,
        unit: 'times_per_year',
        timestamp: new Date().toISOString(),
        metadata: { reason: 'No products available' }
      };
    }

    const validProducts = products.filter(p => p.turnoverRate > 0);
    const avgTurnover = validProducts.length > 0 
      ? validProducts.reduce((sum, p) => sum + p.turnoverRate, 0) / validProducts.length
      : 0;

    return {
      id: this.id,
      name: this.name,
      value: Math.round(avgTurnover * 100) / 100,
      unit: 'times_per_year',
      timestamp: new Date().toISOString(),
      metadata: {
        productCount: products.length,
        validProductCount: validProducts.length,
        minTurnover: validProducts.length > 0 ? Math.min(...validProducts.map(p => p.turnoverRate)) : 0,
        maxTurnover: validProducts.length > 0 ? Math.max(...validProducts.map(p => p.turnoverRate)) : 0
      }
    };
  }
}

/**
 * Days in Inventory Calculator
 * Calculates average days in inventory
 */
export class DaysInInventoryCalculator implements Calculator {
  id = 'days-in-inventory';
  name = 'Days in Inventory';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    if (products.length === 0) {
      return {
        id: this.id,
        name: this.name,
        value: 0,
        unit: 'days',
        timestamp: new Date().toISOString(),
        metadata: { reason: 'No products available' }
      };
    }

    const validProducts = products.filter(p => p.daysOfSupply < 999);
    const avgDaysInInventory = validProducts.length > 0 
      ? validProducts.reduce((sum, p) => sum + p.daysOfSupply, 0) / validProducts.length
      : 0;

    return {
      id: this.id,
      name: this.name,
      value: Math.round(avgDaysInInventory),
      unit: 'days',
      timestamp: new Date().toISOString(),
      metadata: {
        productCount: products.length,
        validProductCount: validProducts.length,
        minDays: validProducts.length > 0 ? Math.min(...validProducts.map(p => p.daysOfSupply)) : 0,
        maxDays: validProducts.length > 0 ? Math.max(...validProducts.map(p => p.daysOfSupply)) : 0
      }
    };
  }
}

/**
 * Inventory Carrying Cost Calculator
 * Calculates total inventory carrying costs
 */
export class InventoryCarryingCostCalculator implements Calculator {
  id = 'inventory-carrying-cost';
  name = 'Inventory Carrying Cost';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    const totalCarryingCost = products.reduce((sum, p) => sum + (p.inventoryCarryingCost || 0), 0);

    return {
      id: this.id,
      name: this.name,
      value: Math.round(totalCarryingCost * 100) / 100,
      unit: 'currency',
      timestamp: new Date().toISOString(),
      metadata: {
        productCount: products.length,
        avgCarryingCostPerProduct: products.length > 0 ? totalCarryingCost / products.length : 0
      }
    };
  }
}

/**
 * Stock Status Distribution Calculator
 * Calculates distribution of products by stock status
 */
export class StockStatusDistributionCalculator implements Calculator {
  id = 'stock-status-distribution';
  name = 'Stock Status Distribution';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    if (products.length === 0) {
      return {
        id: this.id,
        name: this.name,
        value: 0,
        unit: 'distribution',
        timestamp: new Date().toISOString(),
        metadata: { reason: 'No products available' }
      };
    }

    const outOfStock = products.filter(p => p.stockStatus === 'OUT_OF_STOCK').length;
    const lowStock = products.filter(p => p.stockStatus === 'LOW_STOCK').length;
    const overStock = products.filter(p => p.stockStatus === 'OVERSTOCK').length;
    const normalStock = products.filter(p => p.stockStatus === 'NORMAL').length;

    return {
      id: this.id,
      name: this.name,
      value: normalStock, // Primary metric is normal stock count
      unit: 'distribution',
      timestamp: new Date().toISOString(),
      metadata: {
        totalProducts: products.length,
        outOfStock,
        lowStock,
        overStock,
        normalStock,
        outOfStockPercentage: Math.round((outOfStock / products.length) * 100),
        lowStockPercentage: Math.round((lowStock / products.length) * 100),
        overStockPercentage: Math.round((overStock / products.length) * 100),
        normalStockPercentage: Math.round((normalStock / products.length) * 100)
      }
    };
  }
}

/**
 * Product Performance Calculator
 * Calculates performance metrics for individual products
 */
export class ProductPerformanceCalculator implements Calculator {
  id = 'product-performance';
  name = 'Product Performance Analysis';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    if (products.length === 0) {
      return {
        id: this.id,
        name: this.name,
        value: 0,
        unit: 'performance_score',
        timestamp: new Date().toISOString(),
        metadata: { reason: 'No products available' }
      };
    }

    // Calculate performance scores for each product
    const performanceScores = products.map(product => {
      const turnoverScore = Math.min(product.turnoverRate / 6, 1) * 30; // Max 30 points for turnover
      const marginScore = Math.min(product.margin / 20, 1) * 30; // Max 30 points for margin
      const revenueScore = Math.min(product.revenue / 10000, 1) * 20; // Max 20 points for revenue
      const stockScore = product.stockStatus === 'NORMAL' ? 20 : 0; // 20 points for normal stock
      
      return {
        productCode: product.code,
        productName: product.name,
        score: Math.round(turnoverScore + marginScore + revenueScore + stockScore),
        turnoverScore: Math.round(turnoverScore),
        marginScore: Math.round(marginScore),
        revenueScore: Math.round(revenueScore),
        stockScore
      };
    });

    const avgPerformanceScore = performanceScores.reduce((sum, p) => sum + p.score, 0) / performanceScores.length;

    return {
      id: this.id,
      name: this.name,
      value: Math.round(avgPerformanceScore),
      unit: 'performance_score',
      timestamp: new Date().toISOString(),
      metadata: {
        productCount: products.length,
        minScore: Math.min(...performanceScores.map(p => p.score)),
        maxScore: Math.max(...performanceScores.map(p => p.score)),
        topPerformers: performanceScores
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(p => ({ code: p.productCode, name: p.productName, score: p.score }))
      }
    };
  }
}

/**
 * Cash Flow Impact Calculator
 * Calculates cash flow impact of inventory decisions
 */
export class CashFlowImpactCalculator implements Calculator {
  id = 'cash-flow-impact';
  name = 'Cash Flow Impact';

  async calculate(data: ProcessedData, config: CalculationConfig): Promise<MetricResult> {
    const products = data.records as ProcessedProduct[];
    
    if (products.length === 0) {
      return {
        id: this.id,
        name: this.name,
        value: 0,
        unit: 'currency',
        timestamp: new Date().toISOString(),
        metadata: { reason: 'No products available' }
      };
    }

    // Calculate cash flow impact
    const outOfStockRevenueLoss = products
      .filter(p => p.stockStatus === 'OUT_OF_STOCK')
      .reduce((sum, p) => sum + p.revenue, 0);
    
    const overStockCarryingCost = products
      .filter(p => p.stockStatus === 'OVERSTOCK')
      .reduce((sum, p) => sum + (p.inventoryCarryingCost || 0), 0);
    
    const totalCashFlowImpact = outOfStockRevenueLoss + overStockCarryingCost;

    return {
      id: this.id,
      name: this.name,
      value: Math.round(totalCashFlowImpact * 100) / 100,
      unit: 'currency',
      timestamp: new Date().toISOString(),
      metadata: {
        outOfStockRevenueLoss: Math.round(outOfStockRevenueLoss * 100) / 100,
        overStockCarryingCost: Math.round(overStockCarryingCost * 100) / 100,
        outOfStockProducts: products.filter(p => p.stockStatus === 'OUT_OF_STOCK').length,
        overStockProducts: products.filter(p => p.stockStatus === 'OVERSTOCK').length
      }
    };
  }
} 