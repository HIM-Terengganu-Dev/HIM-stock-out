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
      const response = await fetch('/api/merchant-skus/dropdowns');
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
      const response = await fetch('/api/merchant-skus');
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Merchant SKU Management</h2>
        <p className="text-sm text-gray-500">All data is saved directly to the database. No file sync needed.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveType('single')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeType === 'single'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Single SKUs ({singleSkus.length})
          </button>
          <button
            onClick={() => setActiveType('combo')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeType === 'combo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Combo SKUs ({comboSkus.length})
          </button>
        </nav>
      </div>

      {activeType === 'single' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Single SKUs</h3>
            <button
              onClick={() => {
                setShowSingleForm(true);
                setEditingSingle(null);
                setSingleForm({ merchant_sku: '', product_category: '', sale_class: '' });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Single SKU
            </button>
          </div>

          {showSingleForm && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold mb-3">{editingSingle ? 'Edit' : 'Add'} Single SKU</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merchant SKU *</label>
                  <input
                    type="text"
                    value={singleForm.merchant_sku}
                    onChange={(e) => setSingleForm({ ...singleForm, merchant_sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    disabled={!!editingSingle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Category *</label>
                  <select
                    value={singleForm.product_category}
                    onChange={(e) => setSingleForm({ ...singleForm, product_category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Select Product Category</option>
                    {productCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Class</label>
                  <select
                    value={singleForm.sale_class}
                    onChange={(e) => setSingleForm({ ...singleForm, sale_class: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Select Sale Class (Optional)</option>
                    {saleClasses.map((saleClass) => (
                      <option key={saleClass} value={saleClass}>
                        {saleClass}
                      </option>
                    ))}
                  </select>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{sku.merchant_sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sku.product_category || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sku.sale_class || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleEditSingle(sku)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(sku.merchant_sku)}
                          className="text-red-600 hover:text-red-800"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merchant SKU *</label>
                  <input
                    type="text"
                    value={comboForm.merchant_sku}
                    onChange={(e) => setComboForm({ ...comboForm, merchant_sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    disabled={!!editingCombo}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Components *</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={newComponent.qty}
                    onChange={(e) => setNewComponent({ ...newComponent, qty: parseInt(e.target.value) || 1 })}
                    className="px-3 py-2 border border-gray-300 rounded"
                    min="1"
                  />
                  <select
                    value={newComponent.component_merchant_sku}
                    onChange={(e) => setNewComponent({ ...newComponent, component_merchant_sku: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded col-span-2"
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
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {comboForm.components.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                      <span className="text-sm font-medium">{comp.qty}x</span>
                      <span className="text-sm flex-1">{comp.component_merchant_sku}</span>
                      <button
                        onClick={() => removeComponent(idx)}
                        className="text-red-600 hover:text-red-800 text-sm"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Components</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{sku.merchant_sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {Array.isArray(components) ? (
                            <div className="flex flex-wrap gap-1">
                              {components.map((comp: Component, i: number) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {comp.qty}x {comp.component_merchant_sku}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleEditCombo(sku)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCombo(sku.merchant_sku)}
                            className="text-red-600 hover:text-red-800"
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
