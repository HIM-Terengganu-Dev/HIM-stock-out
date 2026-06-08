'use client';

import { useState, useEffect } from 'react';

interface SingleSku {
  merchant_sku: string;
  merchant_sku_norm: string;
  product_category: string;
  sale_class: string;
}

interface ComboSku {
  merchant_sku: string;
  merchant_sku_norm: string;
  components: Array<{
    qty: number;
    component_merchant_sku: string;
    component_merchant_sku_norm: string;
  }>;
}

interface Component {
  qty: number;
  component_merchant_sku: string;
  component_merchant_sku_norm: string;
}

export default function MerchantSkuManager() {
  const [activeType, setActiveType] = useState<'single' | 'combo'>('single');
  const [singleSkus, setSingleSkus] = useState<SingleSku[]>([]);
  const [comboSkus, setComboSkus] = useState<ComboSku[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dropdown options
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [saleClasses, setSaleClasses] = useState<string[]>([]);
  const [singleSkuOptions, setSingleSkuOptions] = useState<string[]>([]);

  // Form states
  const [showSingleForm, setShowSingleForm] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);
  const [editingSingle, setEditingSingle] = useState<SingleSku | null>(null);
  const [editingCombo, setEditingCombo] = useState<ComboSku | null>(null);

  // Single SKU form
  const [singleForm, setSingleForm] = useState({
    merchant_sku: '',
    product_category: '',
    sale_class: '',
  });

  // Combo SKU form
  const [comboForm, setComboForm] = useState({
    merchant_sku: '',
    components: [] as Component[],
  });
  const [newComponent, setNewComponent] = useState({
    qty: 1,
    component_merchant_sku: '',
    component_merchant_sku_norm: '',
  });

  useEffect(() => {
    loadData();
    loadDropdownOptions();
  }, []);

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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/merchant-skus', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load data');
      const data = await response.json();
      setSingleSkus(data.single || []);
      setComboSkus(data.combo || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load merchant SKUs');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSingle = async () => {
    if (!singleForm.merchant_sku || !singleForm.product_category) {
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
        body: JSON.stringify(singleForm),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to save';
        const details = data.details ? ` (${data.details})` : '';
        throw new Error(`${errorMsg}${details}`);
      }

      await loadData();
      await loadDropdownOptions(); // Refresh dropdowns in case new categories/classes were added
      setShowSingleForm(false);
      setEditingSingle(null);
      setSingleForm({ merchant_sku: '', product_category: '', sale_class: '' });
      setSuccess('Single SKU saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save single SKU';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (merchant_sku: string) => {
    if (!confirm(`Delete single SKU "${merchant_sku}"?`)) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/merchant-skus/single?merchant_sku=${encodeURIComponent(merchant_sku)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      await loadData();
      await loadDropdownOptions(); // Refresh dropdowns after deletion
      setSuccess('Single SKU deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete single SKU');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSingle = (sku: SingleSku) => {
    setEditingSingle(sku);
    setSingleForm({
      merchant_sku: sku.merchant_sku,
      product_category: sku.product_category || '',
      sale_class: sku.sale_class || '',
    });
    setShowSingleForm(true);
  };

  const handleSaveCombo = async () => {
    if (!comboForm.merchant_sku || comboForm.components.length === 0) {
      setError('Merchant SKU and at least one component are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/merchant-skus/combo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comboForm),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to save';
        const details = data.details ? ` (${data.details})` : '';
        throw new Error(`${errorMsg}${details}`);
      }

      await loadData();
      await loadDropdownOptions(); // Refresh dropdowns in case new single SKUs were added
      setShowComboForm(false);
      setEditingCombo(null);
      setComboForm({ merchant_sku: '', components: [] });
      setSuccess('Combo SKU saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save combo SKU';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCombo = async (merchant_sku: string) => {
    if (!confirm(`Delete combo SKU "${merchant_sku}"?`)) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/merchant-skus/combo?merchant_sku=${encodeURIComponent(merchant_sku)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      await loadData();
      await loadDropdownOptions(); // Refresh dropdowns after deletion
      setSuccess('Combo SKU deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete combo SKU');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCombo = (sku: ComboSku) => {
    setEditingCombo(sku);
    setComboForm({
      merchant_sku: sku.merchant_sku,
      components: sku.components || [],
    });
    setShowComboForm(true);
  };

  const addComponent = () => {
    if (!newComponent.component_merchant_sku) {
      setError('Component SKU is required');
      return;
    }
    setComboForm({
      ...comboForm,
      components: [
        ...comboForm.components,
        {
          qty: newComponent.qty,
          component_merchant_sku: newComponent.component_merchant_sku,
          component_merchant_sku_norm: newComponent.component_merchant_sku_norm || newComponent.component_merchant_sku.toUpperCase(),
        },
      ],
    });
    setNewComponent({ qty: 1, component_merchant_sku: '', component_merchant_sku_norm: '' });
  };

  const removeComponent = (index: number) => {
    setComboForm({
      ...comboForm,
      components: comboForm.components.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Merchant SKU Registry</h2>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">Add, edit, or delete single products and combo packages.</p>
        </div>
        <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl self-start sm:self-center">
          ✅ Connected directly to Postgres
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {/* Segmented Control Selector */}
      <div className="bg-slate-100/70 p-1 rounded-xl shadow-inner inline-flex gap-1">
        <button
          onClick={() => setActiveType('single')}
          role="tab"
          aria-selected={activeType === 'single'}
          aria-controls="single-sku-panel"
          className={`py-2 px-5 rounded-lg font-bold text-xs transition-all ${
            activeType === 'single'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Single SKUs ({singleSkus.length})
        </button>
        <button
          onClick={() => setActiveType('combo')}
          role="tab"
          aria-selected={activeType === 'combo'}
          aria-controls="combo-sku-panel"
          className={`py-2 px-5 rounded-lg font-bold text-xs transition-all ${
            activeType === 'combo'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Combo SKUs ({comboSkus.length})
        </button>
      </div>

      {activeType === 'single' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-slate-800">Single Product Directory</h3>
            <button
              onClick={() => {
                setShowSingleForm(true);
                setEditingSingle(null);
                setSingleForm({ merchant_sku: '', product_category: '', sale_class: '' });
              }}
              className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100 text-sm transition-all active:scale-95"
            >
              + Add Product SKU
            </button>
          </div>

          {showSingleForm && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold mb-3">{editingSingle ? 'Edit' : 'Add'} Single SKU</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="merchant_sku" className="block text-base font-medium text-gray-700 mb-1">Merchant SKU *</label>
                  <input
                    id="merchant_sku"
                    type="text"
                    value={singleForm.merchant_sku}
                    onChange={(e) => setSingleForm({ ...singleForm, merchant_sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-base"
                    disabled={!!editingSingle}
                  />
                </div>
                <div>
                  <label htmlFor="product_category" className="block text-base font-medium text-gray-700 mb-1">Product Category *</label>
                  <input
                    id="product_category"
                    type="text"
                    list="productCategoriesList"
                    placeholder="Select or Type Product Category"
                    value={singleForm.product_category}
                    onChange={(e) => setSingleForm({ ...singleForm, product_category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-base"
                  />
                  <datalist id="productCategoriesList">
                    {productCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="sale_class" className="block text-base font-medium text-gray-700 mb-1">Sale Class</label>
                  <input
                    id="sale_class"
                    type="text"
                    list="saleClassesList"
                    placeholder="Select or Type Sale Class (Optional)"
                    value={singleForm.sale_class}
                    onChange={(e) => setSingleForm({ ...singleForm, sale_class: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-base"
                  />
                  <datalist id="saleClassesList">
                    {saleClasses.map((saleClass) => (
                      <option key={saleClass} value={saleClass} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSaveSingle}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSingleForm(false);
                    setEditingSingle(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Merchant SKU</th>
                  <th className="px-4 py-3 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Product Category</th>
                  <th className="px-4 py-3 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Sale Class</th>
                  <th className="px-4 py-3 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && singleSkus.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : singleSkus.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No single SKUs found</td>
                  </tr>
                ) : (
                  singleSkus.map((sku, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-base font-medium text-gray-900">{sku.merchant_sku}</td>
                      <td className="px-4 py-4 text-base text-gray-600">{sku.product_category || '-'}</td>
                      <td className="px-4 py-4 text-base text-gray-600">{sku.sale_class || '-'}</td>
                      <td className="px-4 py-4 text-base">
                        <button
                          onClick={() => handleEditSingle(sku)}
                          className="text-blue-600 hover:text-blue-800 mr-4 font-medium"
                          aria-label={`Edit ${sku.merchant_sku}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(sku.merchant_sku)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          aria-label={`Delete ${sku.merchant_sku}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeType === 'combo' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Combo SKUs</h3>
            <button
              onClick={() => {
                setShowComboForm(true);
                setEditingCombo(null);
                setComboForm({ merchant_sku: '', components: [] });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Combo SKU
            </button>
          </div>

          {showComboForm && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold mb-3">{editingCombo ? 'Edit' : 'Add'} Combo SKU</h4>
              <div className="mb-4">
                <div>
                  <label htmlFor="combo_merchant_sku" className="block text-base font-medium text-gray-700 mb-1">Merchant SKU *</label>
                  <input
                    id="combo_merchant_sku"
                    type="text"
                    value={comboForm.merchant_sku}
                    onChange={(e) => setComboForm({ ...comboForm, merchant_sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-base"
                    disabled={!!editingCombo}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="component_qty" className="block text-base font-medium text-gray-700 mb-2">Components *</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    id="component_qty"
                    type="number"
                    placeholder="Qty"
                    value={newComponent.qty}
                    onChange={(e) => setNewComponent({ ...newComponent, qty: parseInt(e.target.value) || 1 })}
                    className="px-3 py-2 border border-gray-300 rounded text-base"
                    min="1"
                  />
                  <select
                    aria-label="Select component SKU"
                    value={newComponent.component_merchant_sku}
                    onChange={(e) => setNewComponent({ ...newComponent, component_merchant_sku: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded col-span-2 text-base"
                  >
                    <option value="">Select Component SKU</option>
                    {singleSkuOptions.map((sku) => (
                      <option key={sku} value={sku}>
                        {sku}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addComponent}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    aria-label="Add component to combo"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {comboForm.components.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                      <span className="text-base font-medium">{comp.qty}x</span>
                      <span className="text-base flex-1">{comp.component_merchant_sku}</span>
                      <button
                        onClick={() => removeComponent(idx)}
                        className="text-red-600 hover:text-red-800 text-base font-medium"
                        aria-label={`Remove component ${comp.component_merchant_sku}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveCombo}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowComboForm(false);
                    setEditingCombo(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Merchant SKU</th>
                  <th className="px-4 py-3 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Components</th>
                  <th className="px-4 py-3 text-left text-base font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && comboSkus.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : comboSkus.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No combo SKUs found</td>
                  </tr>
                ) : (
                  comboSkus.map((sku, idx) => {
                    const components = typeof sku.components === 'string' ? JSON.parse(sku.components) : sku.components;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-base font-medium text-gray-900">{sku.merchant_sku}</td>
                        <td className="px-4 py-4 text-base text-gray-600">
                          {Array.isArray(components) ? (
                            <div className="flex flex-wrap gap-2">
                              {components.map((comp: Component, i: number) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 rounded-lg text-base font-medium">
                                  {comp.qty}x {comp.component_merchant_sku}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-4 text-base">
                          <button
                            onClick={() => handleEditCombo(sku)}
                            className="text-blue-600 hover:text-blue-800 mr-4 font-medium"
                            aria-label={`Edit combo SKU ${sku.merchant_sku}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCombo(sku.merchant_sku)}
                            className="text-red-600 hover:text-red-800 font-medium"
                            aria-label={`Delete combo SKU ${sku.merchant_sku}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
