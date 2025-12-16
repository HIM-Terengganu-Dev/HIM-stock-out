'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface VisualsViewProps {
  data: any[];
  dataKey?: string; // default: 'stock_out_quantity'
  categoryKey?: string; // default: 'product_category'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function VisualsView({
  data,
  dataKey = 'stock_out_quantity',
  categoryKey = 'product_category'
}: VisualsViewProps) {
  const [mode, setMode] = useState<'quantity' | 'count'>('quantity');

  // Aggregate data by category
  const aggregatedData = useMemo(() => {
    const map = new Map<string, { quantity: number; count: number }>();

    data.forEach(item => {
      const category = item[categoryKey] || 'Uncategorized';
      const quantityValue = Number(item[dataKey]) || 0;

      const current = map.get(category) || { quantity: 0, count: 0 };
      map.set(category, {
        quantity: current.quantity + quantityValue,
        count: current.count + 1
      });
    });

    return Array.from(map.entries())
      .map(([name, stats]) => ({
        name,
        value: mode === 'quantity' ? stats.quantity : stats.count,
        quantity: stats.quantity,
        count: stats.count
      }))
      .sort((a, b) => b.value - a.value); // Sort descending based on active mode
  }, [data, dataKey, categoryKey, mode]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for visualization</p>
      </div>
    );
  }

  const totalValue = aggregatedData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Subtle Toggle Button */}
      <div className="absolute top-0 right-0 z-10">
        <button
          onClick={() => setMode(mode === 'quantity' ? 'count' : 'quantity')}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors bg-transparent border border-transparent hover:border-gray-200 rounded px-2 py-1"
          title={`Switch to ${mode === 'quantity' ? 'Count' : 'Quantity'} view`}
        >
          {mode === 'quantity' ? 'Show Count' : 'Show Quantity'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-sm font-medium text-blue-600">
            {mode === 'quantity' ? 'Total Stock-Out Quantity' : 'Total Affected SKUs'}
          </p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {totalValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <p className="text-sm font-medium text-purple-600">Top Category</p>
          <p className="text-xl font-bold text-purple-900 mt-1 truncate" title={aggregatedData[0]?.name}>
            {aggregatedData[0]?.name || '-'}
          </p>
          <p className="text-xs text-purple-500 mt-1">
            {aggregatedData[0]?.value.toLocaleString()} {mode === 'quantity' ? 'units' : 'SKUs'}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-sm font-medium text-green-600">Categories Impacted</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {aggregatedData.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            {mode === 'quantity' ? 'Stock-Outs by Category (Qty)' : 'Stock-Outs by Category (SKU Count)'}
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregatedData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} ${mode === 'quantity' ? 'units' : 'SKUs'}`, mode === 'quantity' ? 'Stock-Out Qty' : 'Count']}
                />
                <Bar dataKey="value" fill="#0088FE" radius={[0, 4, 4, 0]}>
                  {aggregatedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Category Distribution ({mode === 'quantity' ? 'Qty' : 'Count'})</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregatedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                    return percent > 0.05 ? (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    ) : null;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {aggregatedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} ${mode === 'quantity' ? 'units' : 'SKUs'}`, mode === 'quantity' ? 'Stock-Out Qty' : 'Count']}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
