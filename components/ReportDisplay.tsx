'use client';

import { useState } from 'react';
import { Download, Eye, EyeOff } from 'lucide-react';

interface ReportDisplayProps {
  title: string;
  dateRange?: string;
  data: Array<{ merchant_sku: string; product_category?: string; stock_out_quantity: number; marketplace?: string }>;
  onExport: () => void;
  hideExportButton?: boolean;
}

export default function ReportDisplay({ title, dateRange, data, onExport, hideExportButton = false }: ReportDisplayProps) {
  const [showMerchantSku, setShowMerchantSku] = useState(false);

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 border border-dashed border-slate-200 rounded-2xl">
        No records found for this view.
      </div>
    );
  }

  const totalQuantity = data.reduce((sum, item) => sum + item.stock_out_quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header section inside display */}
      {title && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
            {dateRange && (
              <p className="text-sm font-semibold text-slate-500 mt-1">Date Range: {dateRange}</p>
            )}
          </div>
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setShowMerchantSku(!showMerchantSku)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 ${
                showMerchantSku 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/50' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50/80'
              }`}
              aria-label={showMerchantSku ? "Hide Merchant SKU column" : "Show Merchant SKU column"}
              title={showMerchantSku ? "Hide Merchant SKU" : "Show Merchant SKU"}
            >
              {showMerchantSku ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide SKUs
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show SKUs
                </>
              )}
            </button>
            {!hideExportButton && (
              <button
                onClick={onExport}
                aria-label={`Export ${title} data to Excel`}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-100/30 hover:shadow-emerald-200/40 transition-all active:scale-95 text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300/60">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stock-Out Units</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{totalQuantity.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300/60">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unique Products Affected</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{data.length.toLocaleString()}</p>
        </div>
      </div>

      {/* Styled Data Table */}
      <div className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/70" aria-label={`${title} Data Table`}>
            <thead className="bg-slate-50/70">
              <tr>
                {data[0]?.marketplace && (
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Marketplace
                  </th>
                )}
                {showMerchantSku && (
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Merchant SKU
                  </th>
                )}
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Product Category
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Stock-Out Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40 transition-colors even:bg-slate-50/10">
                  {data[0]?.marketplace && (
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/50">
                        {item.marketplace || '-'}
                      </span>
                    </td>
                  )}
                  {showMerchantSku && (
                    <td className="px-5 py-4 text-sm font-mono font-bold text-indigo-700">
                      {item.merchant_sku}
                    </td>
                  )}
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">
                    {item.product_category || 'Other / Uncategorized'}
                  </td>
                  <td className="px-5 py-4 text-sm font-extrabold text-slate-900 text-right">
                    {item.stock_out_quantity.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
