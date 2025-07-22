import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import type { ProcessedProduct } from '@/types';

interface ProductDetailModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Selected product SKU */
  productCode: string | null;
  /** Full product list across all periods */
  productsHistory: ProcessedProduct[];
  /** Close handler */
  onClose: () => void;
}

interface HistoricalPoint {
  period: string;
  currentStock: number;
  revenue: number;
  margin: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  productCode,
  productsHistory,
  onClose
}) => {
  const historicalData = useMemo<HistoricalPoint[]>(() => {
    if (!productCode) return [];
    const entries = productsHistory
      .filter((p) => p.code === productCode)
      .sort((a, b) => a.period.localeCompare(b.period));

    return entries.map((p) => ({
      period: p.period,
      currentStock: p.currentStock,
      revenue: p.revenue,
      margin: p.margin
    }));
  }, [productCode, productsHistory]);

  if (!isOpen || !productCode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Historical Trend • {productCode}
        </h2>

        {historicalData.length === 0 ? (
          <p className="text-gray-600">No historical data available for this product.</p>
        ) : (
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={historicalData} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="period" className="text-xs" angle={-45} textAnchor="end" height={60} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  className="text-xs"
                  tickFormatter={(v) => v.toLocaleString()}
                  label={{ value: 'Stock', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  className="text-xs"
                  tickFormatter={(v) => formatCurrency(v)}
                  label={{ value: 'Revenue / Margin', angle: 90, position: 'insideRight' }}
                />
                <Tooltip formatter={(value: number, name: string) => (name === 'margin' ? `${value.toFixed(1)}%` : formatCurrency(value))} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="currentStock"
                  stroke="#3B82F6"
                  name="Current Stock"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  name="Revenue"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="margin"
                  stroke="#F59E0B"
                  name="Margin %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}; 