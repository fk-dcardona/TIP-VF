/**
 * 🚀 Real-Time Dashboard Component
 * SuperClaude Optimized for Colombian Traders
 * 
 * Features:
 * - WebSocket real-time updates
 * - Colombian peso formatting
 * - Responsive grid layout
 * - Performance optimized with React.memo
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, Metric, Text, ProgressBar, Grid, BarList, DonutChart, LineChart } from '@tremor/react';
import { AlertCircle, TrendingUp, Package, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { formatCOP, formatUSD } from '@/lib/utils/currency';
import { useCompany } from '@/hooks/use-company';
import { cn } from '@/lib/utils';

// Types
interface DashboardMetrics {
  activeImports: number;
  pendingAlerts: number;
  avgImportFactor: number;
  monthlyVolume: number;
  weeklyTrend: number;
  topSuppliers: Array<{ name: string; value: number }>;
  statusDistribution: Array<{ name: string; value: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
  }>;
}

interface ImportOperation {
  id: string;
  reference_number: string;
  status: string;
  supplier_name: string;
  total_costs_usd: number;
  import_factor: number;
  eta_destination: string;
  alerts: Array<{ id: string; resolved: boolean }>;
  documents: Array<{ id: string; validation_status: string }>;
}

// Status configuration
const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: 'gray' },
  confirmed: { label: 'Confirmado', color: 'blue' },
  in_production: { label: 'En Producción', color: 'indigo' },
  in_transit: { label: 'En Tránsito', color: 'yellow' },
  in_customs: { label: 'En Aduana', color: 'orange' },
  cleared: { label: 'Liberado', color: 'green' },
  delivered: { label: 'Entregado', color: 'emerald' },
  completed: { label: 'Completado', color: 'teal' },
};

// Main component
export function RealTimeDashboard({ companyId }: { companyId: string }) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeImports: 0,
    pendingAlerts: 0,
    avgImportFactor: 0,
    monthlyVolume: 0,
    weeklyTrend: 0,
    topSuppliers: [],
    statusDistribution: [],
    recentActivity: [],
  });
  
  const [operations, setOperations] = useState<ImportOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const supabase = createClientComponentClient();
  const { company } = useCompany();

  // Calculate metrics from operations
  const calculateMetrics = useCallback((ops: ImportOperation[]): DashboardMetrics => {
    const activeOps = ops.filter(op => !['completed', 'cancelled'].includes(op.status));
    const alerts = ops.flatMap(op => op.alerts);
    const pendingAlerts = alerts.filter(a => !a.resolved);
    
    // Calculate average import factor
    const avgImportFactor = ops.length > 0
      ? ops.reduce((sum, op) => sum + (op.import_factor || 1), 0) / ops.length
      : 1;
    
    // Calculate monthly volume
    const monthlyVolume = ops
      .filter(op => {
        const opDate = new Date(op.eta_destination);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return opDate >= monthAgo;
      })
      .reduce((sum, op) => sum + (op.total_costs_usd || 0), 0);
    
    // Top suppliers
    const supplierMap = new Map<string, number>();
    ops.forEach(op => {
      const current = supplierMap.get(op.supplier_name) || 0;
      supplierMap.set(op.supplier_name, current + (op.total_costs_usd || 0));
    });
    
    const topSuppliers = Array.from(supplierMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    // Status distribution
    const statusMap = new Map<string, number>();
    ops.forEach(op => {
      const current = statusMap.get(op.status) || 0;
      statusMap.set(op.status, current + 1);
    });
    
    const statusDistribution = Array.from(statusMap.entries())
      .map(([status, value]) => ({
        name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status,
        value,
      }));
    
    return {
      activeImports: activeOps.length,
      pendingAlerts: pendingAlerts.length,
      avgImportFactor,
      monthlyVolume,
      weeklyTrend: 12.5, // TODO: Calculate actual trend
      topSuppliers,
      statusDistribution,
      recentActivity: [], // TODO: Fetch from activity logs
    };
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('import_operations')
        .select(`
          *,
          documents (id, validation_status),
          alerts (id, resolved)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ops = data as ImportOperation[];
      setOperations(ops);
      setMetrics(calculateMetrics(ops));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, calculateMetrics, supabase]);

  // Setup real-time subscription
  useEffect(() => {
    loadData();

    // Subscribe to changes
    const channel = supabase
      .channel(`dashboard-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'import_operations',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          loadData(); // Reload on any change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          loadData(); // Reload on alert changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, loadData, supabase]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Render loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        <Grid numItemsLg={4} className="gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-12 bg-gray-200 rounded w-3/4" />
            </Card>
          ))}
        </Grid>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last update indicator */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Panel de Control</h2>
        <Text className="text-sm text-gray-500">
          Última actualización: {lastUpdate.toLocaleTimeString('es-CO')}
        </Text>
      </div>

      {/* Key metrics */}
      <Grid numItemsLg={4} className="gap-6">
        {/* Active Imports */}
        <Card decoration="top" decorationColor="indigo">
          <div className="flex items-center justify-between">
            <div>
              <Text>Importaciones Activas</Text>
              <Metric>{metrics.activeImports}</Metric>
            </div>
            <Package className="h-8 w-8 text-indigo-600" />
          </div>
          <ProgressBar value={75} className="mt-2" />
        </Card>

        {/* Pending Alerts */}
        <Card decoration="top" decorationColor={metrics.pendingAlerts > 0 ? "rose" : "emerald"}>
          <div className="flex items-center justify-between">
            <div>
              <Text>Alertas Pendientes</Text>
              <Metric color={metrics.pendingAlerts > 0 ? "rose" : "emerald"}>
                {metrics.pendingAlerts}
              </Metric>
            </div>
            <AlertCircle className={cn(
              "h-8 w-8",
              metrics.pendingAlerts > 0 ? "text-rose-600" : "text-emerald-600"
            )} />
          </div>
          {metrics.pendingAlerts > 0 && (
            <Text className="mt-2 text-sm text-rose-600">
              Requiere atención inmediata
            </Text>
          )}
        </Card>

        {/* Average Import Factor */}
        <Card decoration="top" decorationColor="amber">
          <div className="flex items-center justify-between">
            <div>
              <Text>Factor de Importación</Text>
              <Metric>{metrics.avgImportFactor.toFixed(2)}x</Metric>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-600" />
          </div>
          <Text className="mt-2 text-sm">
            Objetivo: {"<"}1.20x
          </Text>
        </Card>

        {/* Monthly Volume */}
        <Card decoration="top" decorationColor="emerald">
          <div className="flex items-center justify-between">
            <div>
              <Text>Volumen Mensual</Text>
              <Metric>{formatUSD(metrics.monthlyVolume)}</Metric>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
          <Text className="mt-2 text-sm text-emerald-600">
            +{metrics.weeklyTrend}% vs semana anterior
          </Text>
        </Card>
      </Grid>

      {/* Charts and lists */}
      <Grid numItemsLg={3} className="gap-6">
        {/* Status Distribution */}
        <Card>
          <Text className="text-lg font-semibold mb-4">Estado de Operaciones</Text>
          <DonutChart
            data={metrics.statusDistribution}
            category="value"
            index="name"
            colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
            className="h-48"
          />
        </Card>

        {/* Top Suppliers */}
        <Card>
          <Text className="text-lg font-semibold mb-4">Principales Proveedores</Text>
          <BarList
            data={metrics.topSuppliers.map(s => ({
              ...s,
              value: s.value / 1000, // Convert to thousands
            }))}
            valueFormatter={(value) => `$${value.toFixed(0)}K USD`}
            className="mt-4"
          />
        </Card>

        {/* Recent Operations */}
        <Card>
          <Text className="text-lg font-semibold mb-4">Operaciones Recientes</Text>
          <div className="space-y-3">
            {operations.slice(0, 5).map((op) => (
              <div key={op.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    op.status === 'in_transit' ? "bg-yellow-500" :
                    op.status === 'in_customs' ? "bg-orange-500" :
                    op.status === 'cleared' ? "bg-green-500" : "bg-gray-500"
                  )} />
                  <div>
                    <Text className="font-medium">{op.reference_number}</Text>
                    <Text className="text-sm text-gray-500">{op.supplier_name}</Text>
                  </div>
                </div>
                <div className="text-right">
                  <Text className="font-medium">{formatUSD(op.total_costs_usd)}</Text>
                  <Text className="text-sm text-gray-500">
                    Factor: {op.import_factor?.toFixed(2) || '1.00'}x
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      {/* Upcoming events */}
      <Card>
        <Text className="text-lg font-semibold mb-4">Próximos Eventos</Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <Clock className="h-6 w-6 text-yellow-600" />
            <div>
              <Text className="font-medium">3 llegadas esta semana</Text>
              <Text className="text-sm text-gray-600">Preparar documentación</Text>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <div>
              <Text className="font-medium">2 pagos pendientes</Text>
              <Text className="text-sm text-gray-600">{formatCOP(850000000)}</Text>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <Text className="font-medium">5 despachos listos</Text>
              <Text className="text-sm text-gray-600">Coordinar transporte</Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Export with memo for performance
export default React.memo(RealTimeDashboard);