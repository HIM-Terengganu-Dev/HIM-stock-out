export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

// POST - Add or update single SKU
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchant_sku, product_category, sale_class } = body;

    if (!merchant_sku || !product_category) {
      return NextResponse.json(
        { error: 'merchant_sku and product_category are required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const merchant_sku_norm = merchant_sku.toUpperCase();

    // Upsert (insert or update) - explicitly set merchant_sku_norm
    await pool.query(`
      INSERT INTO ref_sku.merchant_sku_single (merchant_sku, merchant_sku_norm, product_category, sale_class)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (merchant_sku) 
      DO UPDATE SET 
        merchant_sku_norm = EXCLUDED.merchant_sku_norm,
        product_category = EXCLUDED.product_category,
        sale_class = EXCLUDED.sale_class,
        updated_at = NOW()
    `, [merchant_sku, merchant_sku_norm, product_category, sale_class || null]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error saving single SKU:', error);

    // Check for common database errors
    let userFriendlyMessage = 'Failed to save single SKU';
    if (errorMessage.includes('duplicate key')) {
      userFriendlyMessage = 'Merchant SKU already exists';
    } else if (errorMessage.includes('violates foreign key constraint')) {
      userFriendlyMessage = 'Invalid reference (product category or sale class does not exist)';
    } else if (errorMessage.includes('null value')) {
      userFriendlyMessage = 'Required field is missing';
    } else if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      userFriendlyMessage = 'Database connection error. Please try again.';
    }

    return NextResponse.json(
      {
        error: userFriendlyMessage,
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete single SKU
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchant_sku = searchParams.get('merchant_sku');

    if (!merchant_sku) {
      return NextResponse.json(
        { error: 'merchant_sku is required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    await pool.query(
      'DELETE FROM ref_sku.merchant_sku_single WHERE merchant_sku = $1',
      [merchant_sku]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting single SKU:', error);
    return NextResponse.json(
      { error: 'Failed to delete single SKU' },
      { status: 500 }
    );
  }
}
