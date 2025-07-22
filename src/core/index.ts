// Core Analytics Engine - Main Export
// This module provides a complete, modular analytics solution following SOLID principles

// Core types and engine
export * from './types';
export { CoreAnalyticsEngine } from './engine';

// Supply Chain specific components
export * from './supply-chain/types';
export * from './supply-chain/processors';
export * from './supply-chain/calculators';
export * from './supply-chain/alerters';
export { SupplyChainAnalyticsFactory } from './supply-chain/factory';

// Re-export commonly used types for convenience
export type {
  AnalyticsEngine,
  AnalyticsConfig,
  DataProcessor,
  Calculator,
  Alerter,
  ProcessedData,
  ValidationResult,
  MetricResult,
  Alert,
  AnalyticsResults
} from './types';

export type {
  InventoryRecord,
  SalesRecord,
  ProcessedProduct,
  SupplyChainMetrics,
  SupplyChainAlert,
  ProcurementRecommendation,
  StockEfficiencyData,
  SupplyChainConfig,
  SupplyChainAnalyticsModule
} from './supply-chain/types';

// Default exports for easy importing
export { SupplyChainAnalyticsFactory as default } from './supply-chain/factory'; 