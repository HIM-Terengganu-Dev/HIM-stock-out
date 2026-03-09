export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

// GET - Fetch all merchant SKUs from database
export async function GET() {
  try {
    const pool = getDbPool();

    // Fetch single SKUs
    const singleResult = await pool.query(`
      SELECT merchant_sku, merchant_sku_norm, product_category, sale_class
      FROM ref_sku.merchant_sku_single
      ORDER BY merchant_sku
    `);

    // Fetch combo SKUs
    const comboResult = await pool.query(`
      SELECT merchant_sku, merchant_sku_norm, components
      FROM ref_sku.merchant_sku_combo
      ORDER BY merchant_sku
    `);

    // Transform data to match expected structure
    const comboSkus: Record<string, any[]> = {};
    for (const row of comboResult.rows) {
      try {
        comboSkus[row.merchant_sku] = typeof row.components === 'string'
          ? JSON.parse(row.components)
          : row.components;
      } catch (parseError) {
        console.error(`Error parsing components for ${row.merchant_sku}:`, parseError);
        continue;
      }
    }

    const singleSkus = singleResult.rows.map(row => row.merchant_sku);

    const singleSkuProductCategories: Record<string, string> = {};
    for (const row of singleResult.rows) {
      if (row.product_category) {
        singleSkuProductCategories[row.merchant_sku] = row.product_category;
      }
    }

    const data = {
      comboSkus,
      singleSkus,
      singleSkuProductCategories,
    };

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching merchant SKU data from database:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch merchant SKU data from database',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
