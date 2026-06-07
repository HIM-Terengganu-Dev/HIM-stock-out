'use client';

import { useState } from 'react';

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
    return null;
  }

  const totalQuantity = data.reduce((sum, item) => sum + item.stock_out_quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {dateRange && (
              <p className="text-base text-gray-500 mt-2 font-medium">Date Range: {dateRange}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMerchantSku(!showMerchantSku)}
              className={`px-4 py-2.5 rounded-xl transition-all duration-200 border ${
                showMerchantSku 
                  ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={showMerchantSku ? "Hide Merchant SKU column" : "Show Merchant SKU column"}
              title={showMerchantSku ? "Hide Merchant SKU" : "Show Merchant SKU"}
            >
              {showMerchantSku ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              )}
            </button>
            {!hideExportButton && (
              <button
                onClick={onExport}
                aria-label={`Export ${title} data to Excel`}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-sm transition-all duration-200"
              >
                Export to Excel
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="mb-6 text-base text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-8">
        <p>Total Quantity: <span className="font-bold text-gray-900">{totalQuantity}</span></p>
        <p>Unique SKUs: <span className="font-bold text-gray-900">{data.length}</span></p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" aria-label={`${title} Data Table`}>
          <thead className="bg-gray-50">
            <tr>
              {data[0]?.marketplace && (
                <th className="px-4 py-4 text-left text-base font-bold text-gray-700 uppercase tracking-wide">
                  Marketplace
                </th>
              )}
              {showMerchantSku && (
                <th className="px-4 py-4 text-left text-base font-bold text-gray-700 uppercase tracking-wide">
                  Merchant SKU
                </th>
              )}
              <th className="px-4 py-4 text-left text-base font-bold text-gray-700 uppercase tracking-wide">
                Product Category
              </th>
              <th className="px-4 py-4 text-left text-base font-bold text-gray-700 uppercase tracking-wide">
                Quantity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                {data[0]?.marketplace && (
                  <td className="px-4 py-4 text-base font-medium text-gray-900 border-b border-gray-50">
                    {item.marketplace || '-'}
                  </td>
                )}
                {showMerchantSku && (
                  <td className="px-4 py-4 text-base font-mono font-bold text-blue-700 border-b border-gray-50">
                    {item.merchant_sku}
                  </td>
                )}
                <td className="px-4 py-4 text-base text-gray-700 border-b border-gray-50">
                  {item.product_category || '-'}
                </td>
                <td className="px-4 py-4 text-base font-bold text-gray-900 border-b border-gray-50">
                  {item.stock_out_quantity.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


