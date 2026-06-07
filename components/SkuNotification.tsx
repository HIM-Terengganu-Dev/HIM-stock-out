'use client';

import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import type { MissingMerchantSku } from '@/lib/analysis';

interface SkuNotificationProps {
  missingSkus: MissingMerchantSku[];
  onClose: () => void;
}

export default function SkuNotification({ missingSkus, onClose }: SkuNotificationProps) {
  if (missingSkus.length === 0) {
    return (
      <div className="w-1/4 flex items-center justify-center p-6">
        <div 
          role="status" 
          aria-live="polite"
          className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center shadow-lg animate-in fade-in slide-in-from-left duration-300 w-full"
        >
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-xl font-bold text-green-900 mb-2">All SKUs Present</h3>
          <p className="text-base text-green-800 font-medium">All merchant SKUs in the file are found in the reference data.</p>
          <button
            onClick={onClose}
            className="mt-6 text-base font-semibold text-green-700 hover:text-green-900 underline underline-offset-4"
            aria-label="Dismiss successful SKU check notification"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/4 flex items-start justify-center p-6">
      <div 
        role="alert" 
        aria-live="assertive"
        className="bg-red-50 border-2 border-red-200 rounded-xl p-8 shadow-xl animate-in fade-in slide-in-from-left duration-300 max-h-[90vh] overflow-y-auto w-full"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-red-600" aria-hidden="true" />
            <h3 className="text-xl font-bold text-red-900">Missing SKUs Detected</h3>
          </div>
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-900 transition-colors p-1"
            aria-label="Close missing SKU alert"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-base text-red-800 mb-6 font-medium">
          Found <span className="font-bold underline">{missingSkus.length}</span> merchant SKU{missingSkus.length !== 1 ? 's' : ''} not in reference data.
        </p>

        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {missingSkus.slice(0, 20).map((sku, index) => (
            <div
              key={index}
              className="bg-white border border-red-100 rounded-lg p-3 text-base shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-red-900">{sku.merchant_sku}</span>
                {sku.marketplace && (
                  <span className="text-red-600 font-semibold bg-red-50 px-2 py-1 rounded text-base">{sku.marketplace}</span>
                )}
              </div>
            </div>
          ))}
          {missingSkus.length > 20 && (
            <p className="text-base font-bold text-red-600 text-center pt-3 italic">
              ... and {missingSkus.length - 20} more
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 text-base font-bold text-red-600 hover:text-red-800 underline underline-offset-4 p-2 transition-all"
          aria-label="Dismiss missing SKU warnings"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
