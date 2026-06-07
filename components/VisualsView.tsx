'use client';

import { useMemo, useState } from 'react';

interface VisualsViewProps {
  data: any[];
  dataKey?: string; // default: 'stock_out_quantity'
  categoryKey?: string; // default: 'product_category'
}

const COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-purple-500 to-violet-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-lime-500 to-green-600'
];

const HEX_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#8b5cf6', // purple-500
  '#06b6d4', // cyan-500
  '#d946ef', // fuchsia-500
  '#84cc16'  // lime-500
];

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

  // Donut chart calculations
  const donutSegments = useMemo(() => {
    let accumulatedPercent = 0;
    return aggregatedData.map((item, index) => {
      const percent = totalValue > 0 ? item.value / totalValue : 0;
      const strokeDashoffset = 314.159 - (314.159 * percent);
      const rotation = accumulatedPercent * 360;
      accumulatedPercent += percent;
      return {
        ...item,
        percent,
        strokeDashoffset,
        rotation,
        colorClass: COLORS[index % COLORS.length],
        hexColor: HEX_COLORS[index % HEX_COLORS.length]
      };
    });
  }, [aggregatedData, totalValue]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* High-Contrast Toggle Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Visual Insights Dashboard</h2>
        <button
          onClick={() => setMode(mode === 'quantity' ? 'count' : 'quantity')}
          className="text-base font-bold text-blue-600 hover:text-blue-800 transition-all bg-white border border-blue-200 hover:border-blue-400 rounded-lg px-4 py-2 shadow-sm"
          aria-pressed={mode === 'count'}
          title={`Switch to ${mode === 'quantity' ? 'Count' : 'Quantity'} view`}
        >
          {mode === 'quantity' ? 'Show SKU Count' : 'Show Total Quantity'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-base font-bold text-blue-700 uppercase tracking-wide">
            {mode === 'quantity' ? 'Total Stock-Out Quantity' : 'Total Affected SKUs'}
          </p>
          <p className="text-3xl font-black text-blue-900 mt-2">
            {totalValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-base font-bold text-purple-700 uppercase tracking-wide">Top Category</p>
          <p className="text-2xl font-black text-purple-900 mt-2 truncate" title={aggregatedData[0]?.name}>
            {aggregatedData[0]?.name || '-'}
          </p>
          <p className="text-base font-semibold text-purple-600 mt-1">
            {aggregatedData[0]?.value.toLocaleString()} {mode === 'quantity' ? 'units' : 'SKUs'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-base font-bold text-green-700 uppercase tracking-wide">Categories Impacted</p>
          <p className="text-3xl font-black text-green-900 mt-2">
            {aggregatedData.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Custom Bar Chart (Horizontal progress bars) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {mode === 'quantity' ? 'Stock-Outs by Category (Qty)' : 'Stock-Outs by Category (SKU Count)'}
          </h3>
          <div className="space-y-6">
            {aggregatedData.map((item, index) => {
              const maxVal = aggregatedData[0]?.value || 1;
              const percentOfMax = (item.value / maxVal) * 100;
              const percentOfTotal = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
              const gradClass = COLORS[index % COLORS.length];

              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
                    <span className="truncate pr-4">{item.name}</span>
                    <span>
                      {item.value.toLocaleString()} <span className="text-gray-400 font-normal">({percentOfTotal.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${gradClass} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${percentOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Donut Chart (SVG circular segments) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Category Distribution ({mode === 'quantity' ? 'Qty' : 'Count'})</h3>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* SVG Donut */}
            <div className="relative w-64 h-64 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="stroke-gray-100"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Segments */}
                {donutSegments.map((segment) => (
                  <circle
                    key={segment.name}
                    cx="60"
                    cy="60"
                    r="50"
                    stroke={segment.hexColor}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="314.159"
                    strokeDashoffset={segment.strokeDashoffset}
                    className="transition-all duration-1000 ease-out origin-center"
                    style={{
                      transform: `rotate(${segment.rotation}deg)`,
                    }}
                    strokeLinecap={segment.percent > 0.02 ? 'round' : 'butt'}
                  />
                ))}
              </svg>
              {/* Central Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</span>
                <span className="text-2xl font-black text-gray-800">{totalValue.toLocaleString()}</span>
                <span className="text-xs font-semibold text-gray-500">
                  {mode === 'quantity' ? 'units' : 'SKUs'}
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 space-y-3 w-full">
              {donutSegments.map((segment) => (
                <div key={segment.name} className="flex items-center gap-3 text-sm">
                  <div
                    className="w-4 h-4 rounded-md shrink-0"
                    style={{ backgroundColor: segment.hexColor }}
                  />
                  <div className="flex-1 flex justify-between items-center font-medium text-gray-700 min-w-0">
                    <span className="truncate pr-2">{segment.name}</span>
                    <span className="font-bold whitespace-nowrap">{(segment.percent * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
