import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

interface ColumnConfig {
  excelHeader: string;
  dbCol: string;
  type: 'text' | 'integer' | 'numeric' | 'timestamptz';
}

const COLUMNS_CONFIG: ColumnConfig[] = [
  { excelHeader: 'Order No', dbCol: 'order_no', type: 'text' },
  { excelHeader: 'Package No', dbCol: 'package_no', type: 'text' },
  { excelHeader: 'Order Type', dbCol: 'order_type', type: 'text' },
  { excelHeader: 'Order Mark', dbCol: 'order_mark', type: 'text' },
  { excelHeader: 'Package Type', dbCol: 'package_type', type: 'text' },
  { excelHeader: 'Main Package No', dbCol: 'main_package_no', type: 'text' },
  { excelHeader: 'Invoice No.', dbCol: 'invoice_no', type: 'text' },
  { excelHeader: 'Order Status', dbCol: 'order_status', type: 'text' },
  { excelHeader: 'Marketplace Status', dbCol: 'marketplace_status', type: 'text' },
  { excelHeader: 'Marketplace', dbCol: 'marketplace', type: 'text' },
  { excelHeader: 'Marketplace Store', dbCol: 'marketplace_store', type: 'text' },
  { excelHeader: 'BigSeller Store Nickname', dbCol: 'bigseller_store_nickname', type: 'text' },
  { excelHeader: 'Seller Name', dbCol: 'seller_name', type: 'text' },
  { excelHeader: 'Username (Buyer)', dbCol: 'username_buyer', type: 'text' },
  { excelHeader: 'Customer Code', dbCol: 'customer_code', type: 'text' },
  { excelHeader: 'Customer Name', dbCol: 'customer_name', type: 'text' },
  { excelHeader: 'Receiver Name', dbCol: 'receiver_name', type: 'text' },
  { excelHeader: 'Phone Number', dbCol: 'phone_number', type: 'text' },
  { excelHeader: 'Post Code', dbCol: 'post_code', type: 'text' },
  { excelHeader: 'Country', dbCol: 'country', type: 'text' },
  { excelHeader: 'Province (State)', dbCol: 'province_state', type: 'text' },
  { excelHeader: 'City', dbCol: 'city', type: 'text' },
  { excelHeader: 'District (Area)', dbCol: 'district_area', type: 'text' },
  { excelHeader: 'Town', dbCol: 'town', type: 'text' },
  { excelHeader: 'Shipping Address', dbCol: 'shipping_address', type: 'text' },
  { excelHeader: 'SKU', dbCol: 'sku', type: 'text' },
  { excelHeader: 'Product ID', dbCol: 'product_id', type: 'text' },
  { excelHeader: 'Product Name', dbCol: 'product_name', type: 'text' },
  { excelHeader: 'Variation Name', dbCol: 'variation_name', type: 'text' },
  { excelHeader: 'First Level Category', dbCol: 'first_level_category', type: 'text' },
  { excelHeader: 'Secondary Category', dbCol: 'secondary_category', type: 'text' },
  { excelHeader: 'Third Level Category', dbCol: 'third_level_category', type: 'text' },
  { excelHeader: 'Quantity', dbCol: 'quantity', type: 'integer' },
  { excelHeader: 'Price', dbCol: 'price', type: 'numeric' },
  { excelHeader: 'Product Subtotal', dbCol: 'product_subtotal', type: 'numeric' },
  { excelHeader: 'Original Price', dbCol: 'original_price', type: 'numeric' },
  { excelHeader: 'Merchant SKU', dbCol: 'merchant_sku', type: 'text' },
  { excelHeader: 'Title', dbCol: 'title', type: 'text' },
  { excelHeader: 'Base Unit', dbCol: 'base_unit', type: 'text' },
  { excelHeader: 'Serial Number', dbCol: 'serial_number', type: 'text' },
  { excelHeader: 'Image Link', dbCol: 'image_link', type: 'text' },
  { excelHeader: 'To Allocate/Deduct', dbCol: 'to_allocate_deduct', type: 'text' },
  { excelHeader: 'Commodity Cost', dbCol: 'commodity_cost', type: 'numeric' },
  { excelHeader: 'Reference Price', dbCol: 'reference_price', type: 'numeric' },
  { excelHeader: 'Product Weight', dbCol: 'product_weight', type: 'numeric' },
  { excelHeader: 'Length', dbCol: 'length', type: 'numeric' },
  { excelHeader: 'Width', dbCol: 'width', type: 'numeric' },
  { excelHeader: 'Height', dbCol: 'height', type: 'numeric' },
  { excelHeader: 'Shelf', dbCol: 'shelf', type: 'text' },
  { excelHeader: 'Package Weight(g)', dbCol: 'package_weight_g', type: 'numeric' },
  { excelHeader: 'Inspector', dbCol: 'inspector', type: 'text' },
  { excelHeader: 'Salesperson', dbCol: 'salesperson', type: 'text' },
  { excelHeader: 'Stock-Out', dbCol: 'stock_out', type: 'text' },
  { excelHeader: 'Stock-In', dbCol: 'stock_in', type: 'text' },
  { excelHeader: 'Shipping Warehouse', dbCol: 'shipping_warehouse', type: 'text' },
  { excelHeader: 'Buyer Designed Logistics', dbCol: 'buyer_designed_logistics', type: 'text' },
  { excelHeader: 'Shipping Option', dbCol: 'shipping_option', type: 'text' },
  { excelHeader: 'Cargo Carry Method', dbCol: 'cargo_carry_method', type: 'text' },
  { excelHeader: 'Tracking Number', dbCol: 'tracking_number', type: 'text' },
  { excelHeader: 'Shipping Fee', dbCol: 'shipping_fee', type: 'numeric' },
  { excelHeader: 'Shipping Fee Paid By Seller', dbCol: 'shipping_fee_paid_by_seller', type: 'numeric' },
  { excelHeader: 'Seller Shipping Discount', dbCol: 'seller_shipping_discount', type: 'numeric' },
  { excelHeader: 'Marketplace Shipping Discount', dbCol: 'marketplace_shipping_discount', type: 'numeric' },
  { excelHeader: 'Order Total', dbCol: 'order_total', type: 'numeric' },
  { excelHeader: 'Payment Method', dbCol: 'payment_method', type: 'text' },
  { excelHeader: 'Management Fee', dbCol: 'management_fee', type: 'numeric' },
  { excelHeader: 'Transaction Fee', dbCol: 'transaction_fee', type: 'numeric' },
  { excelHeader: 'Seller Discount', dbCol: 'seller_discount', type: 'numeric' },
  { excelHeader: 'Marketplace Discount', dbCol: 'marketplace_discount', type: 'numeric' },
  { excelHeader: 'Voucher', dbCol: 'voucher', type: 'numeric' },
  { excelHeader: 'Store Voucher', dbCol: 'store_voucher', type: 'numeric' },
  { excelHeader: 'Currency', dbCol: 'currency', type: 'text' },
  { excelHeader: 'Order Time', dbCol: 'order_time', type: 'timestamptz' },
  { excelHeader: 'Order Paid Time', dbCol: 'order_paid_time', type: 'timestamptz' },
  { excelHeader: 'Valid Time', dbCol: 'valid_time', type: 'timestamptz' },
  { excelHeader: 'Expire Time', dbCol: 'expire_time', type: 'timestamptz' },
  { excelHeader: 'Packed Time', dbCol: 'packed_time', type: 'timestamptz' },
  { excelHeader: 'Printed Time', dbCol: 'printed_time', type: 'timestamptz' },
  { excelHeader: 'Order Shipped Time', dbCol: 'order_shipped_time', type: 'timestamptz' },
  { excelHeader: 'Transit Time', dbCol: 'transit_time', type: 'timestamptz' },
  { excelHeader: 'Completed Time', dbCol: 'completed_time', type: 'timestamptz' },
  { excelHeader: 'Cancel Time', dbCol: 'cancel_time', type: 'timestamptz' },
  { excelHeader: 'Cancellation Reason', dbCol: 'cancellation_reason', type: 'text' },
  { excelHeader: 'Status Before Canceled', dbCol: 'status_before_canceled', type: 'text' },
  { excelHeader: 'Buyer Message', dbCol: 'buyer_message', type: 'text' },
  { excelHeader: 'Seller-Note', dbCol: 'seller_note', type: 'text' },
  { excelHeader: 'Note for CS', dbCol: 'note_for_cs', type: 'text' },
  { excelHeader: 'Note for Pick', dbCol: 'note_for_pick', type: 'text' },
  { excelHeader: 'Payment Channel', dbCol: 'payment_channel', type: 'text' },
  { excelHeader: 'VAT', dbCol: 'vat', type: 'numeric' },
  { excelHeader: 'Service Fee', dbCol: 'service_fee', type: 'numeric' },
  { excelHeader: 'Cancel Initiator', dbCol: 'cancel_initiator', type: 'text' },
  { excelHeader: 'Platform Order No', dbCol: 'platform_order_no', type: 'text' },
  { excelHeader: 'Settlement Status', dbCol: 'settlement_status', type: 'text' },
  { excelHeader: 'Settled Amount', dbCol: 'settled_amount', type: 'numeric' },
  { excelHeader: 'Unsettled Amount', dbCol: 'unsettled_amount', type: 'numeric' },
  { excelHeader: 'Credit Due Date', dbCol: 'credit_due_date', type: 'timestamptz' },
  { excelHeader: 'Supplier Name', dbCol: 'supplier_name', type: 'text' },
  { excelHeader: 'Supplier Code', dbCol: 'supplier_code', type: 'text' },
  { excelHeader: 'Is Abnormal Order', dbCol: 'is_abnormal_order', type: 'text' }
];

const safeDate = (dateValue: any): string | null => {
  if (dateValue === null || dateValue === undefined || dateValue === '') return null;
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
  }
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (!trimmed) return null;
    const date = new Date(trimmed);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
};

const safeInt = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

const safeFloat = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

export async function POST(request: NextRequest) {
  try {
    const { batchId, orders } = await request.json();

    if (!batchId || !orders || !Array.isArray(orders)) {
      return NextResponse.json(
        { error: 'Invalid request payload. Expected batchId and orders array.' },
        { status: 400 }
      );
    }

    if (orders.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No orders to save.' });
    }

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Extract unique order numbers and tracking numbers from the incoming batch
      const incomingOrderNos = Array.from(new Set(orders.map(o => o['Order No']).filter(Boolean)));
      const incomingTrackingNumbers = Array.from(new Set(orders.map(o => o['Tracking Number']).filter(Boolean)));

      // Sets to keep track of existing values in the database
      const existingOrderNos = new Set<string>();
      const existingTrackingNumbers = new Set<string>();

      if (incomingOrderNos.length > 0 || incomingTrackingNumbers.length > 0) {
        // Query database to find which incoming orders or tracking numbers already exist
        const checkRes = await client.query(`
          SELECT DISTINCT order_no, tracking_number 
          FROM history.uploaded_orders 
          WHERE order_no = ANY($1) OR tracking_number = ANY($2)
        `, [
          incomingOrderNos.length > 0 ? incomingOrderNos : [null],
          incomingTrackingNumbers.length > 0 ? incomingTrackingNumbers : [null]
        ]);

        checkRes.rows.forEach(row => {
          if (row.order_no) existingOrderNos.add(row.order_no);
          if (row.tracking_number) existingTrackingNumbers.add(row.tracking_number);
        });
      }

      // Filter out orders that already exist in the database by Order No or Tracking Number
      const filteredOrders = orders.filter(order => {
        const orderNo = order['Order No'];
        const trackingNum = order['Tracking Number'];

        const hasExistingOrderNo = orderNo && existingOrderNos.has(String(orderNo));
        const hasExistingTracking = trackingNum && existingTrackingNumbers.has(String(trackingNum));

        return !hasExistingOrderNo && !hasExistingTracking;
      });

      // If all orders in this batch are duplicates, commit empty and return 0
      if (filteredOrders.length === 0) {
        await client.query('COMMIT');
        return NextResponse.json({
          success: true,
          count: 0,
          batchId,
          message: 'All orders in this batch already exist in the database.'
        });
      }

      // Prepare parallel arrays for the UNNEST query using only the filtered orders
      const batchIds: string[] = [];
      const paramArrays: Record<string, any[]> = {};
      for (const col of COLUMNS_CONFIG) {
        paramArrays[col.dbCol] = [];
      }

      for (const order of filteredOrders) {
        batchIds.push(batchId);
        for (const col of COLUMNS_CONFIG) {
          const rawVal = order[col.excelHeader];
          let parsedVal: any = null;
          if (col.type === 'integer') {
            parsedVal = safeInt(rawVal);
          } else if (col.type === 'numeric') {
            parsedVal = safeFloat(rawVal);
          } else if (col.type === 'timestamptz') {
            parsedVal = safeDate(rawVal);
          } else {
            parsedVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : null;
          }
          paramArrays[col.dbCol].push(parsedVal);
        }
      }

      const dbColumns = ['batch_id', ...COLUMNS_CONFIG.map(c => c.dbCol)];
      const typeCasts = ['uuid[]', ...COLUMNS_CONFIG.map(c => {
        if (c.type === 'integer') return 'int[]';
        if (c.type === 'numeric') return 'numeric[]';
        if (c.type === 'timestamptz') return 'timestamptz[]';
        return 'text[]';
      })];

      const selectParams = typeCasts.map((cast, idx) => `$${idx + 1}::${cast}`);

      const insertQuery = `
        INSERT INTO history.uploaded_orders (
          ${dbColumns.join(', ')}
        ) 
        SELECT * FROM UNNEST(
          ${selectParams.join(',\n          ')}
        )
      `;

      const queryParams = [
        batchIds,
        ...COLUMNS_CONFIG.map(c => paramArrays[c.dbCol])
      ];

      await client.query(insertQuery, queryParams);
      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        count: filteredOrders.length,
        batchId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error saving uploaded orders:', error);
    return NextResponse.json(
      { error: 'Failed to save uploaded orders' },
      { status: 500 }
    );
  }
}
