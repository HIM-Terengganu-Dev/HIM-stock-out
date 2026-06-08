'use client';

import { CheckCircle2, AlertCircle, X, Plus } from 'lucide-react';
import type { MissingMerchantSku } from '@/lib/analysis';

interface SkuNotificationProps {
  missingSkus: MissingMerchantSku[];
  onClose: () => void;
  onAddSku: (sku: string) => void;
}

export default function SkuNotification({ missingSkus, onClose, onAddSku }: SkuNotificationProps) {
  if (missingSkus.length === 0) {
    return (
      <div 
        role="status" 
        aria-live="polite"
        className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center shadow-lg animate-in fade-in slide-in-from-top duration-300 w-full"
      >
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-lg font-bold text-green-900 mb-1">All SKUs Present</h3>
        <p className="text-base text-green-800 font-medium">All merchant SKUs in the uploaded file are correctly matched with the database reference data.</p>
        <button
          onClick={onClose}
          className="mt-4 text-base font-semibold text-green-700 hover:text-green-950 underline underline-offset-4"
          aria-label="Dismiss successful SKU check notification"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div 
      role="alert" 
      aria-live="assertive"
      className="bg-red-50/70 border border-red-200 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-top duration-300 w-full backdrop-blur-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl text-red-600">
            <AlertCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-900">Missing SKUs Reference Data</h3>
            <p className="text-base text-red-700 font-medium mt-0.5">
              Found <span className="font-extrabold underline">{missingSkus.length}</span> merchant SKU{missingSkus.length !== 1 ? 's' : ''} not in the reference database. Please register them below to ensure complete stock-out calculations.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-700 hover:bg-red-100/50 p-2 rounded-xl transition-all"
          aria-label="Close missing SKU alert"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grid of missing SKUs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar p-1">
        {missingSkus.map((sku, index) => (
          <div
            key={index}
            className="bg-white border border-red-100/80 rounded-xl p-3 shadow-sm flex flex-col justify-between gap-3 hover:border-red-200 transition-all hover:shadow"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                  {sku.marketplace || 'Unknown'}
                </span>
              </div>
              <span className="font-mono font-bold text-gray-900 block truncate text-base" title={sku.merchant_sku}>
                {sku.merchant_sku}
              </span>
            </div>
            
            <button
              onClick={() => onAddSku(sku.merchant_sku)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg text-sm font-bold border border-blue-200 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Register SKU
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
