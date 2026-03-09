export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
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

    return NextResponse.json({
      single: singleResult.rows,
      combo: comboResult.rows,
    });
  } catch (error) {
    console.error('Error fetching merchant SKUs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant SKUs' },
      { status: 500 }
    );
  }
}
