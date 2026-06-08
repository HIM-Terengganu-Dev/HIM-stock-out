'use client';

import { useMemo, useState } from 'react';
import { Layers, BarChart3, PieChart, TrendingUp, Inbox } from 'lucide-react';

interface VisualsViewProps {
  data: any[];
  dataKey?: string; // default: 'stock_out_quantity'
  categoryKey?: string; // default: 'product_category'
}

const COLORS = [
  'from-indigo-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-purple-500 to-violet-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-lime-500 to-green-600'
];

const HEX_COLORS = [
  '#6366f1', // indigo-500
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
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <Inbox className="w-10 h-10 text-slate-400 mb-2" />
        <p className="text-slate-500 font-medium">No data available for visualization</p>
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Toggle Switch Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Stock-Out Insights
        </h3>
        
        {/* Toggle Controls */}
        <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center self-start sm:self-center shadow-inner">
          <button
            onClick={() => setMode('quantity')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'quantity'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Quantity
          </button>
          <button
            onClick={() => setMode('count')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'count'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By SKU Count
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-50/60 to-blue-50/20 p-5 rounded-2xl border border-indigo-100/50 shadow-sm flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            {mode === 'quantity' ? 'Total Units Stocked-Out' : 'Total Affected Unique SKUs'}
          </span>
          <p className="text-3xl font-extrabold text-indigo-950 mt-2">
            {totalValue.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50/60 to-pink-50/20 p-5 rounded-2xl border border-purple-100/50 shadow-sm flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Top Category</span>
          <div>
            <p className="text-xl font-extrabold text-purple-950 truncate mt-2" title={aggregatedData[0]?.name}>
              {aggregatedData[0]?.name || '-'}
            </p>
            <p className="text-xs font-bold text-purple-700/80 mt-0.5">
              {aggregatedData[0]?.value.toLocaleString()} {mode === 'quantity' ? 'units' : 'SKUs'} ({((aggregatedData[0]?.value / (totalValue || 1)) * 100).toFixed(0)}%)
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/20 p-5 rounded-2xl border border-emerald-100/50 shadow-sm flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Impacted Categories</span>
          <p className="text-3xl font-extrabold text-emerald-950 mt-2">
            {aggregatedData.length}
          </p>
        </div>
      </div>

      {/* Charts Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Chart Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Category Distribution ({mode === 'quantity' ? 'Qty' : 'SKU Count'})
          </h4>
          <div className="space-y-4.5">
            {aggregatedData.map((item, index) => {
              const maxVal = aggregatedData[0]?.value || 1;
              const percentOfMax = (item.value / maxVal) * 100;
              const percentOfTotal = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
              const gradClass = COLORS[index % COLORS.length];

              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-700">
                    <span className="truncate pr-3 font-semibold">{item.name}</span>
                    <span className="font-bold">
                      {item.value.toLocaleString()} <span className="text-slate-400 font-medium">({percentOfTotal.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
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

        {/* Donut Chart Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Proportion Distribution
          </h4>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            
            {/* SVG Donut Container */}
            <div className="relative w-48 h-48 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="stroke-slate-100"
                  strokeWidth="10"
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
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="314.159"
                    strokeDashoffset={segment.strokeDashoffset}
                    className="transition-all duration-1000 ease-out origin-center"
                    style={{
                      transform: `rotate(${segment.rotation}deg)`,
                    }}
                    strokeLinecap={segment.percent > 0.03 ? 'round' : 'butt'}
                  />
                ))}
              </svg>
              {/* Central text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-xl font-extrabold text-slate-900 leading-none my-0.5">{totalValue.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {mode === 'quantity' ? 'units' : 'SKUs'}
                </span>
              </div>
            </div>

            {/* Legend Column */}
            <div className="flex-1 space-y-2.5 w-full">
              {donutSegments.map((segment) => (
                <div key={segment.name} className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <div
                    className="w-3.5 h-3.5 rounded-lg shrink-0 border border-white shadow-sm"
                    style={{ backgroundColor: segment.hexColor }}
                  />
                  <div className="flex-1 flex justify-between items-center font-bold text-slate-700 min-w-0">
                    <span className="truncate pr-2 font-semibold">{segment.name}</span>
                    <span className="text-slate-400 font-medium">{(segment.percent * 100).toFixed(0)}%</span>
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
