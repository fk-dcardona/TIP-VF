import type { AnalyticsConfig, AnalyticsModule } from '../types';
import type { SupplyChainConfig, SupplyChainAnalyticsModule } from './types';
import { CoreAnalyticsEngine } from '../engine';

// Import processors
import { InventoryDataProcessor, SalesDataProcessor } from './processors';

// Import calculators
import {
  SupplyChainHealthCalculator,
  TotalRevenueCalculator,
  CriticalAlertsCalculator,
  AverageGrossMarginCalculator,
  InventoryTurnoverCalculator,
  DaysInInventoryCalculator,
  InventoryCarryingCostCalculator,
  StockStatusDistributionCalculator,
  ProductPerformanceCalculator,
  CashFlowImpactCalculator
} from './calculators';

// Import alerters
import {
  OutOfStockAlerter,
  LowStockAlerter,
  OverstockAlerter,
  SlowMovingInventoryAlerter,
  MarginCompressionAlerter,
  DiscontinuedProductAlerter,
  HighValueProductAlerter,
  LeadTimeRiskAlerter,
  SeasonalDemandAlerter,
  SupplierRiskAlerter,
  CashFlowImpactAlerter
} from './alerters';

/**
 * Supply Chain Analytics Factory
 * Creates a complete supply chain analytics module with all components
 */
export class SupplyChainAnalyticsFactory {
  /**
   * Create default supply chain configuration
   */
  static createDefaultConfig(): SupplyChainConfig {
    return {
      leadTimeConfig: {
        'PAÑITOS': 7,
        'DETERGENTE': 10,
        'default': 14
      },
      safetyStockMultiplier: 0.5,
      alertThresholds: {
        lowStockDays: 7,
        overstockDays: 90,
        discontinuedMonths: 3
      },
      calculationParams: {
        defaultTimeRange: 30, // days
        marginThreshold: 15,
        turnoverThreshold: 6
      }
    };
  }

  /**
   * Create default analytics configuration
   */
  static createDefaultAnalyticsConfig(): AnalyticsConfig {
    return {
      dataSources: [
        {
          id: 'inventory',
          name: 'Inventory Data',
          type: 'csv',
          schema: {
            k_sc_codigo_articulo: 'string',
            sc_detalle_articulo: 'string',
            sc_detalle_grupo: 'string',
            sc_detalle_subgrupo: 'string',
            period: 'date',
            n_saldo_anterior: 'number',
            n_entradas: 'number',
            n_salidas: 'number',
            n_saldo_actual: 'number',
            n_costo_promedio: 'number',
            n_ultimo_costo: 'number',
            sc_tipo_unidad: 'string'
          }
        },
        {
          id: 'sales',
          name: 'Sales Data',
          type: 'csv',
          schema: {
            k_sc_codigo_fuente: 'string',
            n_numero_documento: 'number',
            ka_nl_movimiento: 'string',
            d_fecha_documento: 'date',
            sc_nombre: 'string',
            n_nit: 'number',
            sc_telefono_ppal: 'string',
            sc_telefono_alterno: 'string',
            sc_nombre_fuente: 'string',
            marca: 'string',
            k_sc_codigo_articulo: 'string',
            sc_detalle_articulo: 'string',
            n_cantidad: 'number',
            n_valor: 'number',
            v_bruta: 'number',
            n_iva: 'number',
            n_descuento: 'number',
            descuento: 'number',
            v_neta: 'number',
            sc_detalle_grupo: 'string',
            sc_signo_inventario: 'string',
            zona: 'string',
            ka_nl_tercero: 'string',
            nombre_vendedor: 'string'
          }
        }
      ],
      calculations: [
        {
          id: 'supply-chain-health',
          name: 'Supply Chain Health Score',
          type: 'kpi',
          formula: 'health_score = (normal_stock / total_products) * 100 - overstock_penalty + margin_bonus',
          inputs: ['stock_status', 'margin'],
          outputs: ['health_score']
        },
        {
          id: 'total-revenue',
          name: 'Total Revenue',
          type: 'metric',
          formula: 'total_revenue = sum(product_revenue)',
          inputs: ['revenue'],
          outputs: ['total_revenue']
        },
        {
          id: 'critical-alerts',
          name: 'Critical Alerts',
          type: 'metric',
          formula: 'critical_alerts = count(out_of_stock + low_stock)',
          inputs: ['stock_status'],
          outputs: ['alert_count']
        },
        {
          id: 'avg-gross-margin',
          name: 'Average Gross Margin',
          type: 'metric',
          formula: 'avg_margin = average(product_margin)',
          inputs: ['margin'],
          outputs: ['avg_margin']
        }
      ],
      alerts: [
        {
          id: 'out-of-stock',
          name: 'Out of Stock Alert',
          type: 'threshold',
          condition: 'stock_status == "OUT_OF_STOCK"',
          severity: 'critical',
          message: 'Product is out of stock',
          actions: ['Create emergency purchase order', 'Check supplier availability']
        },
        {
          id: 'low-stock',
          name: 'Low Stock Alert',
          type: 'threshold',
          condition: 'stock_status == "LOW_STOCK"',
          severity: 'high',
          message: 'Product is below minimum stock level',
          actions: ['Schedule purchase order', 'Review lead time']
        },
        {
          id: 'overstock',
          name: 'Overstock Alert',
          type: 'threshold',
          condition: 'stock_status == "OVERSTOCK"',
          severity: 'medium',
          message: 'Product has excess inventory',
          actions: ['Consider promotional pricing', 'Review ordering frequency']
        },
        {
          id: 'slow-moving',
          name: 'Slow Moving Inventory',
          type: 'threshold',
          condition: 'turnover_rate < 2',
          severity: 'low',
          message: 'Product has low turnover rate',
          actions: ['Review pricing strategy', 'Consider discontinuation'],
          value: 2
        },
        {
          id: 'margin-compression',
          name: 'Margin Compression',
          type: 'threshold',
          condition: 'margin < 10',
          severity: 'medium',
          message: 'Product has low margin',
          actions: ['Review pricing', 'Negotiate with suppliers'],
          value: 10
        }
      ],
      timeRanges: [
        { id: '7d', label: '7 days', days: 7 },
        { id: '30d', label: '30 days', days: 30, default: true },
        { id: '90d', label: '90 days', days: 90 },
        { id: '6m', label: '6 months', days: 180 },
        { id: '1y', label: '1 year', days: 365 }
      ]
    };
  }

  /**
   * Create a complete supply chain analytics module
   */
  static createSupplyChainAnalytics(
    config?: Partial<SupplyChainConfig>
  ): SupplyChainAnalyticsModule {
    const supplyChainConfig = { ...this.createDefaultConfig(), ...config };
    const analyticsConfig = this.createDefaultAnalyticsConfig();

    // Create the core analytics engine
    const engine = new CoreAnalyticsEngine(analyticsConfig);

    // Register processors
    engine.registerProcessor('inventory', new InventoryDataProcessor());
    engine.registerProcessor('sales', new SalesDataProcessor());

    // Register calculators
    engine.registerCalculator('supply-chain-health', new SupplyChainHealthCalculator());
    engine.registerCalculator('total-revenue', new TotalRevenueCalculator());
    engine.registerCalculator('critical-alerts', new CriticalAlertsCalculator());
    engine.registerCalculator('avg-gross-margin', new AverageGrossMarginCalculator());
    engine.registerCalculator('inventory-turnover', new InventoryTurnoverCalculator());
    engine.registerCalculator('days-in-inventory', new DaysInInventoryCalculator());
    engine.registerCalculator('inventory-carrying-cost', new InventoryCarryingCostCalculator());
    engine.registerCalculator('stock-status-distribution', new StockStatusDistributionCalculator());
    engine.registerCalculator('product-performance', new ProductPerformanceCalculator());
    engine.registerCalculator('cash-flow-impact', new CashFlowImpactCalculator());

    // Register alerters
    engine.registerAlerter('out-of-stock', new OutOfStockAlerter());
    engine.registerAlerter('low-stock', new LowStockAlerter());
    engine.registerAlerter('overstock', new OverstockAlerter());
    engine.registerAlerter('slow-moving', new SlowMovingInventoryAlerter());
    engine.registerAlerter('margin-compression', new MarginCompressionAlerter());
    engine.registerAlerter('discontinued', new DiscontinuedProductAlerter());
    engine.registerAlerter('high-value', new HighValueProductAlerter());
    engine.registerAlerter('lead-time-risk', new LeadTimeRiskAlerter());
    engine.registerAlerter('seasonal-demand', new SeasonalDemandAlerter());
    engine.registerAlerter('supplier-risk', new SupplierRiskAlerter());
    engine.registerAlerter('cash-flow-impact', new CashFlowImpactAlerter());

    return {
      engine,
      config: supplyChainConfig,
      types: {
        InventoryRecord: {} as any,
        SalesRecord: {} as any,
        ProcessedProduct: {} as any,
        SupplyChainMetrics: {} as any,
        SupplyChainAlert: {} as any,
        ProcurementRecommendation: {} as any,
        StockEfficiencyData: {} as any,
        SupplyChainTimeSeries: {} as any,
        SupplyChainConfig: {} as any,
        SupplyChainAnalyticsResults: {} as any,
        SupplyChainValidationResult: {} as any
      }
    };
  }

  /**
   * Create a minimal supply chain analytics module for basic functionality
   */
  static createMinimalSupplyChainAnalytics(): SupplyChainAnalyticsModule {
    const analyticsConfig: AnalyticsConfig = {
      dataSources: [
        {
          id: 'inventory',
          name: 'Inventory Data',
          type: 'csv',
          schema: {
            k_sc_codigo_articulo: 'string',
            sc_detalle_articulo: 'string',
            sc_detalle_grupo: 'string',
            n_saldo_actual: 'number',
            n_costo_promedio: 'number'
          }
        },
        {
          id: 'sales',
          name: 'Sales Data',
          type: 'csv',
          schema: {
            k_sc_codigo_articulo: 'string',
            d_fecha_documento: 'date',
            n_cantidad: 'number',
            v_neta: 'number'
          }
        }
      ],
      calculations: [
        {
          id: 'supply-chain-health',
          name: 'Supply Chain Health Score',
          type: 'kpi',
          formula: 'health_score = (normal_stock / total_products) * 100',
          inputs: ['stock_status'],
          outputs: ['health_score']
        }
      ],
      alerts: [
        {
          id: 'out-of-stock',
          name: 'Out of Stock Alert',
          type: 'threshold',
          condition: 'stock_status == "OUT_OF_STOCK"',
          severity: 'critical',
          message: 'Product is out of stock',
          actions: ['Create emergency purchase order']
        }
      ],
      timeRanges: [
        { id: '30d', label: '30 days', days: 30, default: true }
      ]
    };

    const engine = new CoreAnalyticsEngine(analyticsConfig);

    // Register minimal processors
    engine.registerProcessor('inventory', new InventoryDataProcessor());
    engine.registerProcessor('sales', new SalesDataProcessor());

    // Register minimal calculators
    engine.registerCalculator('supply-chain-health', new SupplyChainHealthCalculator());

    // Register minimal alerters
    engine.registerAlerter('out-of-stock', new OutOfStockAlerter());

    return {
      engine,
      config: this.createDefaultConfig(),
      types: {
        InventoryRecord: {} as any,
        SalesRecord: {} as any,
        ProcessedProduct: {} as any,
        SupplyChainMetrics: {} as any,
        SupplyChainAlert: {} as any,
        ProcurementRecommendation: {} as any,
        StockEfficiencyData: {} as any,
        SupplyChainTimeSeries: {} as any,
        SupplyChainConfig: {} as any,
        SupplyChainAnalyticsResults: {} as any,
        SupplyChainValidationResult: {} as any
      }
    };
  }

  /**
   * Create a custom supply chain analytics module with specific components
   */
  static createCustomSupplyChainAnalytics(options: {
    processors?: string[];
    calculators?: string[];
    alerters?: string[];
    config?: Partial<SupplyChainConfig>;
  }): SupplyChainAnalyticsModule {
    const supplyChainConfig = { ...this.createDefaultConfig(), ...options.config };
    const analyticsConfig = this.createDefaultAnalyticsConfig();

    const engine = new CoreAnalyticsEngine(analyticsConfig);

    // Register requested processors
    if (options.processors?.includes('inventory')) {
      engine.registerProcessor('inventory', new InventoryDataProcessor());
    }
    if (options.processors?.includes('sales')) {
      engine.registerProcessor('sales', new SalesDataProcessor());
    }

    // Register requested calculators
    const calculatorMap = {
      'supply-chain-health': new SupplyChainHealthCalculator(),
      'total-revenue': new TotalRevenueCalculator(),
      'critical-alerts': new CriticalAlertsCalculator(),
      'avg-gross-margin': new AverageGrossMarginCalculator(),
      'inventory-turnover': new InventoryTurnoverCalculator(),
      'days-in-inventory': new DaysInInventoryCalculator(),
      'inventory-carrying-cost': new InventoryCarryingCostCalculator(),
      'stock-status-distribution': new StockStatusDistributionCalculator(),
      'product-performance': new ProductPerformanceCalculator(),
      'cash-flow-impact': new CashFlowImpactCalculator()
    };

    options.calculators?.forEach(calcId => {
      const calculator = calculatorMap[calcId as keyof typeof calculatorMap];
      if (calculator) {
        engine.registerCalculator(calcId, calculator);
      }
    });

    // Register requested alerters
    const alerterMap = {
      'out-of-stock': new OutOfStockAlerter(),
      'low-stock': new LowStockAlerter(),
      'overstock': new OverstockAlerter(),
      'slow-moving': new SlowMovingInventoryAlerter(),
      'margin-compression': new MarginCompressionAlerter(),
      'discontinued': new DiscontinuedProductAlerter(),
      'high-value': new HighValueProductAlerter(),
      'lead-time-risk': new LeadTimeRiskAlerter(),
      'seasonal-demand': new SeasonalDemandAlerter(),
      'supplier-risk': new SupplierRiskAlerter(),
      'cash-flow-impact': new CashFlowImpactAlerter()
    };

    options.alerters?.forEach(alerterId => {
      const alerter = alerterMap[alerterId as keyof typeof alerterMap];
      if (alerter) {
        engine.registerAlerter(alerterId, alerter);
      }
    });

    return {
      engine,
      config: supplyChainConfig,
      types: {
        InventoryRecord: {} as any,
        SalesRecord: {} as any,
        ProcessedProduct: {} as any,
        SupplyChainMetrics: {} as any,
        SupplyChainAlert: {} as any,
        ProcurementRecommendation: {} as any,
        StockEfficiencyData: {} as any,
        SupplyChainTimeSeries: {} as any,
        SupplyChainConfig: {} as any,
        SupplyChainAnalyticsResults: {} as any,
        SupplyChainValidationResult: {} as any
      }
    };
  }
} 