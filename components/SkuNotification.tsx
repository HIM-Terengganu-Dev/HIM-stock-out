'use client';

import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { exportMissingMerchantSkus } from '@/lib/excelUtils';
import type { MissingMerchantSku } from '@/lib/analysis';

interface SkuNotificationProps {
  missingSkus: MissingMerchantSku[];
  onClose: () => void;
}

export default function SkuNotification({ missingSkus, onClose }: SkuNotificationProps) {
  if (missingSkus.length === 0) {
    return (
      <div className="w-1/4 flex items-center justify-center p-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center shadow-lg animate-in fade-in slide-in-from-left duration-300 w-full">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">All SKUs Present</h3>
          <p className="text-sm text-green-700">All merchant SKUs in the file are found in the reference data.</p>
          <button
            onClick={onClose}
            className="mt-4 text-xs text-green-600 hover:text-green-800 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const filename = `missing_merchant_skus_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportMissingMerchantSkus(missingSkus, filename);
  };

  return (
    <div className="w-1/4 flex items-start justify-center p-6">
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 shadow-lg animate-in fade-in slide-in-from-left duration-300 max-h-[90vh] overflow-y-auto w-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Missing SKUs Detected</h3>
          </div>
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-800 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-red-700 mb-4">
          Found <strong>{missingSkus.length}</strong> merchant SKU{missingSkus.length !== 1 ? 's' : ''} not in reference data.
        </p>

        <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
          {missingSkus.slice(0, 20).map((sku, index) => (
            <div
              key={index}
              className="bg-white border border-red-200 rounded p-2 text-sm"
            >
              <span className="font-mono text-red-800">{sku.merchant_sku}</span>
              {sku.marketplace && (
                <span className="text-red-600 text-xs ml-2">({sku.marketplace})</span>
              )}
            </div>
          ))}
          {missingSkus.length > 20 && (
            <p className="text-xs text-red-600 text-center pt-2">
              ... and {missingSkus.length - 20} more
            </p>
          )}
        </div>

        <button
          onClick={handleExport}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Export Missing SKUs to Excel
        </button>
        
        <button
          onClick={onClose}
          className="w-full mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
