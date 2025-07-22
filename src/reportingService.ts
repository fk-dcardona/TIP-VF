import type { 
  SalesReport, 
  ExecutiveSummary, 
  SalesKPIs, 
  SalesPerformanceData, 
  BusinessIntelligenceAlert,
  SalesDashboardFilters 
} from '@/types';

// Report generation service
export const reportingService = {
  // Generate automated reports
  async generateDailyReport(): Promise<SalesReport> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const timeRange = {
      startDate: yesterday.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
    
    return this.generateReport('DAILY', timeRange);
  },

  async generateWeeklyReport(): Promise<SalesReport> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const timeRange = {
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
    
    return this.generateReport('WEEKLY', timeRange);
  },

  async generateMonthlyReport(): Promise<SalesReport> {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const timeRange = {
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
    
    return this.generateReport('MONTHLY', timeRange);
  },

  async generateQuarterlyReport(): Promise<SalesReport> {
    const today = new Date();
    const quarterAgo = new Date(today);
    quarterAgo.setMonth(quarterAgo.getMonth() - 3);
    
    const timeRange = {
      startDate: quarterAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
    
    return this.generateReport('QUARTERLY', timeRange);
  },

  // Generate custom report
  async generateCustomReport(
    timeRange: { startDate: string; endDate: string },
    filters: SalesDashboardFilters
  ): Promise<SalesReport> {
    return this.generateReport('CUSTOM', timeRange, filters);
  },

  // Core report generation function
  async generateReport(
    type: SalesReport['type'],
    timeRange: { startDate: string; endDate: string },
    filters?: SalesDashboardFilters
  ): Promise<SalesReport> {
    try {
      // Import database service
      const { databaseService } = await import('./database');
      
      // Get data
      const kpis = await databaseService.getPreCalculatedKPIs(timeRange);
      const performanceData = await databaseService.getPreCalculatedSalesPerformance(timeRange);
      
      // Generate executive summary
      const { generateExecutiveSummary } = await import('../utils/salesAnalytics');
      const salesData = await databaseService.getSalesData() as any[];
      const inventoryData = await databaseService.getInventoryData();
      
      // Generate alerts
      const { generateBusinessIntelligenceAlerts } = await import('../utils/salesAnalytics');
      const alerts = kpis ? generateBusinessIntelligenceAlerts(salesData, inventoryData, kpis, timeRange) : [];
      
      const executiveSummary = kpis ? generateExecutiveSummary(salesData, kpis, alerts, timeRange) : null;
      
      const report: SalesReport = {
        id: `report-${type.toLowerCase()}-${Date.now()}`,
        type,
        period: `${timeRange.startDate} to ${timeRange.endDate}`,
        generatedAt: new Date().toISOString(),
        data: {
          summary: executiveSummary || {
            period: `${timeRange.startDate} to ${timeRange.endDate}`,
            revenueTrend: { current: 0, previous: 0, growth: 0, trend: 'STABLE' },
            marginTrend: { current: 0, previous: 0, change: 0 },
            topProducts: [],
            criticalAlerts: [],
            keyTrends: []
          },
          kpis: kpis || {
            totalRevenue: 0,
            grossMargin: 0,
            netMargin: 0,
            cashConversionCycle: 0,
            inventoryTurnover: 0,
            customerROI: 0,
            onTimeDeliveryRate: 0,
            outOfStockRate: 0,
            productPenetrationRate: 0,
            averageTimeToSell: 0,
            supplyChainCosts: 0,
            monthlyRevenueGrowth: 0,
            customerAcquisitionCost: 0,
            customerLifetimeValue: 0,
            averageOrderValue: 0,
            repeatPurchaseRate: 0
          },
          performance: performanceData || {
            monthlyRevenue: [],
            grossMarginTrend: [],
            salesVelocity: [],
            customerSegmentation: {},
            topProducts: [],
            topCustomers: [],
            outletCoverage: [],
            territoryPerformance: {}
          },
          alerts
        },
        filters: filters || {
          dateRange: timeRange,
          productGroups: [],
          customerSegments: [],
          territories: [],
          salespeople: [],
          brands: [],
          categories: []
        },
        exportFormat: 'PDF'
      };
      
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  },

  // Export functions
  async exportToExcel(report: SalesReport): Promise<Blob> {
    try {
      // Import Excel generation library (you'll need to install a library like xlsx)
      // const XLSX = await import('xlsx');
      
      // For now, create a simple CSV-like Excel file
      const csvContent = [
        // Header
        ['Sales Intelligence Report'],
        [`Period,${report.period}`],
        [`Generated,${new Date(report.generatedAt).toLocaleString()}`],
        [''],
        
        // KPIs
        ['Key Performance Indicators'],
        ['Metric,Value'],
        [`Total Revenue,$${report.data.kpis.totalRevenue.toLocaleString()}`],
        [`Gross Margin,${report.data.kpis.grossMargin.toFixed(2)}%`],
        [`Net Margin,${report.data.kpis.netMargin.toFixed(2)}%`],
        [`Cash Conversion Cycle,${report.data.kpis.cashConversionCycle.toFixed(1)} days`],
        [`Inventory Turnover,${report.data.kpis.inventoryTurnover.toFixed(2)}`],
        [''],
        
        // Top Products
        ['Top Products'],
        ['Product Name,Revenue,Margin'],
        ...report.data.summary.topProducts.map(p => [p.productName, `$${p.revenue.toLocaleString()}`, `${p.margin.toFixed(2)}%`]),
        [''],
        
        // Alerts
        ['Business Intelligence Alerts'],
        ['Title,Severity,Description'],
        ...report.data.alerts.map(a => [a.title, a.severity, a.description])
      ].map(row => row.join(',')).join('\n');
      
      return new Blob([csvContent], { type: 'text/csv' });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel');
    }
  },

  async exportToPDF(report: SalesReport): Promise<Blob> {
    try {
      // Import PDF generation library (you'll need to install a library like jsPDF)
      // const jsPDF = await import('jspdf');
      // const doc = new jsPDF.default();
      
      // For now, create a simple text-based PDF-like content
      const pdfContent = [
        'Sales Intelligence Report',
        `Period: ${report.period}`,
        `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
        '',
        'Executive Summary',
        `Revenue: $${report.data.summary.revenueTrend.current.toLocaleString()}`,
        `Growth: ${report.data.summary.revenueTrend.growth}%`,
        `Critical Alerts: ${report.data.alerts.filter(a => a.severity === 'CRITICAL').length}`,
        '',
        'Key Performance Indicators',
        `Total Revenue: $${report.data.kpis.totalRevenue.toLocaleString()}`,
        `Gross Margin: ${report.data.kpis.grossMargin.toFixed(2)}%`,
        `Inventory Turnover: ${report.data.kpis.inventoryTurnover.toFixed(2)}`
      ].join('\n');
      
      return new Blob([pdfContent], { type: 'text/plain' });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export to PDF');
    }
  },

  async exportToCSV(report: SalesReport): Promise<Blob> {
    try {
      // Create CSV content
      const csvContent = [
        // Header
        ['Sales Intelligence Report'],
        [`Period,${report.period}`],
        [`Generated,${new Date(report.generatedAt).toLocaleString()}`],
        [''],
        
        // KPIs
        ['Key Performance Indicators'],
        ['Metric,Value'],
        [`Total Revenue,$${report.data.kpis.totalRevenue.toLocaleString()}`],
        [`Gross Margin,${report.data.kpis.grossMargin.toFixed(2)}%`],
        [`Net Margin,${report.data.kpis.netMargin.toFixed(2)}%`],
        [`Cash Conversion Cycle,${report.data.kpis.cashConversionCycle.toFixed(1)} days`],
        [`Inventory Turnover,${report.data.kpis.inventoryTurnover.toFixed(2)}`],
        [''],
        
        // Top Products
        ['Top Products'],
        ['Product Name,Revenue,Margin'],
        ...report.data.summary.topProducts.map(p => [p.productName, `$${p.revenue.toLocaleString()}`, `${p.margin.toFixed(2)}%`]),
        [''],
        
        // Alerts
        ['Business Intelligence Alerts'],
        ['Title,Severity,Description'],
        ...report.data.alerts.map(a => [a.title, a.severity, a.description])
      ].map(row => row.join(',')).join('\n');
      
      return new Blob([csvContent], { type: 'text/csv' });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export to CSV');
    }
  },

  // Download helper
  downloadReport(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Schedule automated reports
  scheduleReport(type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY', email?: string): void {
    // This would integrate with a scheduling service
    console.log(`Scheduling ${type.toLowerCase()} report${email ? ` for ${email}` : ''}`);
    
    // For now, just log the schedule
    const schedule = {
      type,
      email,
      nextRun: this.getNextRunTime(type),
      enabled: true
    };
    
    // Store in localStorage for demo purposes
    const schedules = JSON.parse(localStorage.getItem('reportSchedules') || '[]');
    schedules.push(schedule);
    localStorage.setItem('reportSchedules', JSON.stringify(schedules));
  },

  getNextRunTime(type: string): string {
    const now = new Date();
    switch (type) {
      case 'DAILY':
        now.setDate(now.getDate() + 1);
        now.setHours(8, 0, 0, 0); // 8 AM
        break;
      case 'WEEKLY':
        now.setDate(now.getDate() + 7);
        now.setHours(9, 0, 0, 0); // 9 AM Monday
        break;
      case 'MONTHLY':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        now.setHours(10, 0, 0, 0); // 10 AM first of month
        break;
      case 'QUARTERLY':
        now.setMonth(now.getMonth() + 3);
        now.setDate(1);
        now.setHours(11, 0, 0, 0); // 11 AM first of quarter
        break;
    }
    return now.toISOString();
  }
}; 