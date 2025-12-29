// Merchant SKU reference data loaded from JSON file

// For client-side, we'll use a module-level cache that gets populated
// For server-side, we load from file system
let merchantSkusData: any = null;
let dataLoaded = false;

function loadMerchantSkusData() {
  if (merchantSkusData && dataLoaded) return merchantSkusData;
  
  try {
    // Server-side: load from file system using dynamic require
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'merchantSkus.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      merchantSkusData = JSON.parse(fileContent);
      dataLoaded = true;
    } else {
      // Client-side: use empty structure initially
      // The data should be loaded via API call in the component
      if (!merchantSkusData) {
        merchantSkusData = {
          comboSkus: {},
          singleSkus: [],
          singleSkuProductCategories: {},
        };
      }
    }
  } catch (error) {
    console.error('Error loading merchant SKU data:', error);
    merchantSkusData = {
      comboSkus: {},
      singleSkus: [],
      singleSkuProductCategories: {},
    };
  }
  
  return merchantSkusData;
}

// Function to update data from API (for client-side)
export function updateMerchantSkusData(newData: any) {
  merchantSkusData = newData;
  dataLoaded = true;
}

// Initialize on module load
const data = loadMerchantSkusData();

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
function getCurrentSingleSkus(): Set<string> {
  const currentData = loadMerchantSkusData();
  return new Set((currentData.singleSkus || []) as string[]);
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
// Create a proper Set-like proxy
const createSingleSkusProxy = () => {
  return new Proxy(new Set<string>(), {
    get(target, prop) {
      const set = getCurrentSingleSkus();
      // Return methods from the actual Set
      if (typeof prop === 'string' && typeof (set as any)[prop] === 'function') {
        return ((set as any)[prop] as Function).bind(set);
      }
      return (set as any)[prop];
    },
    has(target, value) {
      const set = getCurrentSingleSkus();
      return set.has(value as string);
    },
  });
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

// Helper function to get product category for a merchant SKU
export function getProductCategory(merchantSku: string): string | undefined {
  const categories = getCurrentProductCategories();
  return categories[merchantSku];
}


