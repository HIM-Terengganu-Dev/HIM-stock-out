import { comboSkus, singleSkus, getProductCategory, isComboSku, getComboSkuComponents, hasComboSkuCaseInsensitive, hasSingleSkuCaseInsensitive } from './merchantSkuReference';

export interface OrderRow {
  [key: string]: any;
  'Marketplace'?: string;
  'Merchant SKU'?: string;
  'Quantity'?: number;
  'Stock-Out'?: string;
  'Marketplace Status'?: string;
}

export interface StockOutQuantity {
  merchant_sku: string;
  product_category?: string;
  stock_out_quantity: number;
}

export interface DetailedRecord {
  marketplace: string;
  merchant_sku: string;
  product_category?: string;
  stock_out_quantity: number;
  order_merchant_sku: string;
  order_quantity: number;
  component_qty_per_unit: number;
}

export interface BreakdownRecord {
  marketplace: string;
  merchant_sku_order_item: string;
  order_quantity: number;
  merchandise_sku_component: string;
  product_category?: string;
  merchandise_quantity_per_order_item: number;
  total_merchandise_quantity: number;
}

const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];

// Product category sort order
const PRODUCT_CATEGORY_ORDER = [
  'Spray Up',
  'HIM Coffee',
  'HER Coffee',
  'Vigomax',
  'HIM Coffee Trial Pack',
  'HER Coffee Trial Pack',
  'HER Bliss',
  'Other Categories'
];

// Helper function to get sort order for product category
function getProductCategorySortOrder(category: string | undefined): number {
  if (!category) return PRODUCT_CATEGORY_ORDER.length; // Put undefined at the end
  const index = PRODUCT_CATEGORY_ORDER.indexOf(category);
  return index === -1 ? PRODUCT_CATEGORY_ORDER.length - 1 : index; // "Other Categories" or undefined at end
}

// Sort function for reports (by product category, then by stock-out quantity descending)
export function sortByProductCategory<T extends { product_category?: string; stock_out_quantity: number }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const categoryOrderA = getProductCategorySortOrder(a.product_category);
    const categoryOrderB = getProductCategorySortOrder(b.product_category);
    
    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }
    
    // If same category, sort by stock-out quantity descending
    return b.stock_out_quantity - a.stock_out_quantity;
  });
}

// Helper function to parse date from various formats
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // If it's a number (Excel serial date)
  if (typeof dateValue === 'number') {
    // Excel dates are days since 1900-01-01
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

// Helper function to find date column by name (case-insensitive)
function findDateColumn(orders: OrderRow[], columnName: string): string | null {
  if (orders.length === 0) return null;
  
  const orderKeys = Object.keys(orders[0]);
  const foundKey = orderKeys.find(key => key.toLowerCase() === columnName.toLowerCase());
  return foundKey || null;
}

// Filter orders by date range using specified date column
export function filterByDateRange(
  orders: OrderRow[], 
  startDate: Date | null, 
  endDate: Date | null, 
  dateColumn: string
): OrderRow[] {
  // If no date range specified, return all orders
  if (!startDate && !endDate) {
    return orders;
  }
  
  // Find the date column
  const columnKey = findDateColumn(orders, dateColumn);
  if (!columnKey) {
    // Column not found, return all orders
    return orders;
  }
  
  return orders.filter(order => {
    const dateValue = order[columnKey];
    const parsedDate = parseDate(dateValue);
    
    if (!parsedDate) {
      // If date can't be parsed, exclude from results
      return false;
    }
    
    // Check if date is within range
    const dateTime = parsedDate.getTime();
    const startTime = startDate ? startDate.getTime() : Number.NEGATIVE_INFINITY;
    const endTime = endDate ? endDate.getTime() : Number.POSITIVE_INFINITY;
    
    return dateTime >= startTime && dateTime <= endTime;
  });
}

// Helper function to extract date range from orders
export function getDateRange(orders: OrderRow[]): string {
  if (orders.length === 0) return '';
  
  const dates: Date[] = [];
  
  // Try common date column names (checking various possible formats)
  const dateColumnNames = [
    'Order Time', 
    'Order Date', 
    'Date', 
    'Order Date Time', 
    'Created At', 
    'Created Date',
    'Order Time (UTC)',
    'Order Date (UTC)',
    'Order Created Date',
    'Order Created Time'
  ];
  
  // Find the date column name (case-insensitive)
  let foundDateColumn: string | null = null;
  if (orders.length > 0) {
    const orderKeys = Object.keys(orders[0]);
    for (const colName of dateColumnNames) {
      const foundKey = orderKeys.find(key => key.toLowerCase() === colName.toLowerCase());
      if (foundKey) {
        foundDateColumn = foundKey;
        break;
      }
    }
  }
  
  // Extract dates using the found column
  if (foundDateColumn) {
    for (const order of orders) {
      const dateValue = order[foundDateColumn];
      const parsedDate = parseDate(dateValue);
      if (parsedDate) {
        dates.push(parsedDate);
      }
    }
  }
  
  if (dates.length === 0) return '';
  
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  if (minDate.getTime() === maxDate.getTime()) {
    return formatDate(minDate);
  }
  
  return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
}

export function filterOrders(orders: OrderRow[]): OrderRow[] {
  return orders.filter(order => 
    TARGET_MARKETPLACES.includes(order['Marketplace'] || '')
  );
}

export function calculateStockOutQuantities(orders: OrderRow[]): Record<string, number> {
  const stockoutQuantities: Record<string, number> = {};
  
  const stockoutOrders = orders.filter(order => order['Stock-Out'] === 'Yes');
  
  for (const order of stockoutOrders) {
    const merchantSku = order['Merchant SKU'];
    const orderQty = Number(order['Quantity']) || 0;
    
    if (!merchantSku) continue;
    
    // Check if it's a combo SKU
    if (isComboSku(merchantSku)) {
      const components = getComboSkuComponents(merchantSku);
      if (components && Array.isArray(components)) {
        for (const comp of components) {
        const componentSku = comp.component_merchant_sku;
        const componentQty = comp.qty;
        const totalQty = componentQty * orderQty;
          stockoutQuantities[componentSku] = (stockoutQuantities[componentSku] || 0) + totalQty;
        }
      }
    }
    // Check if it's a single SKU
    else if (singleSkus.has(merchantSku)) {
      stockoutQuantities[merchantSku] = (stockoutQuantities[merchantSku] || 0) + orderQty;
    }
    // SKU not in reference (handle as single SKU)
    else {
      stockoutQuantities[merchantSku] = (stockoutQuantities[merchantSku] || 0) + orderQty;
    }
  }
  
  return stockoutQuantities;
}

export function generateReport1(
  orders: OrderRow[], 
  dateRange?: { start: Date | null, end: Date | null }
): StockOutQuantity[] {
  const filtered = filterOrders(orders);
  
  // Filter by Order Time if date range provided
  const dateFiltered = dateRange 
    ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'Order Time')
    : filtered;
  
  const excludingCanceled = dateFiltered.filter(order => 
    !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
  );
  const quantities = calculateStockOutQuantities(excludingCanceled);
  
  const report = Object.entries(quantities)
    .map(([merchant_sku, stock_out_quantity]) => ({ 
      merchant_sku, 
      product_category: getProductCategory(merchant_sku),
      stock_out_quantity 
    }));
  
  return sortByProductCategory(report);
}

export function generateReport2(
  orders: OrderRow[], 
  dateRange?: { start: Date | null, end: Date | null }
): StockOutQuantity[] {
  const filtered = filterOrders(orders);
  
  // Filter by Completed Time if date range provided, then filter by status
  const dateFiltered = dateRange 
    ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'Completed Time')
    : filtered;
  
  const completed = dateFiltered.filter(order => order['Marketplace Status'] === 'Completed');
  const quantities = calculateStockOutQuantities(completed);
  
  const report = Object.entries(quantities)
    .map(([merchant_sku, stock_out_quantity]) => ({ 
      merchant_sku, 
      product_category: getProductCategory(merchant_sku),
      stock_out_quantity 
    }));
  
  return sortByProductCategory(report);
}

export function generateReport3(
  orders: OrderRow[], 
  dateRange?: { start: Date | null, end: Date | null }
): Record<string, StockOutQuantity[]> {
  const filtered = filterOrders(orders);
  
  // Filter by Order Time if date range provided
  const dateFiltered = dateRange 
    ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'Order Time')
    : filtered;
  
  const excludingCanceled = dateFiltered.filter(order => 
    !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
  );
  
  const reports: Record<string, StockOutQuantity[]> = {};
  
  for (const marketplace of TARGET_MARKETPLACES) {
    const marketplaceOrders = excludingCanceled.filter(order => order['Marketplace'] === marketplace);
    const quantities = calculateStockOutQuantities(marketplaceOrders);
    
    const report = Object.entries(quantities)
      .map(([merchant_sku, stock_out_quantity]) => ({ 
        merchant_sku, 
        product_category: getProductCategory(merchant_sku),
        stock_out_quantity 
      }));
    
    reports[marketplace] = sortByProductCategory(report);
  }
  
  return reports;
}

export function generateReport4(
  orders: OrderRow[], 
  dateRange?: { start: Date | null, end: Date | null }
): {
  summary: Array<{ marketplace: string; merchant_sku: string; product_category?: string; stock_out_quantity: number }>;
  detailed: DetailedRecord[];
} {
  const filtered = filterOrders(orders);
  
  // Filter by Order Time if date range provided
  const dateFiltered = dateRange 
    ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'Order Time')
    : filtered;
  
  const excludingCanceled = dateFiltered.filter(order => 
    !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
  );
  
  const detailedRecords: DetailedRecord[] = [];
  
  for (const marketplace of TARGET_MARKETPLACES) {
    const marketplaceOrders = excludingCanceled.filter(order => order['Marketplace'] === marketplace);
    const stockoutOrders = marketplaceOrders.filter(order => order['Stock-Out'] === 'Yes');
    
    for (const order of stockoutOrders) {
      const merchantSku = order['Merchant SKU'];
      const orderQty = Number(order['Quantity']) || 0;
      
      if (!merchantSku) continue;
      
      // Check if it's a combo SKU
      if (isComboSku(merchantSku)) {
        const components = getComboSkuComponents(merchantSku);
        if (components && Array.isArray(components)) {
          for (const comp of components) {
            const componentSku = comp.component_merchant_sku;
            const componentQty = comp.qty;
            const totalQty = componentQty * orderQty;
            
            detailedRecords.push({
              marketplace,
              merchant_sku: componentSku,
              product_category: getProductCategory(componentSku),
              stock_out_quantity: totalQty,
              order_merchant_sku: merchantSku,
              order_quantity: orderQty,
              component_qty_per_unit: componentQty
            });
          }
        }
      }
      // Check if it's a single SKU
      else if (singleSkus.has(merchantSku)) {
        detailedRecords.push({
          marketplace,
          merchant_sku: merchantSku,
          product_category: getProductCategory(merchantSku),
          stock_out_quantity: orderQty,
          order_merchant_sku: merchantSku,
          order_quantity: orderQty,
          component_qty_per_unit: 1
        });
      }
      // SKU not in reference
      else {
        detailedRecords.push({
          marketplace,
          merchant_sku: merchantSku,
          product_category: getProductCategory(merchantSku),
          stock_out_quantity: orderQty,
          order_merchant_sku: merchantSku,
          order_quantity: orderQty,
          component_qty_per_unit: 1
        });
      }
    }
  }
  
  // Create summary
  const summaryMap: Record<string, number> = {};
  for (const record of detailedRecords) {
    const key = `${record.marketplace}|${record.merchant_sku}`;
    summaryMap[key] = (summaryMap[key] || 0) + record.stock_out_quantity;
  }
  
  const summary = Object.entries(summaryMap)
    .map(([key, stock_out_quantity]) => {
      const [marketplace, merchant_sku] = key.split('|');
      return { 
        marketplace, 
        merchant_sku, 
        product_category: getProductCategory(merchant_sku),
        stock_out_quantity 
      };
    })
    .sort((a, b) => {
      if (a.marketplace !== b.marketplace) {
        return a.marketplace.localeCompare(b.marketplace);
      }
      // Within same marketplace, sort by product category
      const categoryOrderA = getProductCategorySortOrder(a.product_category);
      const categoryOrderB = getProductCategorySortOrder(b.product_category);
      if (categoryOrderA !== categoryOrderB) {
        return categoryOrderA - categoryOrderB;
      }
      return b.stock_out_quantity - a.stock_out_quantity;
    });
  
  return { summary, detailed: detailedRecords };
}

export function generateBreakdownReport(
  orders: OrderRow[], 
  dateRange?: { start: Date | null, end: Date | null }
): BreakdownRecord[] {
  const filtered = filterOrders(orders);
  
  // Filter by Order Time if date range provided
  const dateFiltered = dateRange 
    ? filterByDateRange(filtered, dateRange.start, dateRange.end, 'Order Time')
    : filtered;
  
  const excludingCanceled = dateFiltered.filter(order => 
    !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
  );
  
  const breakdownRecords: BreakdownRecord[] = [];
  const aggregatedMap: Record<string, {
    marketplace: string;
    merchant_sku_order_item: string;
    merchandise_sku_component: string;
    merchandise_quantity_per_order_item: number;
    order_quantity_sum: number;
    total_merchandise_quantity: number;
  }> = {};
  
  for (const marketplace of TARGET_MARKETPLACES) {
    const marketplaceOrders = excludingCanceled.filter(order => order['Marketplace'] === marketplace);
    const stockoutOrders = marketplaceOrders.filter(order => order['Stock-Out'] === 'Yes');
    
    for (const order of stockoutOrders) {
      const merchantSku = order['Merchant SKU'];
      const orderQty = Number(order['Quantity']) || 0;
      
      if (!merchantSku) continue;
      
      // Check if it's a combo SKU
      if (isComboSku(merchantSku)) {
        const components = getComboSkuComponents(merchantSku);
        if (components && Array.isArray(components)) {
          for (const comp of components) {
            const componentSku = comp.component_merchant_sku;
            const componentQty = comp.qty;
            const totalQty = componentQty * orderQty;
            
            // Create aggregation key: marketplace|order_item_sku|component_sku
            const key = `${marketplace}|${merchantSku}|${componentSku}`;
            
            if (aggregatedMap[key]) {
              aggregatedMap[key].order_quantity_sum += orderQty;
              aggregatedMap[key].total_merchandise_quantity += totalQty;
            } else {
              aggregatedMap[key] = {
                marketplace,
                merchant_sku_order_item: merchantSku,
                merchandise_sku_component: componentSku,
                merchandise_quantity_per_order_item: componentQty,
                order_quantity_sum: orderQty,
                total_merchandise_quantity: totalQty
              };
            }
          }
        }
      }
      // Check if it's a single SKU
      else if (singleSkus.has(merchantSku)) {
        const key = `${marketplace}|${merchantSku}|${merchantSku}`;
        
        if (aggregatedMap[key]) {
          aggregatedMap[key].order_quantity_sum += orderQty;
          aggregatedMap[key].total_merchandise_quantity += orderQty;
        } else {
          aggregatedMap[key] = {
            marketplace,
            merchant_sku_order_item: merchantSku,
            merchandise_sku_component: merchantSku,
            merchandise_quantity_per_order_item: 1,
            order_quantity_sum: orderQty,
            total_merchandise_quantity: orderQty
          };
        }
      }
      // SKU not in reference
      else {
        const key = `${marketplace}|${merchantSku}|${merchantSku}`;
        
        if (aggregatedMap[key]) {
          aggregatedMap[key].order_quantity_sum += orderQty;
          aggregatedMap[key].total_merchandise_quantity += orderQty;
        } else {
          aggregatedMap[key] = {
            marketplace,
            merchant_sku_order_item: merchantSku,
            merchandise_sku_component: merchantSku,
            merchandise_quantity_per_order_item: 1,
            order_quantity_sum: orderQty,
            total_merchandise_quantity: orderQty
          };
        }
      }
    }
  }
  
  // Convert aggregated map to array
  for (const key in aggregatedMap) {
    const record = aggregatedMap[key];
    
    breakdownRecords.push({
      marketplace: record.marketplace,
      merchant_sku_order_item: record.merchant_sku_order_item,
      order_quantity: record.order_quantity_sum,
      merchandise_sku_component: record.merchandise_sku_component,
      product_category: getProductCategory(record.merchandise_sku_component),
      merchandise_quantity_per_order_item: record.merchandise_quantity_per_order_item,
      total_merchandise_quantity: record.total_merchandise_quantity
    });
  }
  
  // Sort by marketplace, then by merchant_sku_order_item, then by merchandise_sku_component
  return breakdownRecords.sort((a, b) => {
    if (a.marketplace !== b.marketplace) {
      return a.marketplace.localeCompare(b.marketplace);
    }
    if (a.merchant_sku_order_item !== b.merchant_sku_order_item) {
      return a.merchant_sku_order_item.localeCompare(b.merchant_sku_order_item);
    }
    return a.merchandise_sku_component.localeCompare(b.merchandise_sku_component);
  });
}

export interface MissingMerchantSku {
  marketplace: string;
  merchant_sku: string;
}

export function findMissingMerchantSkus(orders: OrderRow[]): MissingMerchantSku[] {
  const filtered = filterOrders(orders);
  
  // Get all unique marketplace-SKU combinations from TikTok, Shopee, Lazada orders
  const marketplaceSkuSet = new Set<string>(); // "marketplace|merchant_sku"
  
  for (const order of filtered) {
    const merchantSku = order['Merchant SKU'];
    const marketplace = order['Marketplace'];
    
    if (!merchantSku || !marketplace) continue;
    
    // Store all unique marketplace-SKU combinations
    const key = `${marketplace}|${merchantSku}`;
    marketplaceSkuSet.add(key);
  }
  
  // Find SKUs that are NOT in the hardcoded references
  const missingSkus: MissingMerchantSku[] = [];
  
  // Convert Set to Array for iteration
  const marketplaceSkuArray = Array.from(marketplaceSkuSet);
  
  for (const key of marketplaceSkuArray) {
    const [marketplace, merchantSku] = key.split('|');
    
    // Use case-insensitive checks to handle variations like "CAL26" vs "cal26"
    // This ensures SKUs are found regardless of case differences between orders and reference data
    const isComboSku = hasComboSkuCaseInsensitive(merchantSku);
    const isSingleSku = hasSingleSkuCaseInsensitive(merchantSku);
    
    // If it's not in either, it's missing
    if (!isComboSku && !isSingleSku) {
      missingSkus.push({
        marketplace,
        merchant_sku: merchantSku
      });
    }
  }
  
  // Sort by marketplace, then by merchant_sku
  return missingSkus.sort((a, b) => {
    if (a.marketplace !== b.marketplace) {
      return a.marketplace.localeCompare(b.marketplace);
    }
    return a.merchant_sku.localeCompare(b.merchant_sku);
  });
}

