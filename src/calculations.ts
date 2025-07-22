import type { 
  InventoryData, 
  SalesData, 
  ProcessedProduct, 
  Alert, 
  KPIData, 
  ProcurementRecommendation,
  StockEfficiencyData,
  TimeRange 
} from '@/types';

export const calculateLeadTimeDays = (productGroup: string): number => {
  if (productGroup.toUpperCase().includes('PAÑITOS')) return 7;
  if (productGroup.toUpperCase().includes('DETERGENTE')) return 10;
  return 14;
};

// Enhanced inventory calculations based on period-based data
export const calculateMonthlyInventoryChanges = (
  productCode: string,
  allInventoryData: InventoryData[]
): {
  monthlyUsage: number;
  monthlyReceipts: number;
  monthlyBalance: number;
  averageInventory: number;
  inventoryTurnover: number;
  daysInInventory: number;
  inventoryCarryingCost: number;
} => {
  // Get all periods for this product, sorted by period
  const productPeriods = allInventoryData
    .filter(item => item.k_sc_codigo_articulo === productCode)
    .sort((a, b) => Date.parse(a.period) - Date.parse(b.period));

  if (productPeriods.length === 0) {
    return {
      monthlyUsage: 0,
      monthlyReceipts: 0,
      monthlyBalance: 0,
      averageInventory: 0,
      inventoryTurnover: 0,
      daysInInventory: 999,
      inventoryCarryingCost: 0
    };
  }

  // Calculate monthly changes
  let totalUsage = 0;
  let totalReceipts = 0;
  let totalBalance = 0;
  let validPeriods = 0;

  for (let i = 0; i < productPeriods.length; i++) {
    const current = productPeriods[i];
    
    // Monthly Usage = Beginning Inventory - Ending Inventory + Receipts
    const monthlyUsage = current.n_salidas || 0;
    const monthlyReceipts = current.n_entradas || 0;
    
    // Monthly Balance = Beginning + Receipts - Usage
    const monthlyBalance = (current.n_saldo_anterior || 0) + monthlyReceipts - monthlyUsage;
    
    totalUsage += monthlyUsage;
    totalReceipts += monthlyReceipts;
    totalBalance += monthlyBalance;
    validPeriods++;
  }

  const avgUsage = validPeriods > 0 ? totalUsage / validPeriods : 0;
  const avgReceipts = validPeriods > 0 ? totalReceipts / validPeriods : 0;
  const avgBalance = validPeriods > 0 ? totalBalance / validPeriods : 0;

  // Calculate Average Inventory: (Beginning + Ending) / 2
  const latestPeriod = productPeriods[productPeriods.length - 1];
  const averageInventory = validPeriods > 1 
    ? (latestPeriod.n_saldo_anterior + latestPeriod.n_saldo_actual) / 2
    : latestPeriod.n_saldo_actual;

  // Fixed Inventory Turnover calculation
  // Use simpler, more reliable calculation: (Monthly Usage * 12) / Average Inventory
  const inventoryTurnover = averageInventory > 0 && avgUsage > 0 
    ? (avgUsage * 12) / averageInventory 
    : 0;

  // Days in Inventory = 365 / Inventory Turnover
  const daysInInventory = inventoryTurnover > 0 ? 365 / inventoryTurnover : 999;

  // Inventory Carrying Cost (2% per month of average inventory value)
  const inventoryCarryingCost = averageInventory * latestPeriod.n_costo_promedio * 0.02;

  return {
    monthlyUsage: Math.max(0, avgUsage),
    monthlyReceipts: Math.max(0, avgReceipts),
    monthlyBalance: avgBalance,
    averageInventory: Math.max(0, averageInventory),
    inventoryTurnover: isNaN(inventoryTurnover) || inventoryTurnover === Infinity ? 0 : Math.max(0, inventoryTurnover),
    daysInInventory: Math.min(isNaN(daysInInventory) || daysInInventory === Infinity ? 999 : daysInInventory, 999),
    inventoryCarryingCost: Math.max(0, inventoryCarryingCost)
  };
};

export const calculateMonthlySales = (
  productCode: string, 
  salesData: SalesData[], 
  timeRange: TimeRange
): { quantity: number; revenue: number } => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (timeRange.days || 30));

  const productSales = salesData.filter(sale => {
    if (sale.k_sc_codigo_articulo !== productCode) return false;
    
    const saleDate = new Date(sale.d_fecha_documento);
    return saleDate >= cutoffDate;
  });

  const totalQuantity = productSales.reduce((sum, sale) => sum + Math.abs(sale.n_cantidad), 0);
  const totalRevenue = productSales.reduce((sum, sale) => sum + sale['V. NETA'], 0);

  // Normalize to monthly average
  const months = (timeRange.days || 30) / 30;
  return {
    quantity: totalQuantity / months,
    revenue: totalRevenue / months
  };
};

export const calculateMinMaxLevels = (
  avgMonthlySales: number,
  leadTimeDays: number,
  safetyStockMultiplier: number = 0.5
): { minimum: number; maximum: number } => {
  const dailySales = avgMonthlySales / 30;
  const leadTimeDemand = dailySales * leadTimeDays;
  const safetyStock = leadTimeDemand * safetyStockMultiplier;
  
  const minimum = avgMonthlySales === 0 ? 0 : Math.max(1, Math.ceil(leadTimeDemand + safetyStock));
  const maximum = Math.ceil(avgMonthlySales * 2); // 2 months supply

  return { minimum, maximum };
};

export const determineStockStatus = (
  currentStock: number,
  minimum: number,
  maximum: number
): 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' => {
  if (currentStock <= 0) return 'OUT_OF_STOCK';
  if (currentStock < minimum) return 'LOW_STOCK';
  if (currentStock > maximum * 1.5) return 'OVERSTOCK';
  return 'NORMAL';
};

export const calculateTurnoverRate = (
  monthlySales: number,
  currentStock: number
): number => {
  if (currentStock <= 0) return 0;
  return (monthlySales * 12) / currentStock;
};

export const calculateDaysOfSupply = (
  currentStock: number,
  monthlySales: number
): number => {
  if (monthlySales <= 0) return 999;
  const dailySales = monthlySales / 30;
  return currentStock / dailySales;
};

// Enhanced product processing with comprehensive inventory analytics
export const processProducts = (
  inventoryData: InventoryData[],
  allInventoryData: InventoryData[], // All periods for trend analysis
  salesData: SalesData[],
  timeRange: TimeRange
): ProcessedProduct[] => {
  return inventoryData.map(item => {
    const { quantity: monthlySales, revenue } = calculateMonthlySales(
      item.k_sc_codigo_articulo,
      salesData,
      timeRange
    );

    // Get enhanced inventory metrics
    const inventoryMetrics = calculateMonthlyInventoryChanges(
      item.k_sc_codigo_articulo,
      allInventoryData
    );

    const leadTimeDays = calculateLeadTimeDays(item.sc_detalle_grupo);
    const { minimum, maximum } = calculateMinMaxLevels(monthlySales, leadTimeDays);
    const stockStatus = determineStockStatus(item.n_saldo_actual, minimum, maximum);
    
    // Use enhanced turnover calculation with fallback
    const turnoverRate = inventoryMetrics.inventoryTurnover > 0 
      ? inventoryMetrics.inventoryTurnover 
      : calculateTurnoverRate(monthlySales, item.n_saldo_actual); // Fallback to simple calculation
    const daysOfSupply = inventoryMetrics.daysInInventory;

    const margin = revenue > 0 ? ((revenue - (monthlySales * item.n_costo_promedio)) / revenue) * 100 : 0;

    return {
      code: item.k_sc_codigo_articulo,
      name: item.sc_detalle_articulo,
      group: item.sc_detalle_grupo,
      subgroup: item.sc_detalle_subgrupo,
      period: item.period || '1/2/2025',
      currentStock: item.n_saldo_actual,
      averageCost: item.n_costo_promedio,
      lastCost: item.n_ultimo_costo,
      unit: item.sc_tipo_unidad,
      monthlySales,
      revenue,
      margin,
      minimumLevel: minimum,
      maximumLevel: maximum,
      stockStatus,
      turnoverRate,
      leadTimeDays,
      daysOfSupply: Math.min(daysOfSupply, 999),
      rotationVelocity: turnoverRate,
      clientValue: revenue,
      isDiscontinued: false,
      lastSeenPeriod: item.period || '1/2/2025',
      // Enhanced metrics
      monthlyUsage: inventoryMetrics.monthlyUsage,
      monthlyReceipts: inventoryMetrics.monthlyReceipts,
      averageInventory: inventoryMetrics.averageInventory,
      inventoryCarryingCost: inventoryMetrics.inventoryCarryingCost
    };
  });
};

export const generateAlerts = (products: ProcessedProduct[]): Alert[] => {
  const alerts: Alert[] = [];

  products.forEach(product => {
    if (product.stockStatus === 'OUT_OF_STOCK') {
      alerts.push({
        id: `${product.code}-out`,
        productCode: product.code,
        productName: product.name,
        type: 'OUT_OF_STOCK',
        urgency: 3,
        currentStock: product.currentStock,
        minLevel: product.minimumLevel,
        maxLevel: product.maximumLevel,
        monthlySales: product.monthlySales,
        revenueImpact: product.revenue,
        daysLeft: 0,
        message: `${product.name} is out of stock`,
        actionRequired: 'Create emergency purchase order'
      });
    } else if (product.stockStatus === 'LOW_STOCK') {
      alerts.push({
        id: `${product.code}-low`,
        productCode: product.code,
        productName: product.name,
        type: 'LOW_STOCK',
        urgency: 2,
        currentStock: product.currentStock,
        minLevel: product.minimumLevel,
        maxLevel: product.maximumLevel,
        monthlySales: product.monthlySales,
        revenueImpact: product.revenue,
        daysLeft: Math.floor(product.daysOfSupply),
        message: `${product.name} is below minimum stock level`,
        actionRequired: 'Schedule purchase order'
      });
    } else if (product.stockStatus === 'OVERSTOCK') {
      alerts.push({
        id: `${product.code}-over`,
        productCode: product.code,
        productName: product.name,
        type: 'OVERSTOCK',
        urgency: 1,
        currentStock: product.currentStock,
        minLevel: product.minimumLevel,
        maxLevel: product.maximumLevel,
        monthlySales: product.monthlySales,
        revenueImpact: -product.revenue * 0.1, // Cost of carrying inventory
        daysLeft: Math.floor(product.daysOfSupply),
        message: `${product.name} has excess inventory`,
        actionRequired: 'Consider promotional pricing'
      });
    }
  });

  return alerts.sort((a, b) => b.urgency - a.urgency || b.revenueImpact - a.revenueImpact);
};

export const calculateKPIs = (products: ProcessedProduct[], alerts: Alert[]): KPIData => {
  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stockStatus === 'OUT_OF_STOCK').length;
  const lowStock = products.filter(p => p.stockStatus === 'LOW_STOCK').length;
  const overStock = products.filter(p => p.stockStatus === 'OVERSTOCK').length;
  const normalStock = totalProducts - outOfStock - lowStock - overStock;

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const avgGrossMargin = products.length > 0 
    ? products.reduce((sum, p) => sum + p.margin, 0) / products.length 
    : 0;

  // Supply Chain Health Score calculation
  const stockHealth = totalProducts > 0 ? (normalStock / totalProducts) * 100 : 0;
  const overstockPenalty = totalProducts > 0 ? (overStock / totalProducts) * 30 : 0;
  const marginBonus = avgGrossMargin > 20 ? 10 : 0;
  const supplyChainHealthScore = Math.max(0, Math.min(100, stockHealth - overstockPenalty + marginBonus));

  const criticalAlerts = alerts.filter(a => a.urgency >= 2).length;

  return {
    supplyChainHealthScore: Math.round(supplyChainHealthScore),
    totalRevenue,
    criticalAlerts,
    avgGrossMargin,
    totalProducts,
    outOfStock,
    lowStock,
    overStock,
    normalStock
  };
};

export const generateProcurementRecommendations = (
  products: ProcessedProduct[]
): ProcurementRecommendation[] => {
  const recommendations: ProcurementRecommendation[] = [];

  products.forEach(product => {
    if (product.stockStatus === 'OUT_OF_STOCK') {
      const suggestedQuantity = Math.max(product.minimumLevel, product.monthlySales);
      recommendations.push({
        productCode: product.code,
        productName: product.name,
        action: 'immediate',
        priority: 'high',
        suggestedQuantity,
        reasoning: 'Product is out of stock with active demand',
        timeframe: '0-3 days',
        cost: suggestedQuantity * product.lastCost
      });
    } else if (product.stockStatus === 'LOW_STOCK' && product.daysOfSupply < product.leadTimeDays) {
      const suggestedQuantity = product.maximumLevel - product.currentStock;
      recommendations.push({
        productCode: product.code,
        productName: product.name,
        action: 'planned',
        priority: product.daysOfSupply < 7 ? 'high' : 'medium',
        suggestedQuantity,
        reasoning: 'Stock will deplete before next delivery',
        timeframe: '1-2 weeks',
        cost: suggestedQuantity * product.lastCost
      });
    } else if (product.stockStatus === 'OVERSTOCK' && product.daysOfSupply > 90) {
      recommendations.push({
        productCode: product.code,
        productName: product.name,
        action: 'reduce',
        priority: 'low',
        suggestedQuantity: product.currentStock - product.maximumLevel,
        reasoning: 'Excess inventory carrying costs',
        timeframe: '1-3 months',
        cost: -(product.currentStock - product.maximumLevel) * product.averageCost * 0.02 // 2% monthly carrying cost
      });
    }
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

export const calculateStockEfficiency = (products: ProcessedProduct[]): StockEfficiencyData[] => {
  return products.map(product => {
    // Handle NaN and invalid values with better fallbacks
    const turnoverRate = isNaN(product.turnoverRate) || product.turnoverRate === Infinity 
      ? 0 
      : Math.max(0, product.turnoverRate);
    
    const margin = isNaN(product.margin) || product.margin === Infinity 
      ? 0 
      : Math.max(-100, Math.min(100, product.margin)); // Cap between -100% and 100%
    
    const revenue = isNaN(product.revenue) || product.revenue < 0 
      ? 0 
      : product.revenue;
    
    const stockValue = isNaN(product.currentStock * product.averageCost) 
      ? 0 
      : Math.max(0, product.currentStock * product.averageCost);

    // More nuanced efficiency calculation
    let efficiency: 'high' | 'medium' | 'low' = 'low';
    
    // High efficiency: Good turnover AND good margin
    if (turnoverRate >= 6 && margin >= 15) {
      efficiency = 'high';
    } 
    // Medium efficiency: Either good turnover OR good margin, but not both
    else if (
      (turnoverRate >= 4 && margin >= 10) || 
      (turnoverRate >= 8 && margin >= 5) ||
      (turnoverRate >= 3 && margin >= 20)
    ) {
      efficiency = 'medium';
    }
    // Low efficiency: Poor performance on both metrics
    else {
      efficiency = 'low';
    }

    return {
      productCode: product.code,
      productName: product.name,
      turnoverRate: Math.round(turnoverRate * 10) / 10, // Round to 1 decimal place
      marginPercentage: Math.round(margin * 10) / 10, // Round to 1 decimal place
      revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
      stockValue: Math.round(stockValue * 100) / 100, // Round to 2 decimal places
      efficiency
    };
  }).sort((a, b) => b.revenue - a.revenue);
};

export const forecastRevenue = (
  historicalRevenue: number[],
  months: number = 6
): number[] => {
  if (historicalRevenue.length < 2) {
    return Array(months).fill(historicalRevenue[0] || 0);
  }

  const baseGrowthRate = 0.05; // 5% base growth
  const compoundRate = 0.02; // 2% compound growth
  
  const lastRevenue = historicalRevenue[historicalRevenue.length - 1];
  const forecast: number[] = [];

  for (let i = 1; i <= months; i++) {
    const growth = baseGrowthRate + (compoundRate * i);
    const forecastValue = lastRevenue * (1 + growth);
    forecast.push(forecastValue);
  }

  return forecast;
};