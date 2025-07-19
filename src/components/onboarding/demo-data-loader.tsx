/**
 * 📊 Demo Data Loader
 * SuperClaude Optimized for Quick Start
 * 
 * Features:
 * - Realistic Colombian import data
 * - Multiple document types
 * - Various operation statuses
 * - Cost breakdowns
 */

'use client';

import { useState } from 'react';
import { Card, Text, ProgressBar, Button, Badge } from '@tremor/react';
import { Loader2, CheckCircle, Package, FileText, DollarSign } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logger } from '@/lib/logger';

interface DemoDataProgress {
  total: number;
  completed: number;
  currentStep: string;
  errors: string[];
}

export function DemoDataLoader({ 
  companyId,
  onComplete 
}: { 
  companyId: string;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<DemoDataProgress>({
    total: 0,
    completed: 0,
    currentStep: '',
    errors: [],
  });
  
  const supabase = createClientComponentClient();

  // Demo suppliers
  const demoSuppliers = [
    {
      name: 'Shanghai Electronics Co., Ltd',
      country: 'CN',
      city: 'Shanghai',
      contactEmail: 'sales@shanghai-electronics.cn',
      paymentTerms: '30% advance, 70% BL',
      currency: 'USD',
      averageLeadTimeDays: 45,
    },
    {
      name: 'Miami Trading Corp',
      country: 'US',
      city: 'Miami',
      contactEmail: 'info@miami-trading.com',
      paymentTerms: 'Net 30',
      currency: 'USD',
      averageLeadTimeDays: 15,
    },
    {
      name: 'Grupo Industrial Monterrey',
      country: 'MX',
      city: 'Monterrey',
      contactEmail: 'ventas@grupo-monterrey.mx',
      paymentTerms: '50% advance, 50% delivery',
      currency: 'USD',
      averageLeadTimeDays: 20,
    },
  ];

  // Demo import operations
  const generateDemoOperations = (suppliers: any[]) => {
    const statuses = ['in_transit', 'in_customs', 'cleared', 'delivered', 'completed'];
    const products = [
      { name: 'Componentes Electrónicos', hsCode: '8542.31', unitPrice: 125 },
      { name: 'Textiles - Tela de Algodón', hsCode: '5208.12', unitPrice: 8.5 },
      { name: 'Maquinaria Industrial', hsCode: '8428.10', unitPrice: 15000 },
      { name: 'Productos Químicos', hsCode: '2915.21', unitPrice: 45 },
      { name: 'Autopartes - Frenos', hsCode: '8708.30', unitPrice: 85 },
    ];

    const operations = [];
    const today = new Date();

    for (let i = 0; i < 10; i++) {
      const supplier = suppliers[i % suppliers.length];
      const product = products[i % products.length];
      const status = statuses[i % statuses.length];
      
      const orderDate = new Date(today);
      orderDate.setDate(orderDate.getDate() - (60 - i * 5));
      
      const etaDate = new Date(orderDate);
      etaDate.setDate(etaDate.getDate() + supplier.averageLeadTimeDays);

      const quantity = Math.floor(Math.random() * 900) + 100;
      const fobValue = quantity * product.unitPrice;
      const freight = fobValue * (supplier.country === 'CN' ? 0.12 : 0.08);
      const insurance = fobValue * 0.015;
      
      operations.push({
        referenceNumber: `IMP-2024-${String(1000 + i).padStart(4, '0')}`,
        poNumber: `PO-${String(2000 + i).padStart(4, '0')}`,
        status,
        supplierName: supplier.name,
        supplierCountry: supplier.country,
        orderDate: orderDate.toISOString().split('T')[0],
        etaDestination: etaDate.toISOString().split('T')[0],
        originPort: supplier.country === 'CN' ? 'Shanghai' : supplier.country === 'US' ? 'Miami' : 'Veracruz',
        destinationPort: 'Buenaventura',
        shippingMethod: supplier.country === 'US' ? 'air' : 'sea',
        totalFobUsd: fobValue,
        totalFreightUsd: freight,
        totalInsuranceUsd: insurance,
        totalCostsUsd: fobValue + freight + insurance,
        importFactor: (fobValue + freight + insurance) / fobValue,
        exchangeRate: 4150,
        items: [{
          productCode: `SKU-${i + 1000}`,
          description: product.name,
          hsCode: product.hsCode,
          quantity,
          unit: 'PCS',
          unitPriceUsd: product.unitPrice,
          totalPriceUsd: fobValue,
        }],
      });
    }

    return operations;
  };

  const loadDemoData = async () => {
    setLoading(true);
    setProgress({
      total: 23, // 3 suppliers + 10 operations + 10 documents
      completed: 0,
      currentStep: 'Creando proveedores...',
      errors: [],
    });

    try {
      // Step 1: Create suppliers
      const supplierIds: Record<string, string> = {};
      
      for (const supplier of demoSuppliers) {
        setProgress(prev => ({
          ...prev,
          currentStep: `Creando proveedor: ${supplier.name}`,
        }));
        
        const { data, error } = await supabase
          .from('suppliers')
          .insert({
            company_id: companyId,
            ...supplier,
          })
          .select()
          .single();
        
        if (error) throw error;
        supplierIds[supplier.name] = data.id;
        
        setProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      }

      // Step 2: Create import operations
      const operations = generateDemoOperations(demoSuppliers);
      const operationIds: string[] = [];
      
      for (const operation of operations) {
        setProgress(prev => ({
          ...prev,
          currentStep: `Creando operación: ${operation.referenceNumber}`,
        }));
        
        const supplier = demoSuppliers.find(s => s.name === operation.supplierName);
        const supplierId = supplier ? supplierIds[supplier.name] : null;
        
        const { data, error } = await supabase
          .from('import_operations')
          .insert({
            company_id: companyId,
            supplier_id: supplierId,
            reference_number: operation.referenceNumber,
            po_number: operation.poNumber,
            status: operation.status,
            supplier_name: operation.supplierName,
            supplier_country: operation.supplierCountry,
            order_date: operation.orderDate,
            eta_destination: operation.etaDestination,
            origin_port: operation.originPort,
            destination_port: operation.destinationPort,
            shipping_method: operation.shippingMethod,
            total_fob_usd: operation.totalFobUsd,
            total_freight_usd: operation.totalFreightUsd,
            total_insurance_usd: operation.totalInsuranceUsd,
            total_costs_usd: operation.totalCostsUsd,
            import_factor: operation.importFactor,
            exchange_rate: operation.exchangeRate,
          })
          .select()
          .single();
        
        if (error) throw error;
        operationIds.push(data.id);
        
        // Add items
        for (const item of operation.items) {
          await supabase
            .from('operation_items')
            .insert({
              operation_id: data.id,
              ...item,
            });
        }
        
        // Add costs
        const costs = [
          { category: 'product', amount: operation.totalFobUsd, currency: 'USD' },
          { category: 'freight_international', amount: operation.totalFreightUsd, currency: 'USD' },
          { category: 'insurance', amount: operation.totalInsuranceUsd, currency: 'USD' },
        ];
        
        for (const cost of costs) {
          await supabase
            .from('operation_costs')
            .insert({
              operation_id: data.id,
              ...cost,
              amount_cop: cost.amount * operation.exchangeRate,
              exchange_rate: operation.exchangeRate,
            });
        }
        
        setProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      }

      // Step 3: Create sample documents
      const documentTypes = ['commercial_invoice', 'packing_list', 'bill_of_lading'];
      
      for (let i = 0; i < operationIds.length; i++) {
        const operationId = operationIds[i];
        const docType = documentTypes[i % documentTypes.length];
        
        setProgress(prev => ({
          ...prev,
          currentStep: `Creando documento de ejemplo ${i + 1}/10`,
        }));
        
        await supabase
          .from('documents')
          .insert({
            operation_id: operationId,
            type: docType,
            name: `${docType.replace('_', '-')}-demo-${i + 1}.pdf`,
            file_url: `/demo/documents/${docType}-sample.pdf`,
            file_size_bytes: 250000,
            mime_type: 'application/pdf',
            processing_status: 'completed',
            validation_status: 'valid',
            extracted_data: {
              demo: true,
              processed_at: new Date().toISOString(),
            },
            confidence_scores: { overall: 0.95 },
          });
        
        setProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      }

      // Step 4: Create sample alerts
      await supabase
        .from('alerts')
        .insert([
          {
            company_id: companyId,
            operation_id: operationIds[0],
            type: 'delivery_delay',
            severity: 'medium',
            title: 'Retraso en Puerto de Origen',
            message: 'La carga está demorada 3 días en el puerto de Shanghai debido a congestión.',
            action_required: false,
          },
          {
            company_id: companyId,
            operation_id: operationIds[1],
            type: 'payment_due',
            severity: 'high',
            title: 'Pago Pendiente - Vence Mañana',
            message: 'El pago del 70% restante vence mañana. Monto: USD 45,000',
            action_required: true,
            action_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);

      logger.info('Demo data loaded successfully', { companyId });
      
      setProgress(prev => ({
        ...prev,
        currentStep: '¡Datos de demostración cargados exitosamente!',
      }));
      
      setTimeout(onComplete, 1500);
    } catch (error) {
      logger.error('Failed to load demo data', error);
      setProgress(prev => ({
        ...prev,
        errors: [...prev.errors, 'Error al cargar datos de demostración'],
      }));
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
          <Text className="text-2xl font-bold">Cargar Datos de Demostración</Text>
          <Text className="text-gray-600 mt-2">
            Esto creará operaciones de importación de ejemplo para explorar la plataforma
          </Text>
        </div>

        {!loading && progress.completed === 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <FileText className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                <Text className="font-medium">10 Operaciones</Text>
                <Text className="text-sm text-gray-600">Con diferentes estados</Text>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                <Text className="font-medium">Costos Reales</Text>
                <Text className="text-sm text-gray-600">Basados en el mercado</Text>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Package className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                <Text className="font-medium">3 Proveedores</Text>
                <Text className="text-sm text-gray-600">China, USA, México</Text>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={loadDemoData}
              icon={Package}
            >
              Cargar Datos de Demostración
            </Button>
          </>
        )}

        {(loading || progress.completed > 0) && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Text className="text-sm font-medium">{progress.currentStep}</Text>
                <Text className="text-sm text-gray-600">
                  {progress.completed} de {progress.total}
                </Text>
              </div>
              <ProgressBar value={progressPercentage} color="indigo" />
            </div>

            {progress.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                {progress.errors.map((error, index) => (
                  <Text key={index} className="text-red-600 text-sm">
                    {error}
                  </Text>
                ))}
              </div>
            )}

            {progress.completed === progress.total && progress.errors.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <Text className="font-medium text-green-700">
                  ¡Datos cargados exitosamente!
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}