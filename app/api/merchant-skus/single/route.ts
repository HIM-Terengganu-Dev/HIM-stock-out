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
    
    // Upsert (insert or update) - merchant_sku_norm is auto-calculated by database
    await pool.query(`
      INSERT INTO ref_sku.merchant_sku_single (merchant_sku, product_category, sale_class)
      VALUES ($1, $2, $3)
      ON CONFLICT (merchant_sku) 
      DO UPDATE SET 
        product_category = EXCLUDED.product_category,
        sale_class = EXCLUDED.sale_class,
        updated_at = NOW()
    `, [merchant_sku, product_category, sale_class || null]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving single SKU:', error);
    return NextResponse.json(
      { error: 'Failed to save single SKU' },
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
