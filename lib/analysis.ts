import { comboSkus, singleSkus } from './merchantSkuReference';

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
  stock_out_quantity: number;
}

export interface DetailedRecord {
  marketplace: string;
  merchant_sku: string;
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
  merchandise_quantity_per_order_item: number;
  total_merchandise_quantity: number;
}

const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];

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
    if (comboSkus[merchantSku]) {
      const components = comboSkus[merchantSku];
      for (const comp of components) {
        const componentSku = comp.component_merchant_sku;
        const componentQty = comp.qty;
        const totalQty = componentQty * orderQty;
        stockoutQuantities[componentSku] = (stockoutQuantities[componentSku] || 0) + totalQty;
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

export function generateReport1(orders: OrderRow[]): StockOutQuantity[] {
  const filtered = filterOrders(orders);
  const excludingCanceled = filtered.filter(order => 
    !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
  );
  const quantities = calculateStockOutQuantities(excludingCanceled);
  
  return Object.entries(quantities)
    .map(([merchant_sku, stock_out_quantity]) => ({ merchant_sku, stock_out_quantity }))
    .sort((a, b) => b.stock_out_quantity - a.stock_out_quantity);
}

export function generateReport2(orders: OrderRow[]): StockOutQuantity[] {
  const filtered = filterOrders(orders);
  const completed = filtered.filter(order => order['Marketplace Status'] === 'Completed');
  const quantities = calculateStockOutQuantities(completed);
  
  return Object.entries(quantities)
    .map(([merchant_sku, stock_out_quantity]) => ({ merchant_sku, stock_out_quantity }))
    .sort((a, b) => b.stock_out_quantity - a.stock_out_quantity);
}

export function generateReport3(orders: OrderRow[]): Record<string, StockOutQuantity[]> {
  const filtered = filterOrders(orders);
  const excludingCanceled = filtered.filter(order => 
    !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
  );
  
  const reports: Record<string, StockOutQuantity[]> = {};
  
  for (const marketplace of TARGET_MARKETPLACES) {
    const marketplaceOrders = excludingCanceled.filter(order => order['Marketplace'] === marketplace);
    const quantities = calculateStockOutQuantities(marketplaceOrders);
    
    reports[marketplace] = Object.entries(quantities)
      .map(([merchant_sku, stock_out_quantity]) => ({ merchant_sku, stock_out_quantity }))
      .sort((a, b) => b.stock_out_quantity - a.stock_out_quantity);
  }
  
  return reports;
}

export function generateReport4(orders: OrderRow[]): {
  summary: Array<{ marketplace: string; merchant_sku: string; stock_out_quantity: number }>;
  detailed: DetailedRecord[];
} {
  const filtered = filterOrders(orders);
  const excludingCanceled = filtered.filter(order => 
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
      if (comboSkus[merchantSku]) {
        const components = comboSkus[merchantSku];
        for (const comp of components) {
          const componentSku = comp.component_merchant_sku;
          const componentQty = comp.qty;
          const totalQty = componentQty * orderQty;
          
          detailedRecords.push({
            marketplace,
            merchant_sku: componentSku,
            stock_out_quantity: totalQty,
            order_merchant_sku: merchantSku,
            order_quantity: orderQty,
            component_qty_per_unit: componentQty
          });
        }
      }
      // Check if it's a single SKU
      else if (singleSkus.has(merchantSku)) {
        detailedRecords.push({
          marketplace,
          merchant_sku: merchantSku,
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
      return { marketplace, merchant_sku, stock_out_quantity };
    })
    .sort((a, b) => {
      if (a.marketplace !== b.marketplace) {
        return a.marketplace.localeCompare(b.marketplace);
      }
      return b.stock_out_quantity - a.stock_out_quantity;
    });
  
  return { summary, detailed: detailedRecords };
}

export function generateBreakdownReport(orders: OrderRow[]): BreakdownRecord[] {
  const filtered = filterOrders(orders);
  const excludingCanceled = filtered.filter(order => 
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
      if (comboSkus[merchantSku]) {
        const components = comboSkus[merchantSku];
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
  
  // Get all unique merchant SKUs from TikTok, Shopee, Lazada orders
  const merchantSkuMap = new Map<string, string>(); // merchant_sku -> marketplace
  
  for (const order of filtered) {
    const merchantSku = order['Merchant SKU'];
    const marketplace = order['Marketplace'];
    
    if (!merchantSku || !marketplace) continue;
    
    // Store the first marketplace we see for this SKU (or we could collect all)
    if (!merchantSkuMap.has(merchantSku)) {
      merchantSkuMap.set(merchantSku, marketplace);
    }
  }
  
  // Find SKUs that are NOT in the hardcoded references
  const missingSkus: MissingMerchantSku[] = [];
  
  for (const [merchantSku, marketplace] of merchantSkuMap.entries()) {
    // Check if SKU is in comboSkus
    const isComboSku = merchantSku in comboSkus;
    // Check if SKU is in singleSkus
    const isSingleSku = singleSkus.has(merchantSku);
    
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

