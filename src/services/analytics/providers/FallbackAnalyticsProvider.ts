/**
 * Fallback Analytics Provider
 * Single Responsibility: Provide reliable analytics data when primary sources fail
 * Follows Liskov Substitution: Can be used anywhere BaseAnalyticsProvider is expected
 */

import { 
  BaseAnalyticsProvider, 
  IAnalyticsProviderStrategy,
  AnalyticsResponse,
  AnalyticsDataType,
  TriangleAnalyticsData,
  CrossReferenceData,
  SupplierData,
  MarketData
} from '../../../types/analytics-solid';

export class FallbackAnalyticsProvider extends BaseAnalyticsProvider implements IAnalyticsProviderStrategy {
  
  constructor() {
    super();
  }

  getProviderName(): string {
    return 'FallbackProvider';
  }

  getProviderPriority(): number {
    return 10; // Lowest priority - only used when others fail
  }

  canHandle(dataType: AnalyticsDataType): boolean {
    // Fallback can handle all data types with realistic mock data
    return true;
  }

  async isAvailable(): Promise<boolean> {
    // Fallback is always available
    return true;
  }


  async fetchData<T>(orgId: string, dataType: AnalyticsDataType): Promise<AnalyticsResponse<T>> {
    try {
      let data: T;
      
      switch (dataType) {
        case 'triangle':
          data = this.generateTriangleAnalytics(orgId) as T;
          break;
        case 'cross-reference':
          data = this.generateCrossReferenceAnalytics(orgId) as T;
          break;
        case 'supplier-performance':
          data = this.generateSupplierAnalytics(orgId) as T;
          break;
        case 'market-intelligence':
          data = this.generateMarketAnalytics(orgId) as T;
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      return {
        success: true,
        data,
        provider: this.getProviderName(),
        fallback_used: true,
        timestamp: this.createTimestamp()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fallback provider error',
        provider: this.getProviderName(),
        fallback_used: true,
        timestamp: this.createTimestamp()
      };
    }
  }

  private generateTriangleAnalytics(orgId: string): TriangleAnalyticsData {
    // Generate realistic data based on orgId hash for consistency
    const orgHash = this.generateOrgHash(orgId);
    
    return {
      service_score: 85.5 + (orgHash % 10),
      cost_score: 78.2 + (orgHash % 15),
      capital_score: 92.1 + (orgHash % 8),
      documents_score: 88.7 + (orgHash % 12),
      overall_score: 86.1 + (orgHash % 10),
      recommendations: [
        "Optimize supplier lead times to improve service score",
        "Review payment terms to reduce cost score impact",
        "Consider inventory optimization to improve capital efficiency",
        "Enhance document processing workflows"
      ],
      trends: {
        service: { trend: "improving", change: 2.3 + (orgHash % 3) },
        cost: { trend: orgHash % 2 === 0 ? "stable" : "improving", change: 0.1 + (orgHash % 2) },
        capital: { trend: "improving", change: 1.8 + (orgHash % 2) },
        documents: { trend: "improving", change: 3.2 + (orgHash % 4) }
      },
      timestamp: this.createTimestamp()
    };
  }

  private generateCrossReferenceAnalytics(orgId: string): CrossReferenceData {
    const orgHash = this.generateOrgHash(orgId);
    
    return {
      document_compliance: 92.5 + (orgHash % 7),
      inventory_accuracy: 88.3 + (orgHash % 10),
      cost_variance: 4.2 + (orgHash % 3),
      compromised_inventory: {
        total_items: 1250 + (orgHash % 500),
        compromised_count: 23 + (orgHash % 20),
        compromised_percentage: 1.84 + ((orgHash % 100) / 100)
      },
      discrepancies: [
        { type: "quantity_mismatch", count: 3 + (orgHash % 5), severity: "medium" as const },
        { type: "price_variance", count: 1 + (orgHash % 3), severity: "low" as const },
        { type: "missing_documents", count: orgHash % 3, severity: "high" as const }
      ],
      timestamp: this.createTimestamp()
    };
  }

  private generateSupplierAnalytics(orgId: string): SupplierData {
    const orgHash = this.generateOrgHash(orgId);
    
    return {
      suppliers: [
        {
          id: "supp_001",
          name: "TechCorp Industries",
          health_score: 92.5 + (orgHash % 7),
          delivery_performance: 95.2 + (orgHash % 4),
          quality_score: 88.7 + (orgHash % 11),
          cost_efficiency: 91.3 + (orgHash % 8),
          risk_level: ["low", "medium"][orgHash % 2] as "low" | "medium"
        },
        {
          id: "supp_002",
          name: "Global Supply Co",
          health_score: 78.9 + (orgHash % 12),
          delivery_performance: 82.1 + (orgHash % 15),
          quality_score: 85.4 + (orgHash % 9),
          cost_efficiency: 76.8 + (orgHash % 18),
          risk_level: ["medium", "high"][orgHash % 2] as "medium" | "high"
        },
        {
          id: "supp_003",
          name: "Premium Materials Ltd",
          health_score: 96.2 + (orgHash % 3),
          delivery_performance: 98.1 + (orgHash % 2),
          quality_score: 94.7 + (orgHash % 5),
          cost_efficiency: 89.3 + (orgHash % 10),
          risk_level: "low" as const
        }
      ],
      average_performance: {
        health_score: 85.7 + (orgHash % 10),
        delivery_performance: 88.7 + (orgHash % 8),
        quality_score: 87.1 + (orgHash % 7),
        cost_efficiency: 84.1 + (orgHash % 12)
      },
      timestamp: this.createTimestamp()
    };
  }

  private generateMarketAnalytics(orgId: string): MarketData {
    const orgHash = this.generateOrgHash(orgId);
    
    return {
      market_segments: [
        { segment: "enterprise", revenue: 1250000 + (orgHash * 1000), growth: 12.5 + (orgHash % 5) },
        { segment: "mid_market", revenue: 850000 + (orgHash * 500), growth: 8.2 + (orgHash % 7) },
        { segment: "small_business", revenue: 450000 + (orgHash * 200), growth: 15.7 + (orgHash % 3) }
      ],
      competitor_analysis: [
        { competitor: "Competitor A", market_share: 25.3 + (orgHash % 10), strength: "high" as const },
        { competitor: "Competitor B", market_share: 18.7 + (orgHash % 8), strength: "medium" as const },
        { competitor: "Competitor C", market_share: 12.1 + (orgHash % 6), strength: "low" as const }
      ],
      market_trends: {
        demand_growth: 8.5 + (orgHash % 4),
        price_trends: ["stable", "increasing", "decreasing"][orgHash % 3],
        technology_adoption: ["increasing", "stable", "rapid"][orgHash % 3]
      },
      timestamp: this.createTimestamp()
    };
  }

  private generateOrgHash(orgId: string): number {
    // Simple hash function to generate consistent data for the same orgId
    let hash = 0;
    for (let i = 0; i < orgId.length; i++) {
      const char = orgId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}