export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

// Mark route as dynamic since it uses request parameters
// GET - Check if a SKU exists (case-insensitive)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantSku = searchParams.get('sku');

    if (!merchantSku) {
      return NextResponse.json(
        { error: 'sku parameter is required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const normalized = merchantSku.toUpperCase();

    // Check single SKUs (case-insensitive)
    const singleResult = await pool.query(`
      SELECT merchant_sku, product_category
      FROM ref_sku.merchant_sku_single
      WHERE merchant_sku_norm = $1
      LIMIT 1
    `, [normalized]);

    if (singleResult.rows.length > 0) {
      return NextResponse.json({
        exists: true,
        type: 'single',
        merchant_sku: singleResult.rows[0].merchant_sku,
        product_category: singleResult.rows[0].product_category || null,
      });
    }

    // Check combo SKUs (case-insensitive)
    const comboResult = await pool.query(`
      SELECT merchant_sku, components
      FROM ref_sku.merchant_sku_combo
      WHERE merchant_sku_norm = $1
      LIMIT 1
    `, [normalized]);

    if (comboResult.rows.length > 0) {
      let components;
      try {
        components = typeof comboResult.rows[0].components === 'string'
          ? JSON.parse(comboResult.rows[0].components)
          : comboResult.rows[0].components;
      } catch (parseError) {
        components = null;
      }

      return NextResponse.json({
        exists: true,
        type: 'combo',
        merchant_sku: comboResult.rows[0].merchant_sku,
        components,
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking merchant SKU:', error);
    return NextResponse.json(
      {
        error: 'Failed to check merchant SKU',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

