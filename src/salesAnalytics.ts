import type { 
  SalesData, 
  InventoryData, 
  SalesKPIs, 
  OutletCoverageMetrics, 
  ProductLinePerformance, 
  CustomerAnalytics, 
  SalesPerformanceData, 
  BusinessIntelligenceAlert, 
  SalesValidationResult,
  ExecutiveSummary,
  TimeSeriesData
} from '@/types';

// Enhanced sales analytics utilities with B2B/FMCG focus

export const calculateSalesKPIs = (
  salesData: SalesData[], 
  inventoryData: InventoryData[],
  timeRange: { startDate: string; endDate: string }
): SalesKPIs => {
  const filteredSales = filterSalesByDateRange(salesData, timeRange);
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale['V. NETA'], 0);
  
  // Calculate cost of goods sold using average cost
  const costOfGoodsSold = filteredSales.reduce((sum, sale) => {
    const inventoryItem = inventoryData.find(inv => inv.k_sc_codigo_articulo === sale.k_sc_codigo_articulo);
    const cost = inventoryItem?.n_costo_promedio || 0;
    return sum + (sale.n_cantidad * cost);
  }, 0);
  
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - costOfGoodsSold) / totalRevenue) * 100 : 0;
  
  // Calculate inventory turnover
  const averageInventory = inventoryData.reduce((sum, inv) => sum + inv.n_saldo_actual, 0) / inventoryData.length;
  const inventoryTurnover = averageInventory > 0 ? costOfGoodsSold / averageInventory : 0;
  
  // Calculate cash conversion cycle (simplified)
  const inventoryDays = averageInventory > 0 ? (averageInventory / costOfGoodsSold) * 365 : 0;
  const receivablesDays = 30; // Assumed average
  const payablesDays = 45; // Assumed average
  const cashConversionCycle = inventoryDays + receivablesDays - payablesDays;
  
  // Customer ROI (simplified calculation)
  const uniqueCustomers = new Set(filteredSales.map(sale => sale.sc_nombre)).size;
  const customerAcquisitionCost = 1000; // Assumed cost per customer
  const customerROI = uniqueCustomers > 0 ? (totalRevenue / (uniqueCustomers * customerAcquisitionCost)) * 100 : 0;
  
  // Operational KPIs
  const outOfStockItems = inventoryData.filter(inv => inv.n_saldo_actual === 0).length;
  const outOfStockRate = inventoryData.length > 0 ? (outOfStockItems / inventoryData.length) * 100 : 0;
  
  // Product penetration rate
  const productsWithSales = new Set(filteredSales.map(sale => sale.k_sc_codigo_articulo)).size;
  const productPenetrationRate = inventoryData.length > 0 ? (productsWithSales / inventoryData.length) * 100 : 0;
  
  // Average order value
  const averageOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  
  // Repeat purchase rate (customers with multiple orders)
  const customerOrderCounts = filteredSales.reduce((acc, sale) => {
    acc[sale.sc_nombre] = (acc[sale.sc_nombre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
  const repeatPurchaseRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;
  
  return {
    totalRevenue,
    grossMargin,
    netMargin: grossMargin * 0.7, // Simplified net margin calculation
    cashConversionCycle,
    inventoryTurnover,
    customerROI,
    onTimeDeliveryRate: 95, // Assumed value
    outOfStockRate,
    productPenetrationRate,
    averageTimeToSell: 45, // Assumed days
    supplyChainCosts: totalRevenue * 0.08, // Assumed 8% of revenue
    monthlyRevenueGrowth: 12.5, // Assumed value
    customerAcquisitionCost,
    customerLifetimeValue: totalRevenue / uniqueCustomers,
    averageOrderValue,
    repeatPurchaseRate
  };
};

export const calculateOutletCoverage = (
  salesData: SalesData[],
  timeRange: { startDate: string; endDate: string }
): OutletCoverageMetrics[] => {
  const filteredSales = filterSalesByDateRange(salesData, timeRange);
  
  // Group by salesperson
  const salespersonData = filteredSales.reduce((acc, sale) => {
    const salesperson = sale.nombre_vendedor || 'Unknown';
    if (!acc[salesperson]) {
      acc[salesperson] = {
        customers: new Set(),
        transactions: 0,
        territory: sale.zona || 'Unknown'
      };
    }
    acc[salesperson].customers.add(sale.sc_nombre);
    acc[salesperson].transactions++;
    return acc;
  }, {} as Record<string, { customers: Set<string>; transactions: number; territory: string }>);
  
  // Calculate metrics for each salesperson
  const daysInPeriod = calculateDaysBetween(timeRange.startDate, timeRange.endDate);
  
  return Object.entries(salespersonData).map(([salesperson, data]) => {
    const totalCalls = data.transactions;
    const effectivelyCoveredOutlets = data.customers.size;
    const coverageRate = totalCalls > 0 ? (effectivelyCoveredOutlets / totalCalls) * 100 : 0;
    const callsPerDay = daysInPeriod > 0 ? totalCalls / daysInPeriod : 0;
    
    return {
      totalCalls,
      effectivelyCoveredOutlets,
      coverageRate,
      callsPerDay,
      salespersonName: salesperson,
      territory: data.territory,
      period: `${timeRange.startDate} to ${timeRange.endDate}`
    };
  });
};

export const calculateProductLinePerformance = (
  salesData: SalesData[],
  inventoryData: InventoryData[],
  timeRange: { startDate: string; endDate: string }
): ProductLinePerformance[] => {
  const filteredSales = filterSalesByDateRange(salesData, timeRange);
  
  // Group sales by product
  const productSales = filteredSales.reduce((acc, sale) => {
    const productCode = sale.k_sc_codigo_articulo;
    if (!acc[productCode]) {
      acc[productCode] = {
        productName: sale.sc_detalle_articulo,
        brand: sale.MARCA,
        category: sale.sc_detalle_grupo,
        transactions: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        customers: new Set(),
        crossSellProducts: new Set()
      };
    }
    acc[productCode].transactions++;
    acc[productCode].totalQuantity += sale.n_cantidad;
    acc[productCode].totalRevenue += sale['V. NETA'];
    acc[productCode].customers.add(sale.sc_nombre);
    
    // Track cross-selling opportunities
    const sameTransactionSales = filteredSales.filter(s => 
      s.n_numero_documento === sale.n_numero_documento && 
      s.k_sc_codigo_articulo !== productCode
    );
    sameTransactionSales.forEach(s => acc[productCode].crossSellProducts.add(s.k_sc_codigo_articulo));
    
    return acc;
  }, {} as Record<string, any>);
  
  // Calculate performance metrics
  return Object.entries(productSales).map(([productCode, data]) => {
    const inventoryItem = inventoryData.find(inv => inv.k_sc_codigo_articulo === productCode);
    const cost = inventoryItem?.n_costo_promedio || 0;
    const totalCost = data.totalQuantity * cost;
    const margin = data.totalRevenue > 0 ? ((data.totalRevenue - totalCost) / data.totalRevenue) * 100 : 0;
    
    // Lines per call (average products per transaction)
    const linesPerCall = data.transactions > 0 ? data.totalQuantity / data.transactions : 0;
    
    // Cross-selling success (percentage of transactions with multiple products)
    const crossSellingSuccess = data.transactions > 0 ? (data.crossSellProducts.size / data.transactions) * 100 : 0;
    
    // Category penetration (percentage of customers buying this category)
    const totalCustomers = new Set(filteredSales.map(s => s.sc_nombre)).size;
    const categoryPenetration = totalCustomers > 0 ? (data.customers.size / totalCustomers) * 100 : 0;
    
    // SKU velocity (sales per day)
    const daysInPeriod = calculateDaysBetween(timeRange.startDate, timeRange.endDate);
    const skuVelocity = daysInPeriod > 0 ? data.totalQuantity / daysInPeriod : 0;
    
    return {
      productCode,
      productName: data.productName,
      linesPerCall,
      crossSellingSuccess,
      categoryPenetration,
      skuVelocity,
      skuMargin: margin,
      brand: data.brand,
      category: data.category
    };
  });
};

export const calculateCustomerAnalytics = (
  salesData: SalesData[],
  timeRange: { startDate: string; endDate: string }
): CustomerAnalytics[] => {
  const customerData: Record<string, {
    transactions: SalesData[];
    totalRevenue: number;
    cities: Set<string>;
    zones: Set<string>;
    territories: Set<string>;
    lastPurchaseDate: string;
  }> = {};

  // Calculate customer metrics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Group sales by customer
  salesData.forEach(sale => {
    const customerName = sale.sc_nombre || 'Unknown Customer';
    
    if (!customerData[customerName]) {
      customerData[customerName] = {
        transactions: [],
        totalRevenue: 0,
        cities: new Set(),
        zones: new Set(),
        territories: new Set(),
        lastPurchaseDate: sale.d_fecha_documento
      };
    }
    
    customerData[customerName].transactions.push(sale);
    customerData[customerName].totalRevenue += sale['V. NETA'];
    // Note: using placeholder for city since 'ciudad' doesn't exist in SalesData
    customerData[customerName].cities.add('Unknown City');
    customerData[customerName].territories.add('Unknown Territory');
    customerData[customerName].zones.add('Unknown Zone');
    
    // Update last purchase date
    if (sale.d_fecha_documento > customerData[customerName].lastPurchaseDate) {
      customerData[customerName].lastPurchaseDate = sale.d_fecha_documento;
    }
  });
  
  return Object.entries(customerData).map(([customerName, data]) => {
    const averageBasketSize = data.transactions.length > 0 ? data.totalRevenue / data.transactions.length : 0;
    const purchaseFrequency = data.transactions.length;
    
    // Determine customer segment based on revenue
    let customerSegment: CustomerAnalytics['customerSegment'] = 'END_CONSUMER';
    if (data.totalRevenue > 100000) {
      customerSegment = 'B2B_DISTRIBUTOR';
    } else if (data.totalRevenue > 50000) {
      customerSegment = 'WHOLESALER';
    } else if (data.totalRevenue > 10000) {
      customerSegment = 'RETAILER';
    }
    
    const paymentTerms: CustomerAnalytics['paymentTerms'] = 
      data.totalRevenue > 50000 ? 'CREDIT_60' : 'CASH';
    
    const profitability = data.totalRevenue * 0.15; // Assumed 15% profit margin
    const lastPurchase = new Date(data.lastPurchaseDate);
    const riskScore = lastPurchase < thirtyDaysAgo ? 75 : 25;

    return {
      customerId: customerName.replace(/\s+/g, '-').toLowerCase(),
      customerName,
      averageBasketSize,
      customerSegment,
      geographicZone: Array.from(data.zones).join(', ') || 'Unknown',
      city: Array.from(data.cities).join(', ') || 'Unknown',
      paymentTerms,
      profitability,
      purchaseFrequency,
      totalRevenue: data.totalRevenue,
      lastPurchaseDate: data.lastPurchaseDate,
      riskScore
    };
  });
};

export const generateBusinessIntelligenceAlerts = (
  salesData: SalesData[],
  inventoryData: InventoryData[],
  kpis: SalesKPIs,
  timeRange: { startDate: string; endDate: string }
): BusinessIntelligenceAlert[] => {
  const alerts: BusinessIntelligenceAlert[] = [];
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Revenue variance alert
  if (kpis.totalRevenue && kpis.monthlyRevenueGrowth < -10) {
    alerts.push({
      id: `revenue-${Date.now()}`,
      type: 'REVENUE_VARIANCE',
      severity: kpis.monthlyRevenueGrowth > 20 ? 'HIGH' : 'MEDIUM',
      title: 'Revenue Variance Detected',
      description: `Revenue growth of ${kpis.monthlyRevenueGrowth.toFixed(1)}% exceeds threshold`,
      affectedEntity: 'Overall Business',
      currentValue: kpis.monthlyRevenueGrowth,
      thresholdValue: 10,
      variance: kpis.monthlyRevenueGrowth - 10,
      recommendation: 'Investigate growth drivers and ensure sustainable practices',
      timestamp: currentDate.toISOString(),
      isAcknowledged: false,
      actionRequired: 'Review sales strategy and market conditions'
    });
  }
  
  // Customer churn risk (no orders in 30+ days)
  const recentCustomers = new Set(
    salesData
      .filter(sale => new Date(sale.d_fecha_documento) >= thirtyDaysAgo)
      .map(sale => sale.sc_nombre)
  );
  
  const allCustomers = new Set(salesData.map(sale => sale.sc_nombre));
  const churnedCustomers = Array.from(allCustomers).filter(customer => !recentCustomers.has(customer));
  
  if (churnedCustomers.length > 0) {
    alerts.push({
      id: `churn-${Date.now()}`,
      type: 'CUSTOMER_CHURN',
      severity: churnedCustomers.length > 10 ? 'HIGH' : 'MEDIUM',
      title: 'Customer Churn Risk Detected',
      description: `${churnedCustomers.length} customers haven't placed orders in 30+ days`,
      affectedEntity: 'Customer Base',
      currentValue: churnedCustomers.length,
      thresholdValue: 5,
      variance: churnedCustomers.length - 5,
      recommendation: 'Implement customer retention strategies and outreach programs',
      timestamp: currentDate.toISOString(),
      isAcknowledged: false,
      actionRequired: 'Contact at-risk customers and analyze churn reasons'
    });
  }
  
  // Inventory carrying cost alert
  const totalInventoryValue = inventoryData.reduce((sum, inv) => 
    sum + (inv.n_saldo_actual * inv.n_costo_promedio), 0
  );
  const carryingCostThreshold = kpis.totalRevenue * 0.15; // 15% of revenue
  
  if (totalInventoryValue > carryingCostThreshold) {
    alerts.push({
      id: `inventory-cost-${Date.now()}`,
      type: 'INVENTORY_COST',
      severity: 'HIGH',
      title: 'High Inventory Carrying Costs',
      description: `Inventory value of $${totalInventoryValue.toLocaleString()} exceeds recommended threshold`,
      affectedEntity: 'Inventory Management',
      currentValue: totalInventoryValue,
      thresholdValue: carryingCostThreshold,
      variance: totalInventoryValue - carryingCostThreshold,
      recommendation: 'Review inventory levels and implement reduction strategies',
      timestamp: currentDate.toISOString(),
      isAcknowledged: false,
      actionRequired: 'Analyze slow-moving items and optimize stock levels'
    });
  }
  
  // Margin compression alert
  if (kpis.grossMargin < 20) {
    alerts.push({
      id: `margin-${Date.now()}`,
      type: 'MARGIN_COMPRESSION',
      severity: 'CRITICAL',
      title: 'Margin Compression Detected',
      description: `Gross margin of ${kpis.grossMargin.toFixed(1)}% is below target`,
      affectedEntity: 'Pricing Strategy',
      currentValue: kpis.grossMargin,
      thresholdValue: 20,
      variance: kpis.grossMargin - 20,
      recommendation: 'Review pricing strategy and cost structure',
      timestamp: currentDate.toISOString(),
      isAcknowledged: false,
      actionRequired: 'Analyze pricing and negotiate better supplier terms'
    });
  }
  
  // Out of stock alerts
  const outOfStockProducts = inventoryData.filter(inv => inv.n_saldo_actual === 0);
  if (outOfStockProducts.length > 0) {
    alerts.push({
      id: `stockout-${Date.now()}`,
      type: 'STOCKOUT',
      severity: outOfStockProducts.length > 5 ? 'HIGH' : 'MEDIUM',
      title: 'Out of Stock Products',
      description: `${outOfStockProducts.length} products are out of stock`,
      affectedEntity: 'Inventory',
      currentValue: outOfStockProducts.length,
      thresholdValue: 0,
      variance: outOfStockProducts.length,
      recommendation: 'Prioritize restocking based on sales velocity',
      timestamp: currentDate.toISOString(),
      isAcknowledged: false,
      actionRequired: 'Create purchase orders for critical items'
    });
  }
  
  return alerts;
};

export const validateSalesData = (
  salesData: SalesData[],
  accountingTotal?: number
): SalesValidationResult => {
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale['V. NETA'], 0);
  
  // Accounting reconciliation
  const accountingReconciliation = {
    totalRevenue,
    accountingTotal: accountingTotal || totalRevenue,
    variance: Math.abs(totalRevenue - (accountingTotal || totalRevenue)),
    isReconciled: accountingTotal ? Math.abs(totalRevenue - accountingTotal) < 100 : true // $100 tolerance
  };
  
  // Data integrity checks
  const missingRecords = salesData.filter(sale => !sale.k_sc_codigo_articulo || !sale.sc_nombre).length;
  const duplicateRecords = salesData.length - new Set(salesData.map(s => `${s.n_numero_documento}-${s.k_sc_codigo_articulo}`)).size;
  const invalidDates = salesData.filter(sale => !isValidDate(sale.d_fecha_documento)).length;
  
  const dataIntegrity = {
    missingRecords,
    duplicateRecords,
    invalidDates,
    isIntegrityValid: missingRecords === 0 && duplicateRecords === 0 && invalidDates === 0
  };
  
  // Calculation logic validation
  const revenueCalculations = salesData.every(sale => sale['V. NETA'] >= 0);
  const marginCalculations = salesData.every(sale => {
    const margin = sale['V. NETA'] > 0 ? ((sale['V. NETA'] - sale.n_valor) / sale['V. NETA']) * 100 : 0;
    return margin >= -100 && margin <= 100; // Reasonable margin range
  });
  const kpiCalculations = totalRevenue >= 0 && totalRevenue < 1000000000; // Reasonable revenue range
  
  const calculationLogic = {
    revenueCalculations,
    marginCalculations,
    kpiCalculations,
    isLogicValid: revenueCalculations && marginCalculations && kpiCalculations
  };
  
  return {
    accountingReconciliation,
    dataIntegrity,
    calculationLogic,
    overallValidation: accountingReconciliation.isReconciled && dataIntegrity.isIntegrityValid && calculationLogic.isLogicValid,
    validationDate: new Date().toISOString(),
    validatedBy: 'System'
  };
};

export const generateExecutiveSummary = (
  salesData: SalesData[],
  kpis: SalesKPIs,
  alerts: BusinessIntelligenceAlert[],
  timeRange: { startDate: string; endDate: string }
): ExecutiveSummary => {
  // Calculate trends (simplified - would need historical data for real trends)
  const revenueTrend = {
    current: kpis.totalRevenue,
    previous: kpis.totalRevenue * 0.95, // Assumed 5% growth
    growth: 5,
    trend: 'UP' as const
  };
  
  const marginTrend = {
    current: kpis.grossMargin,
    previous: kpis.grossMargin + 2, // Assumed 2% decline
    change: -2
  };
  
  // Get top products by revenue
  const productRevenue = salesData.reduce((acc, sale) => {
    acc[sale.k_sc_codigo_articulo] = (acc[sale.k_sc_codigo_articulo] || 0) + sale['V. NETA'];
    return acc;
  }, {} as Record<string, number>);
  
  const topProducts = Object.entries(productRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([productCode, revenue]) => {
      const sale = salesData.find(s => s.k_sc_codigo_articulo === productCode);
      return {
        productCode,
        productName: sale?.sc_detalle_articulo || 'Unknown',
        revenue,
        margin: 25, // Assumed margin
        growth: 10 // Assumed growth
      };
    });
  
  // Get critical alerts
  const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL' || alert.severity === 'HIGH');
  
  // Key trends
  const keyTrends = [
    {
      metric: 'Revenue Growth',
      value: revenueTrend.growth,
      change: revenueTrend.growth,
      trend: 'UP' as const
    },
    {
      metric: 'Customer Acquisition',
      value: kpis.customerAcquisitionCost,
      change: -5,
      trend: 'DOWN' as const
    },
    {
      metric: 'Inventory Turnover',
      value: kpis.inventoryTurnover,
      change: 0.2,
      trend: 'UP' as const
    }
  ];
  
  return {
    period: `${timeRange.startDate} to ${timeRange.endDate}`,
    revenueTrend,
    marginTrend,
    topProducts,
    criticalAlerts,
    keyTrends
  };
};

// Helper functions
const filterSalesByDateRange = (salesData: SalesData[], timeRange: { startDate: string; endDate: string }): SalesData[] => {
  const startDate = new Date(timeRange.startDate);
  const endDate = new Date(timeRange.endDate);
  
  return salesData.filter(sale => {
    const saleDate = new Date(sale.d_fecha_documento);
    return saleDate >= startDate && saleDate <= endDate;
  });
};

const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}; 