/**
 * 🤖 AI Document Processor
 * SuperClaude Optimized for Import Documents
 * 
 * Features:
 * - Multi-language OCR (Spanish, English, Chinese)
 * - Smart field extraction with validation
 * - Import factor calculation
 * - Error recovery and retry logic
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { uploadToStorage, getStorageUrl } from '@/lib/storage';
import { logger } from '@/lib/logger';

// Initialize clients
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY!,
  maxRetries: 3,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Document schemas
const InvoiceSchema = z.object({
  // Header information
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  poNumber: z.string().optional(),
  
  // Supplier information
  supplier: z.object({
    name: z.string(),
    address: z.string().optional(),
    taxId: z.string().optional(),
    country: z.string().length(2), // ISO country code
    contactEmail: z.string().email().optional(),
  }),
  
  // Buyer information
  buyer: z.object({
    name: z.string(),
    address: z.string().optional(),
    taxId: z.string().optional(),
  }),
  
  // Line items
  items: z.array(z.object({
    lineNumber: z.number().optional(),
    productCode: z.string().optional(),
    description: z.string(),
    hsCode: z.string().optional(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
    totalPrice: z.number(),
  })),
  
  // Totals
  totals: z.object({
    subtotal: z.number(),
    discount: z.number().optional(),
    tax: z.number().optional(),
    freight: z.number().optional(),
    insurance: z.number().optional(),
    total: z.number(),
    currency: z.string().length(3), // ISO currency code
  }),
  
  // Shipping information
  shipping: z.object({
    method: z.enum(['sea', 'air', 'land', 'multimodal']).optional(),
    incoterm: z.string().optional(),
    originPort: z.string().optional(),
    destinationPort: z.string().optional(),
    estimatedDeparture: z.string().optional(),
    estimatedArrival: z.string().optional(),
  }).optional(),
});

const PackingListSchema = z.object({
  // Header
  packingListNumber: z.string(),
  date: z.string(),
  invoiceReference: z.string().optional(),
  
  // Packages
  packages: z.array(z.object({
    packageNumber: z.string(),
    packageType: z.string(), // Box, pallet, container, etc.
    items: z.array(z.object({
      productCode: z.string().optional(),
      description: z.string(),
      quantity: z.number(),
      unit: z.string(),
      netWeight: z.number().optional(),
      grossWeight: z.number().optional(),
    })),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
      unit: z.string(), // cm, m, in, ft
    }).optional(),
    netWeight: z.number(),
    grossWeight: z.number(),
    weightUnit: z.string(), // kg, lb
  })),
  
  // Totals
  totals: z.object({
    totalPackages: z.number(),
    totalNetWeight: z.number(),
    totalGrossWeight: z.number(),
    totalVolume: z.number().optional(),
  }),
});

// Document processor class
export class DocumentProcessor {
  private processingCache = new Map<string, any>();

  /**
   * Process any document type
   */
  async processDocument(
    fileUrl: string,
    documentType: string,
    operationId: string,
    options: {
      language?: string;
      retry?: boolean;
      enhanceImage?: boolean;
    } = {}
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Check cache
      const cacheKey = `${fileUrl}-${documentType}`;
      if (this.processingCache.has(cacheKey)) {
        logger.info('Returning cached result', { cacheKey });
        return this.processingCache.get(cacheKey);
      }

      // Process based on document type
      let result;
      switch (documentType) {
        case 'commercial_invoice':
          result = await this.processInvoice(fileUrl, options);
          break;
        case 'packing_list':
          result = await this.processPackingList(fileUrl, options);
          break;
        case 'bill_of_lading':
          result = await this.processBillOfLading(fileUrl, options);
          break;
        default:
          result = await this.processGenericDocument(fileUrl, options);
      }

      // Calculate processing metrics
      const processingTime = Date.now() - startTime;
      
      // Store in database
      await this.storeProcessingResult(operationId, documentType, result, processingTime);
      
      // Cache result
      this.processingCache.set(cacheKey, result);
      
      // Trigger post-processing
      await this.postProcessDocument(operationId, documentType, result);
      
      return {
        success: true,
        data: result.data,
        confidence: result.confidence,
        processingTime,
        warnings: (result as any).warnings || [],
      };
    } catch (error) {
      logger.error('Document processing failed', { error, fileUrl, documentType });
      
      // Retry logic
      if (options.retry !== false && !(error as Error).message?.includes('Rate limit')) {
        logger.info('Retrying document processing', { fileUrl });
        return this.processDocument(fileUrl, documentType, operationId, {
          ...options,
          retry: false,
          enhanceImage: true,
        });
      }
      
      throw error;
    }
  }

  /**
   * Process commercial invoice
   */
  private async processInvoice(fileUrl: string, options: any) {
    // Prepare prompt for GPT-4 Vision
    const prompt = this.buildInvoicePrompt(options.language || 'es');
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured data from commercial invoices. Extract all information accurately and return as JSON."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "image_url", 
              image_url: { 
                url: fileUrl,
                detail: "high"
              } 
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1, // Low temperature for consistency
    });

    // Parse and validate response
    const extractedData = JSON.parse(response.choices[0].message.content || '{}');
    const validatedData = InvoiceSchema.parse(extractedData);
    
    // Calculate confidence scores
    const confidence = this.calculateConfidence(extractedData, validatedData);
    
    return {
      data: validatedData,
      confidence,
      rawExtraction: extractedData,
      warnings: this.detectInvoiceWarnings(validatedData),
    };
  }

  /**
   * Process packing list
   */
  private async processPackingList(fileUrl: string, options: any) {
    const prompt = this.buildPackingListPrompt(options.language || 'es');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "Extract all packing list information including package details, weights, and dimensions. Return as structured JSON."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: fileUrl, detail: "high" } }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const extractedData = JSON.parse(response.choices[0].message.content || '{}');
    const validatedData = PackingListSchema.parse(extractedData);
    
    return {
      data: validatedData,
      confidence: this.calculateConfidence(extractedData, validatedData),
      warnings: this.detectPackingListWarnings(validatedData),
    };
  }

  /**
   * Process bill of lading
   */
  private async processBillOfLading(fileUrl: string, options: any) {
    // Similar implementation for B/L processing
    const prompt = `Extract all bill of lading information including:
    - B/L number and date
    - Shipper and consignee details
    - Vessel/voyage information
    - Port of loading and discharge
    - Container numbers
    - Description of goods
    - Freight terms
    Return as structured JSON.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: fileUrl, detail: "high" } }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    return {
      data: JSON.parse(response.choices[0].message.content || '{}'),
      confidence: 0.85, // Default confidence for B/L
    };
  }

  /**
   * Process generic document
   */
  private async processGenericDocument(fileUrl: string, options: any) {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Extract all text and structured information from this document. Identify document type and key data points."
            },
            { type: "image_url", image_url: { url: fileUrl } }
          ]
        }
      ],
      max_tokens: 4096,
    });

    return {
      data: {
        extractedText: response.choices[0].message.content,
        documentType: 'generic',
      },
      confidence: 0.7,
    };
  }

  /**
   * Build invoice extraction prompt
   */
  private buildInvoicePrompt(language: string): string {
    const prompts = {
      es: `Extrae la siguiente información de esta factura comercial:
        - Número y fecha de factura
        - Información del proveedor (nombre, dirección, país, ID fiscal)
        - Información del comprador
        - Lista de productos con códigos, descripciones, cantidades, precios unitarios y totales
        - Códigos arancelarios (HS codes) si están disponibles
        - Totales (subtotal, descuentos, impuestos, flete, seguro, total)
        - Moneda
        - Información de envío (método, incoterm, puertos, fechas estimadas)
        
        Retorna la información en formato JSON estructurado.`,
      
      en: `Extract the following information from this commercial invoice:
        - Invoice number and date
        - Supplier information (name, address, country, tax ID)
        - Buyer information
        - Product list with codes, descriptions, quantities, unit prices, and totals
        - HS codes if available
        - Totals (subtotal, discounts, taxes, freight, insurance, total)
        - Currency
        - Shipping information (method, incoterm, ports, estimated dates)
        
        Return the information as structured JSON.`,
    };
    
    return prompts[language as keyof typeof prompts] || prompts.en;
  }

  /**
   * Build packing list extraction prompt
   */
  private buildPackingListPrompt(language: string): string {
    const prompts = {
      es: `Extrae la información de esta lista de empaque:
        - Número y fecha
        - Referencia a factura
        - Detalles de cada paquete/bulto:
          - Número de paquete
          - Tipo (caja, pallet, contenedor, etc.)
          - Productos contenidos con cantidades
          - Dimensiones (largo, ancho, alto)
          - Peso neto y bruto
        - Totales generales
        
        Retorna como JSON estructurado.`,
      
      en: `Extract information from this packing list:
        - Number and date
        - Invoice reference
        - Details for each package:
          - Package number
          - Type (box, pallet, container, etc.)
          - Contained products with quantities
          - Dimensions (length, width, height)
          - Net and gross weight
        - Overall totals
        
        Return as structured JSON.`,
    };
    
    return prompts[language as keyof typeof prompts] || prompts.en;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(extracted: any, validated: any): number {
    let score = 1.0;
    const requiredFields = ['invoiceNumber', 'invoiceDate', 'supplier', 'items', 'totals'];
    
    for (const field of requiredFields) {
      if (!extracted[field]) {
        score -= 0.1;
      }
    }
    
    // Check item completeness
    if (validated.items) {
      const avgItemCompleteness = validated.items.reduce((sum: number, item: any) => {
        const fields = ['description', 'quantity', 'unitPrice', 'totalPrice'];
        const completeness = fields.filter(f => item[f] !== undefined).length / fields.length;
        return sum + completeness;
      }, 0) / validated.items.length;
      
      score *= avgItemCompleteness;
    }
    
    return Math.max(0.5, Math.min(1.0, score));
  }

  /**
   * Detect invoice warnings
   */
  private detectInvoiceWarnings(invoice: z.infer<typeof InvoiceSchema>): string[] {
    const warnings: string[] = [];
    
    // Check for missing critical information
    if (!invoice.poNumber) {
      warnings.push('Purchase order number not found');
    }
    
    if (!invoice.supplier.taxId) {
      warnings.push('Supplier tax ID not found');
    }
    
    // Check for missing HS codes
    const itemsWithoutHSCode = invoice.items.filter(item => !item.hsCode);
    if (itemsWithoutHSCode.length > 0) {
      warnings.push(`${itemsWithoutHSCode.length} items without HS codes`);
    }
    
    // Validate totals
    const calculatedSubtotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const variance = Math.abs(calculatedSubtotal - invoice.totals.subtotal) / invoice.totals.subtotal;
    if (variance > 0.01) { // 1% tolerance
      warnings.push('Subtotal does not match sum of line items');
    }
    
    // Check shipping information
    if (!invoice.shipping?.incoterm) {
      warnings.push('Incoterm not specified');
    }
    
    return warnings;
  }

  /**
   * Detect packing list warnings
   */
  private detectPackingListWarnings(packingList: z.infer<typeof PackingListSchema>): string[] {
    const warnings: string[] = [];
    
    // Check weight consistency
    const calculatedGrossWeight = packingList.packages.reduce(
      (sum, pkg) => sum + pkg.grossWeight, 
      0
    );
    const variance = Math.abs(calculatedGrossWeight - packingList.totals.totalGrossWeight) / packingList.totals.totalGrossWeight;
    if (variance > 0.01) {
      warnings.push('Total gross weight does not match sum of packages');
    }
    
    // Check for missing dimensions
    const packagesWithoutDimensions = packingList.packages.filter(pkg => !pkg.dimensions);
    if (packagesWithoutDimensions.length > 0) {
      warnings.push(`${packagesWithoutDimensions.length} packages without dimensions`);
    }
    
    return warnings;
  }

  /**
   * Store processing result in database
   */
  private async storeProcessingResult(
    operationId: string,
    documentType: string,
    result: any,
    processingTime: number
  ) {
    const { error } = await supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        extracted_data: result.data,
        confidence_scores: { overall: result.confidence },
        validation_warnings: result.warnings || [],
      })
      .eq('operation_id', operationId)
      .eq('type', documentType);
    
    if (error) {
      logger.error('Failed to store processing result', { error });
    }
  }

  /**
   * Post-process document (calculate costs, trigger alerts, etc.)
   */
  private async postProcessDocument(
    operationId: string,
    documentType: string,
    result: any
  ) {
    if (documentType === 'commercial_invoice') {
      // Calculate import factor
      await this.calculateImportFactor(operationId, result.data);
      
      // Check for cost alerts
      await this.checkCostAlerts(operationId, result.data);
    }
    
    if (documentType === 'packing_list') {
      // Update operation with weight/volume information
      await this.updateOperationMetrics(operationId, result.data);
    }
  }

  /**
   * Calculate import factor from invoice
   */
  private async calculateImportFactor(operationId: string, invoice: any) {
    const productCost = invoice.totals.subtotal;
    const freight = invoice.totals.freight || 0;
    const insurance = invoice.totals.insurance || 0;
    
    // Estimate other costs if not provided
    const estimatedCustoms = productCost * 0.25; // 25% estimate for Colombian imports
    const estimatedLocalFreight = productCost * 0.05; // 5% estimate
    
    const totalCost = productCost + freight + insurance + estimatedCustoms + estimatedLocalFreight;
    const importFactor = totalCost / productCost;
    
    // Update operation
    await supabase
      .from('import_operations')
      .update({
        total_fob_usd: productCost,
        total_freight_usd: freight,
        total_insurance_usd: insurance,
        import_factor: importFactor,
      })
      .eq('id', operationId);
    
    // Create cost records
    const costs = [
      { category: 'product', amount: productCost, currency: invoice.totals.currency },
      { category: 'freight_international', amount: freight, currency: invoice.totals.currency },
      { category: 'insurance', amount: insurance, currency: invoice.totals.currency },
      { category: 'customs_duties', amount: estimatedCustoms, currency: invoice.totals.currency },
      { category: 'freight_local', amount: estimatedLocalFreight, currency: invoice.totals.currency },
    ].filter(cost => cost.amount > 0);
    
    await supabase
      .from('operation_costs')
      .insert(costs.map(cost => ({
        operation_id: operationId,
        ...cost,
      })));
  }

  /**
   * Check for cost alerts
   */
  private async checkCostAlerts(operationId: string, invoice: any) {
    // Get operation details
    const { data: operation } = await supabase
      .from('import_operations')
      .select('company_id, reference_number')
      .eq('id', operationId)
      .single();
    
    if (!operation) return;
    
    // Check if costs exceed thresholds
    const alerts = [];
    
    // High freight cost alert
    if (invoice.totals.freight > invoice.totals.subtotal * 0.20) {
      alerts.push({
        company_id: operation.company_id,
        operation_id: operationId,
        type: 'cost_threshold',
        severity: 'high',
        title: 'Costo de flete elevado',
        message: `El flete representa más del 20% del valor FOB en la operación ${operation.reference_number}`,
        action_required: true,
      });
    }
    
    // Missing insurance alert
    if (!invoice.totals.insurance || invoice.totals.insurance === 0) {
      alerts.push({
        company_id: operation.company_id,
        operation_id: operationId,
        type: 'compliance_issue',
        severity: 'medium',
        title: 'Seguro no especificado',
        message: `No se encontró información de seguro en la factura de ${operation.reference_number}`,
        action_required: false,
      });
    }
    
    if (alerts.length > 0) {
      await supabase.from('alerts').insert(alerts);
    }
  }

  /**
   * Update operation metrics from packing list
   */
  private async updateOperationMetrics(operationId: string, packingList: any) {
    const metrics = {
      total_packages: packingList.totals.totalPackages,
      total_net_weight_kg: packingList.totals.totalNetWeight,
      total_gross_weight_kg: packingList.totals.totalGrossWeight,
      total_volume_cbm: packingList.totals.totalVolume,
    };
    
    await supabase
      .from('import_operations')
      .update({ custom_fields: metrics })
      .eq('id', operationId);
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();