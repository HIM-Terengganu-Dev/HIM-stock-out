'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag, Layers, AlertCircle, CheckCircle } from 'lucide-react';

interface Component {
  qty: number;
  component_merchant_sku: string;
  component_merchant_sku_norm: string;
}

interface AddSkuModalProps {
  sku: string;
  onClose: () => void;
  onSave: () => void;
}

export default function AddSkuModal({ sku, onClose, onSave }: AddSkuModalProps) {
  const [activeType, setActiveType] = useState<'single' | 'combo'>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dropdown / Auto-complete options
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [saleClasses, setSaleClasses] = useState<string[]>([]);
  const [singleSkuOptions, setSingleSkuOptions] = useState<string[]>([]);

  // Form states
  const [singleForm, setSingleForm] = useState({
    merchant_sku: sku,
    product_category: '',
    sale_class: '',
  });

  const [comboForm, setComboForm] = useState({
    merchant_sku: sku,
    components: [] as Component[],
  });

  const [newComponent, setNewComponent] = useState({
    qty: 1,
    component_merchant_sku: '',
  });

  // Load dropdown options on mount
  useEffect(() => {
    const loadDropdownOptions = async () => {
      try {
        const response = await fetch('/api/merchant-skus/dropdowns', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load dropdown options');
        const data = await response.json();
        setProductCategories(data.productCategories || []);
        setSaleClasses(data.saleClasses || []);
        setSingleSkuOptions(data.singleSkus || []);
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      }
    };
    loadDropdownOptions();
  }, []);

  // Update form fields if prop sku changes
  useEffect(() => {
    setSingleForm(prev => ({ ...prev, merchant_sku: sku }));
    setComboForm(prev => ({ ...prev, merchant_sku: sku }));
  }, [sku]);

  const handleSaveSingle = async () => {
    if (!singleForm.merchant_sku.trim() || !singleForm.product_category.trim()) {
      setError('Merchant SKU and Product Category are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/merchant-skus/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_sku: singleForm.merchant_sku.trim(),
          product_category: singleForm.product_category.trim(),
          sale_class: singleForm.sale_class.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save single SKU');
      }

      setSuccess('Single SKU registered successfully!');
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save single SKU');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCombo = async () => {
    if (!comboForm.merchant_sku.trim()) {
      setError('Merchant SKU is required');
      return;
    }
    if (comboForm.components.length === 0) {
      setError('At least one component is required for a Combo SKU');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/merchant-skus/combo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_sku: comboForm.merchant_sku.trim(),
          components: comboForm.components,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save combo SKU');
      }

      setSuccess('Combo SKU registered successfully!');
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save combo SKU');
    } finally {
      setLoading(false);
    }
  };

  const addComponent = () => {
    if (!newComponent.component_merchant_sku) {
      setError('Please select a component SKU');
      return;
    }

    // Check if component already exists in list
    const exists = comboForm.components.some(
      c => c.component_merchant_sku === newComponent.component_merchant_sku
    );

    if (exists) {
      setError(`Component "${newComponent.component_merchant_sku}" is already in the list. Modify its quantity instead.`);
      return;
    }

    setError(null);
    setComboForm({
      ...comboForm,
      components: [
        ...comboForm.components,
        {
          qty: newComponent.qty,
          component_merchant_sku: newComponent.component_merchant_sku,
          component_merchant_sku_norm: newComponent.component_merchant_sku.toUpperCase(),
        },
      ],
    });
    setNewComponent({ qty: 1, component_merchant_sku: '' });
  };

  const removeComponent = (index: number) => {
    setComboForm({
      ...comboForm,
      components: comboForm.components.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Register SKU</h3>
            <p className="text-sm text-blue-100 mt-0.5 font-medium">Define product details for stock-out matching</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Switcher */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveType('single');
              setError(null);
            }}
            className={`flex-1 py-4 text-center font-semibold text-base transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeType === 'single'
                ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
            }`}
          >
            <Tag className="w-4 h-4" />
            Single SKU
          </button>
          <button
            onClick={() => {
              setActiveType('combo');
              setError(null);
            }}
            className={`flex-1 py-4 text-center font-semibold text-base transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeType === 'combo'
                ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Combo / Bundle SKU
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Merchant SKU Name
              </label>
              <input
                type="text"
                value={activeType === 'single' ? singleForm.merchant_sku : comboForm.merchant_sku}
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeType === 'single') {
                    setSingleForm(prev => ({ ...prev, merchant_sku: val }));
                  } else {
                    setComboForm(prev => ({ ...prev, merchant_sku: val }));
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                placeholder="e.g. HIMCOFFEE_5PACK"
              />
            </div>

            {activeType === 'single' ? (
              <>
                {/* Single SKU Fields */}
                <div>
                  <label htmlFor="product_category_modal" className="block text-sm font-semibold text-gray-700 mb-1">
                    Product Category *
                  </label>
                  <input
                    id="product_category_modal"
                    type="text"
                    list="modalProductCategories"
                    placeholder="Select or type category (e.g. HIM Coffee)"
                    value={singleForm.product_category}
                    onChange={(e) => setSingleForm(prev => ({ ...prev, product_category: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                  <datalist id="modalProductCategories">
                    {productCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="sale_class_modal" className="block text-sm font-semibold text-gray-700 mb-1">
                    Sale Class
                  </label>
                  <input
                    id="sale_class_modal"
                    type="text"
                    list="modalSaleClasses"
                    placeholder="Select or type class (Optional)"
                    value={singleForm.sale_class}
                    onChange={(e) => setSingleForm(prev => ({ ...prev, sale_class: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                  <datalist id="modalSaleClasses">
                    {saleClasses.map((sc) => (
                      <option key={sc} value={sc} />
                    ))}
                  </datalist>
                </div>
              </>
            ) : (
              <>
                {/* Combo SKU Fields */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Bundle Composition
                  </h4>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      aria-label="Component SKU Quantity"
                      placeholder="Qty"
                      min="1"
                      value={newComponent.qty}
                      onChange={(e) => setNewComponent(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-xl text-center text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                    
                    <select
                      aria-label="Component SKU Select"
                      value={newComponent.component_merchant_sku}
                      onChange={(e) => setNewComponent(prev => ({ ...prev, component_merchant_sku: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all shadow-sm"
                    >
                      <option value="">Select Single SKU Component</option>
                      {singleSkuOptions.map((skuOption) => (
                        <option key={skuOption} value={skuOption}>
                          {skuOption}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      type="button"
                      onClick={addComponent}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
                    >
                      Add
                    </button>
                  </div>

                  {/* Components List */}
                  <div className="space-y-2 mt-3 max-h-[160px] overflow-y-auto pr-1">
                    {comboForm.components.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4 bg-white rounded-xl border border-dashed border-gray-200">
                        No components added yet. Add at least one Single SKU.
                      </p>
                    ) : (
                      comboForm.components.map((comp, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg border border-blue-100">
                              {comp.qty}x
                            </span>
                            <span className="font-mono text-sm text-gray-700 font-semibold">{comp.component_merchant_sku}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeComponent(idx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            aria-label={`Remove component ${comp.component_merchant_sku}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all text-base shadow-sm"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={activeType === 'single' ? handleSaveSingle : handleSaveCombo}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 text-base flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Save SKU'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
