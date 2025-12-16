'use client';

import { useState } from 'react';

interface ReportDisplayProps {
  title: string;
  dateRange?: string;
  data: Array<{ merchant_sku: string; product_category?: string; stock_out_quantity: number }>;
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
            <h2 className="text-xl font-semibold">{title}</h2>
            {dateRange && (
              <p className="text-sm text-gray-500 mt-1">Date Range: {dateRange}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMerchantSku(!showMerchantSku)}
              className={`px-3 py-2 rounded transition-colors ${
                showMerchantSku 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={showMerchantSku ? "Hide Merchant SKU" : "Show Merchant SKU"}
            >
              {showMerchantSku ? (
                // Eye open icon
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                // Eye closed icon
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export to Excel
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="mb-4 text-sm text-gray-600">
        <p>Total Stock-Out Quantity: <span className="font-semibold">{totalQuantity}</span></p>
        <p>Unique Merchant SKUs: <span className="font-semibold">{data.length}</span></p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {showMerchantSku && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Merchant SKU
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock-Out Quantity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {showMerchantSku && (
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.merchant_sku}
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.product_category || '-'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
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


