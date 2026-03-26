// Merchant SKU reference data loaded from database via API

// For client-side and server-side, we use a module-level cache that gets populated from database
let merchantSkusData: any = null;
let dataLoaded = false;

function loadMerchantSkusData() {
  // Always return cached data if available
  if (merchantSkusData && dataLoaded) return merchantSkusData;
  
  // Initialize with empty structure - data must be loaded via API call
  if (!merchantSkusData) {
    merchantSkusData = {
      comboSkus: {},
      singleSkus: [],
      singleSkuProductCategories: {},
    };
  }
  
  return merchantSkusData;
}

// Function to update data from API (for client-side and server-side)
export function updateMerchantSkusData(newData: any) {
  merchantSkusData = newData;
  dataLoaded = true;
}

export interface Component {
  qty: number;
  component_merchant_sku: string;
  component_merchant_sku_norm: string;
}

export interface ComboSku {
  merchant_sku: string;
  merchant_sku_norm: string;
  components: Component[];
}

export interface SingleSku {
  merchant_sku: string;
  merchant_sku_norm: string;
  product_category: string;
  sale_class: string;
}

// Helper to get current combo SKUs
function getCurrentComboSkus(): Record<string, Component[]> {
  const currentData = loadMerchantSkusData();
  return (currentData.comboSkus || {}) as Record<string, Component[]>;
}

// Helper to get current single SKUs
// Returns array instead of Set for ES5 compatibility
function getCurrentSingleSkus(): string[] {
  const currentData = loadMerchantSkusData();
  return (currentData.singleSkus || []) as string[];
}

// Helper to get current product categories
function getCurrentProductCategories(): Record<string, string> {
  const currentData = loadMerchantSkusData();
  return (currentData.singleSkuProductCategories || {}) as Record<string, string>;
}

// Combo SKUs with components - loaded from JSON (dynamic)
// Use a function-based approach for more reliable access
function getComboSku(sku: string): Component[] | undefined {
  const skus = getCurrentComboSkus();
  return skus[sku];
}

function hasComboSku(sku: string): boolean {
  const skus = getCurrentComboSkus();
  return sku in skus;
}

// Export as Proxy for backward compatibility with existing code
export const comboSkus = new Proxy({} as Record<string, Component[]>, {
  get(target, prop) {
    if (typeof prop === 'string') {
      return getComboSku(prop);
    }
    // For other properties, return undefined
    return undefined;
  },
  has(target, prop) {
    if (typeof prop === 'string') {
      return hasComboSku(prop);
    }
    return false;
  },
  ownKeys(target) {
    const skus = getCurrentComboSkus();
    return Object.keys(skus);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (typeof prop === 'string') {
      const skus = getCurrentComboSkus();
      if (prop in skus) {
        return {
          enumerable: true,
          configurable: true,
          value: skus[prop],
        };
      }
    }
    return undefined;
  },
  // Add defineProperty to make it work better with property checks
  defineProperty(target, prop, descriptor) {
    return true;
  },
});

// Single SKUs - loaded from JSON (dynamic)
// Create a Set-like object that uses array for ES5 compatibility
const createSingleSkusProxy = () => {
  const proxy = {
    has: (value: string): boolean => {
      const skusArray = getCurrentSingleSkus();
      return skusArray.indexOf(value) !== -1;
    },
    get size(): number {
      const skusArray = getCurrentSingleSkus();
      return skusArray.length;
    },
  } as Set<string>;
  return proxy;
};

export const singleSkus = createSingleSkusProxy();

// Product category mapping for single SKUs - loaded from JSON (dynamic)
export const singleSkuProductCategories = new Proxy({} as Record<string, string>, {
  get(target, prop) {
    const categories = getCurrentProductCategories();
    return categories[prop as string];
  },
  has(target, prop) {
    const categories = getCurrentProductCategories();
    return prop in categories;
  },
  ownKeys(target) {
    const categories = getCurrentProductCategories();
    return Object.keys(categories);
  },
  getOwnPropertyDescriptor(target, prop) {
    const categories = getCurrentProductCategories();
    if (prop in categories) {
      return {
        enumerable: true,
        configurable: true,
        value: categories[prop as string],
      };
    }
  },
});

// Helper function to check if a SKU is a combo SKU (more reliable than direct property access)
export function isComboSku(merchantSku: string): boolean {
  if (!merchantSku) return false;
  const skus = getCurrentComboSkus();
  return merchantSku in skus && skus[merchantSku] !== undefined && Array.isArray(skus[merchantSku]);
}

// Helper function to get combo SKU components
export function getComboSkuComponents(merchantSku: string): Component[] | undefined {
  const skus = getCurrentComboSkus();
  return skus[merchantSku];
}

// Helper function to get product category for a merchant SKU (case-insensitive)
export function getProductCategory(merchantSku: string): string | undefined {
  if (!merchantSku) return undefined;
  const categories = getCurrentProductCategories();

  // Try exact match first (fast path)
  if (categories[merchantSku] !== undefined) return categories[merchantSku];

  // Fall back to case-insensitive match
  const normalized = merchantSku.toUpperCase();
  for (const key in categories) {
    if (key.toUpperCase() === normalized) {
      return categories[key];
    }
  }
  return undefined;
}

// Case-insensitive helper functions for checking SKUs
// These check if a SKU exists in the reference data regardless of case
export function hasSingleSkuCaseInsensitive(merchantSku: string): boolean {
  if (!merchantSku) return false;
  const normalized = merchantSku.toUpperCase();
  const singleSkusArray = getCurrentSingleSkus();
  
  // First check exact match (case-sensitive) for performance
  if (singleSkusArray.indexOf(merchantSku) !== -1) return true;
  
  // Then check if any SKU in the array matches when normalized
  for (let i = 0; i < singleSkusArray.length; i++) {
    if (singleSkusArray[i].toUpperCase() === normalized) {
      return true;
    }
  }
  return false;
}

export function hasComboSkuCaseInsensitive(merchantSku: string): boolean {
  if (!merchantSku) return false;
  const normalized = merchantSku.toUpperCase();
  const comboSkus = getCurrentComboSkus();
  
  // First check exact match (case-sensitive) for performance
  if (merchantSku in comboSkus) return true;
  
  // Then check if any key matches when normalized
  for (const sku in comboSkus) {
    if (sku.toUpperCase() === normalized) {
      return true;
    }
  }
  return false;
}


