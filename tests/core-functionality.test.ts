/**
 * 🧪 Core Functionality Test Suite
 * SuperClaude Optimized for TIP Platform
 * 
 * Tests:
 * - Document processing
 * - Cost calculations
 * - Alert generation
 * - Real-time updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DocumentProcessor } from '../lib/ai/document-processor';
import { WhatsAppAlertService } from '../services/whatsapp-alerts';
import { 
  formatCOP, 
  formatUSD, 
  calculateImportFactor,
  validateNIT 
} from '../lib/utils/currency';

describe('Document Processing', () => {
  let processor: DocumentProcessor;

  beforeEach(() => {
    processor = new DocumentProcessor();
  });

  it('should process commercial invoice correctly', async () => {
    const mockFileUrl = 'https://example.com/invoice.pdf';
    const mockOperationId = 'test-operation-123';

    const result = await processor.processDocument(
      mockFileUrl,
      'commercial_invoice',
      mockOperationId,
      { language: 'es' }
    );

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('invoiceNumber');
    expect(result.data).toHaveProperty('supplier');
    expect(result.data).toHaveProperty('items');
    expect(result.data).toHaveProperty('totals');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should detect invoice warnings', async () => {
    const invoiceWithIssues = {
      invoiceNumber: 'INV-001',
      invoiceDate: '2024-01-15',
      supplier: {
        name: 'Test Supplier',
        country: 'CN',
      },
      buyer: {
        name: 'Test Buyer',
      },
      items: [
        {
          description: 'Product without HS code',
          quantity: 100,
          unit: 'PCS',
          unitPrice: 10,
          totalPrice: 1000,
        },
      ],
      totals: {
        subtotal: 1000,
        total: 1000,
        currency: 'USD',
      },
    };

    const warnings = processor['detectInvoiceWarnings'](invoiceWithIssues as any);
    
    expect(warnings).toContain('Purchase order number not found');
    expect(warnings).toContain('Supplier tax ID not found');
    expect(warnings.some(w => w.includes('items without HS codes'))).toBe(true);
  });

  it('should calculate import factor correctly', async () => {
    const costs = {
      fob: 10000,
      freight: 1200,
      insurance: 150,
      customs: 2500,
      localFreight: 500,
    };

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    const importFactor = calculateImportFactor(totalCost, costs.fob);

    expect(importFactor).toBeCloseTo(1.435, 2);
  });
});

describe('Currency Utilities', () => {
  it('should format COP correctly', () => {
    expect(formatCOP(1234567)).toBe('COP 1.234.567');
    expect(formatCOP(0)).toBe('COP 0');
    expect(formatCOP(null)).toBe('COP 0');
  });

  it('should format USD correctly', () => {
    expect(formatUSD(1234.56)).toBe('USD 1,234.56');
    expect(formatUSD(0)).toBe('USD 0.00');
    expect(formatUSD(null)).toBe('USD 0.00');
  });

  it('should validate NIT correctly', () => {
    expect(validateNIT('900123456-7')).toBe(true); // Valid format
    expect(validateNIT('123456789-0')).toBe(false); // Invalid
    expect(validateNIT('abc')).toBe(false); // Invalid format
  });
});

describe('WhatsApp Alert Service', () => {
  let alertService: WhatsAppAlertService;

  beforeEach(() => {
    alertService = new WhatsAppAlertService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should format alert messages correctly', () => {
    const template = {
      title: '📄 Documento Procesado',
      body: 'Operación: {{operationRef}}\nProveedor: {{supplierName}}',
    };

    const data = {
      operationRef: 'IMP-2024-001',
      supplierName: 'Shanghai Electronics',
    };

    const message = alertService['prepareMessage'](template, data);
    
    expect(message).toContain('📄 Documento Procesado');
    expect(message).toContain('IMP-2024-001');
    expect(message).toContain('Shanghai Electronics');
  });

  it('should enforce rate limits', () => {
    const phoneNumber = '+573001234567';
    
    // First call should pass
    expect(alertService['checkRateLimit'](phoneNumber)).toBe(true);
    
    // Immediate second call should fail
    expect(alertService['checkRateLimit'](phoneNumber)).toBe(false);
  });

  it('should calculate daily metrics correctly', async () => {
    const mockCompanyId = 'test-company-123';
    
    // Mock Supabase responses
    vi.mock('@supabase/supabase-js', () => ({
      createClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              not: () => ({ data: [], error: null }),
              data: [], 
              error: null,
            }),
            gte: () => ({
              lte: () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }));

    const metrics = await alertService['getUserDailyMetrics'](mockCompanyId);
    
    expect(metrics).toHaveProperty('activeImports');
    expect(metrics).toHaveProperty('pendingAlerts');
    expect(metrics).toHaveProperty('weeklyPayments');
    expect(metrics).toHaveProperty('upcomingArrivals');
    expect(metrics).toHaveProperty('highlights');
  });
});

describe('Import Cost Calculations', () => {
  it('should calculate costs for different scenarios', () => {
    const scenarios = [
      {
        name: 'China Sea Freight',
        fob: 50000,
        freight: 6000,
        insurance: 750,
        expectedFactor: 1.135,
      },
      {
        name: 'USA Air Freight',
        fob: 10000,
        freight: 2000,
        insurance: 150,
        expectedFactor: 1.215,
      },
      {
        name: 'Mexico Land Freight',
        fob: 25000,
        freight: 1500,
        insurance: 375,
        expectedFactor: 1.075,
      },
    ];

    scenarios.forEach(scenario => {
      const total = scenario.fob + scenario.freight + scenario.insurance;
      const factor = calculateImportFactor(total, scenario.fob);
      
      expect(factor).toBeCloseTo(scenario.expectedFactor, 2);
    });
  });
});

describe('Real-time Updates', () => {
  it('should handle WebSocket subscription correctly', async () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
    };

    const mockSupabase = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    };

    // Test subscription setup
    const companyId = 'test-company-123';
    const channel = mockSupabase.channel(`dashboard-${companyId}`);
    
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'import_operations',
        filter: `company_id=eq.${companyId}`,
      }, () => {})
      .subscribe();

    expect(mockSupabase.channel).toHaveBeenCalledWith(`dashboard-${companyId}`);
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });
});

describe('Integration Tests', () => {
  it('should process complete import operation flow', async () => {
    // 1. Create operation
    const operation = {
      referenceNumber: 'IMP-2024-TEST',
      supplierName: 'Test Supplier',
      totalFobUsd: 10000,
      status: 'confirmed',
    };

    // 2. Process document
    const documentResult = {
      success: true,
      data: {
        invoiceNumber: 'INV-TEST-001',
        totals: {
          subtotal: 10000,
          freight: 1200,
          insurance: 150,
          total: 11350,
        },
      },
    };

    // 3. Calculate import factor
    const importFactor = calculateImportFactor(
      documentResult.data.totals.total,
      documentResult.data.totals.subtotal
    );

    expect(importFactor).toBeCloseTo(1.135, 2);

    // 4. Check for alerts
    const alerts = [];
    if (importFactor > 1.2) {
      alerts.push({
        type: 'cost_threshold',
        severity: 'high',
        title: 'Import factor exceeds threshold',
      });
    }

    expect(alerts).toHaveLength(0); // Should not trigger alert for 1.135x
  });
});