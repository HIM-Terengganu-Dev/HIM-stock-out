import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

// POST - Add or update combo SKU
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchant_sku, components } = body;
    
    if (!merchant_sku || !components || !Array.isArray(components)) {
      return NextResponse.json(
        { error: 'merchant_sku and components array are required' },
        { status: 400 }
      );
    }
    
    const pool = getDbPool();
    const componentsJson = JSON.stringify(components);
    
    // Upsert (insert or update) - merchant_sku_norm is auto-calculated by database
    await pool.query(`
      INSERT INTO ref_sku.merchant_sku_combo (merchant_sku, components)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (merchant_sku) 
      DO UPDATE SET 
        components = EXCLUDED.components,
        updated_at = NOW()
    `, [merchant_sku, componentsJson]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving combo SKU:', error);
    return NextResponse.json(
      { error: 'Failed to save combo SKU' },
      { status: 500 }
    );
  }
}

// DELETE - Delete combo SKU
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
      'DELETE FROM ref_sku.merchant_sku_combo WHERE merchant_sku = $1',
      [merchant_sku]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting combo SKU:', error);
    return NextResponse.json(
      { error: 'Failed to delete combo SKU' },
      { status: 500 }
    );
  }
}
