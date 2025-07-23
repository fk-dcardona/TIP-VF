import { AnalyticsData, InventoryData, SalesData, SupplierData, CrossReferenceData } from '../../../types/analytics-solid';

export class FallbackAnalyticsProvider {
  async getAnalytics(): Promise<AnalyticsData> {
    return {
      inventory: this.generateInventoryData(),
      sales: this.generateSalesData(),
      suppliers: this.generateSupplierData(),
      crossReference: this.generateCrossReferenceData(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if provider is available (always true for fallback)
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Get inventory data
   */
  async getInventoryData(): Promise<InventoryData> {
    return this.generateInventoryData();
  }

  /**
   * Get sales data
   */
  async getSalesData(): Promise<SalesData> {
    return this.generateSalesData();
  }

  /**
   * Get supplier data
   */
  async getSupplierData(): Promise<SupplierData[]> {
    return this.generateSupplierData();
  }

  /**
   * Get cross-reference data
   */
  async getCrossReferenceData(): Promise<CrossReferenceData> {
    return this.generateCrossReferenceData();
  }

  private generateInventoryData(): InventoryData {
    return {
      total_items: 1250,
      low_stock_items: 45,
      out_of_stock_items: 12,
      high_value_items: 89,
      average_stock_level: 85,
      stock_turnover_rate: 4.2,
      inventory_value: 125000,
      reorder_alerts: 23,
      items_by_category: [
        { category: 'Electronics', count: 320, value: 45000 },
        { category: 'Clothing', count: 450, value: 28000 },
        { category: 'Home & Garden', count: 280, value: 22000 },
        { category: 'Sports', count: 200, value: 30000 }
      ],
      stock_levels: [
        { product_code: 'ELEC-001', product_name: 'Smartphone', current_stock: 45, reorder_point: 20, max_stock: 100 },
        { product_code: 'CLOTH-002', product_name: 'T-Shirt', current_stock: 120, reorder_point: 50, max_stock: 200 },
        { product_code: 'HOME-003', product_name: 'Coffee Maker', current_stock: 15, reorder_point: 10, max_stock: 50 },
        { product_code: 'SPORT-004', product_name: 'Running Shoes', current_stock: 35, reorder_point: 25, max_stock: 80 }
      ],
      recent_movements: [
        { product_code: 'ELEC-001', movement_type: 'in', quantity: 50, date: '2024-01-15' },
        { product_code: 'CLOTH-002', movement_type: 'out', quantity: 30, date: '2024-01-14' },
        { product_code: 'HOME-003', movement_type: 'in', quantity: 20, date: '2024-01-13' },
        { product_code: 'SPORT-004', movement_type: 'out', quantity: 15, date: '2024-01-12' }
      ]
    };
  }

  private generateSalesData(): SalesData {
    return {
      total_revenue: 450000,
      total_orders: 1250,
      average_order_value: 360,
      conversion_rate: 3.2,
      top_selling_products: [
        { product_code: 'ELEC-001', product_name: 'Smartphone', units_sold: 150, revenue: 75000 },
        { product_code: 'CLOTH-002', product_name: 'T-Shirt', units_sold: 300, revenue: 9000 },
        { product_code: 'HOME-003', product_name: 'Coffee Maker', units_sold: 80, revenue: 16000 },
        { product_code: 'SPORT-004', product_name: 'Running Shoes', units_sold: 120, revenue: 24000 }
      ],
      sales_by_category: [
        { category: 'Electronics', revenue: 180000, units: 450 },
        { category: 'Clothing', revenue: 90000, units: 1200 },
        { category: 'Home & Garden', revenue: 85000, units: 350 },
        { category: 'Sports', revenue: 95000, units: 280 }
      ],
      monthly_trends: [
        { month: '2024-01', revenue: 450000, orders: 1250 },
        { month: '2023-12', revenue: 420000, orders: 1180 },
        { month: '2023-11', revenue: 380000, orders: 1050 },
        { month: '2023-10', revenue: 350000, orders: 980 }
      ],
      customer_segments: [
        { segment: 'Premium', revenue: 180000, customers: 120 },
        { segment: 'Standard', revenue: 200000, customers: 800 },
        { segment: 'Budget', revenue: 70000, customers: 330 }
      ]
    };
  }

  private generateSupplierData(): SupplierData[] {
    return [
      {
        supplier_id: 'SUP-001',
        supplier_name: 'TechCorp Electronics',
        health_score: 85,
        delivery_performance: 92,
        quality_score: 88,
        cost_efficiency: 78,
        risk_level: 'low',
        products_supplied: [
          {
            product_code: 'ELEC-001',
            product_name: 'Smartphone',
            average_lead_time_days: 14,
            last_delivery_date: '2024-01-10',
            on_time_delivery_rate: 95,
            average_cost: 300,
            total_supplied: 500
          },
          {
            product_code: 'ELEC-002',
            product_name: 'Laptop',
            average_lead_time_days: 21,
            last_delivery_date: '2024-01-08',
            on_time_delivery_rate: 88,
            average_cost: 800,
            total_supplied: 150
          }
        ],
        total_spend: 180000,
        average_lead_time: 17.5,
        on_time_delivery_rate: 91.5,
        quality_rating: 88,
        last_order_date: '2024-01-05',
        next_expected_delivery: '2024-01-22',
        payment_terms: 'Net 30',
        contact_info: {
          email: 'orders@techcorp.com',
          phone: '+1-555-0123',
          address: '123 Tech Street, Silicon Valley, CA'
        },
        performance_metrics: {
          cost_variance: 2.5,
          delivery_variance: 1.8,
          quality_issues: 3,
          communication_score: 90
        },
        risk_factors: {
          financial_stability: 85,
          geographic_risk: 15,
          capacity_constraints: 20,
          dependency_level: 35
        }
      },
      {
        supplier_id: 'SUP-002',
        supplier_name: 'Fashion Forward Apparel',
        health_score: 78,
        delivery_performance: 85,
        quality_score: 82,
        cost_efficiency: 85,
        risk_level: 'medium',
        products_supplied: [
          {
            product_code: 'CLOTH-002',
            product_name: 'T-Shirt',
            average_lead_time_days: 10,
            last_delivery_date: '2024-01-12',
            on_time_delivery_rate: 92,
            average_cost: 15,
            total_supplied: 2000
          },
          {
            product_code: 'CLOTH-003',
            product_name: 'Jeans',
            average_lead_time_days: 12,
            last_delivery_date: '2024-01-09',
            on_time_delivery_rate: 88,
            average_cost: 45,
            total_supplied: 800
          }
        ],
        total_spend: 52000,
        average_lead_time: 11,
        on_time_delivery_rate: 90,
        quality_rating: 82,
        last_order_date: '2024-01-03',
        next_expected_delivery: '2024-01-18',
        payment_terms: 'Net 45',
        contact_info: {
          email: 'orders@fashionforward.com',
          phone: '+1-555-0456',
          address: '456 Fashion Ave, New York, NY'
        },
        performance_metrics: {
          cost_variance: 1.2,
          delivery_variance: 2.5,
          quality_issues: 8,
          communication_score: 75
        },
        risk_factors: {
          financial_stability: 70,
          geographic_risk: 25,
          capacity_constraints: 30,
          dependency_level: 45
        }
      },
      {
        supplier_id: 'SUP-003',
        supplier_name: 'Home Essentials Co',
        health_score: 92,
        delivery_performance: 95,
        quality_score: 90,
        cost_efficiency: 88,
        risk_level: 'low',
        products_supplied: [
          {
            product_code: 'HOME-003',
            product_name: 'Coffee Maker',
            average_lead_time_days: 8,
            last_delivery_date: '2024-01-14',
            on_time_delivery_rate: 98,
            average_cost: 120,
            total_supplied: 300
          },
          {
            product_code: 'HOME-004',
            product_name: 'Blender',
            average_lead_time_days: 7,
            last_delivery_date: '2024-01-11',
            on_time_delivery_rate: 96,
            average_cost: 80,
            total_supplied: 250
          }
        ],
        total_spend: 56000,
        average_lead_time: 7.5,
        on_time_delivery_rate: 97,
        quality_rating: 90,
        last_order_date: '2024-01-06',
        next_expected_delivery: '2024-01-15',
        payment_terms: 'Net 30',
        contact_info: {
          email: 'orders@homeessentials.com',
          phone: '+1-555-0789',
          address: '789 Home Street, Chicago, IL'
        },
        performance_metrics: {
          cost_variance: 1.0,
          delivery_variance: 0.8,
          quality_issues: 2,
          communication_score: 95
        },
        risk_factors: {
          financial_stability: 90,
          geographic_risk: 10,
          capacity_constraints: 15,
          dependency_level: 25
        }
      }
    ];
  }

  private generateCrossReferenceData(): CrossReferenceData {
    return {
      supplier_product_impact: [
        {
          supplier_id: 'SUP-001',
          supplier_name: 'TechCorp Electronics',
          product_code: 'ELEC-001',
          product_name: 'Smartphone',
          lead_time_impact_score: 0.85,
          stockout_risk: 0.15,
          sales_impact: 0.92,
          cost_impact: 0.78
        },
        {
          supplier_id: 'SUP-002',
          supplier_name: 'Fashion Forward Apparel',
          product_code: 'CLOTH-002',
          product_name: 'T-Shirt',
          lead_time_impact_score: 0.72,
          stockout_risk: 0.08,
          sales_impact: 0.68,
          cost_impact: 0.85
        },
        {
          supplier_id: 'SUP-003',
          supplier_name: 'Home Essentials Co',
          product_code: 'HOME-003',
          product_name: 'Coffee Maker',
          lead_time_impact_score: 0.95,
          stockout_risk: 0.05,
          sales_impact: 0.88,
          cost_impact: 0.82
        }
      ],
      inventory_supplier_analysis: [
        {
          product_code: 'ELEC-001',
          current_stock: 45,
          reorder_point: 20,
          supplier_lead_times: [
            {
              supplier_id: 'SUP-001',
              supplier_name: 'TechCorp Electronics',
              average_lead_time: 14,
              risk_level: 'low'
            }
          ],
          stockout_probability: 0.15
        },
        {
          product_code: 'CLOTH-002',
          current_stock: 120,
          reorder_point: 50,
          supplier_lead_times: [
            {
              supplier_id: 'SUP-002',
              supplier_name: 'Fashion Forward Apparel',
              average_lead_time: 10,
              risk_level: 'medium'
            }
          ],
          stockout_probability: 0.08
        },
        {
          product_code: 'HOME-003',
          current_stock: 15,
          reorder_point: 10,
          supplier_lead_times: [
            {
              supplier_id: 'SUP-003',
              supplier_name: 'Home Essentials Co',
              average_lead_time: 8,
              risk_level: 'low'
            }
          ],
          stockout_probability: 0.05
        }
      ],
      sales_supplier_correlation: [
        {
          product_code: 'ELEC-001',
          monthly_sales: 150,
          supplier_performance: [
            {
              supplier_id: 'SUP-001',
              supplier_name: 'TechCorp Electronics',
              delivery_performance: 92,
              quality_score: 88,
              impact_on_sales: 0.92
            }
          ]
        },
        {
          product_code: 'CLOTH-002',
          monthly_sales: 300,
          supplier_performance: [
            {
              supplier_id: 'SUP-002',
              supplier_name: 'Fashion Forward Apparel',
              delivery_performance: 85,
              quality_score: 82,
              impact_on_sales: 0.68
            }
          ]
        },
        {
          product_code: 'HOME-003',
          monthly_sales: 80,
          supplier_performance: [
            {
              supplier_id: 'SUP-003',
              supplier_name: 'Home Essentials Co',
              delivery_performance: 95,
              quality_score: 90,
              impact_on_sales: 0.88
            }
          ]
        }
      ]
    };
  }
} 