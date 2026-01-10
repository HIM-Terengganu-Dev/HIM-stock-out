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
    
    if (components.length === 0) {
      return NextResponse.json(
        { error: 'At least one component is required' },
        { status: 400 }
      );
    }
    
    // Validate components structure
    for (const component of components) {
      if (!component.component_merchant_sku) {
        return NextResponse.json(
          { error: 'Each component must have a component_merchant_sku' },
          { status: 400 }
        );
      }
      if (!component.qty || component.qty < 1) {
        return NextResponse.json(
          { error: 'Each component must have a quantity of at least 1' },
          { status: 400 }
        );
      }
    }
    
    const pool = getDbPool();
    const merchant_sku_norm = merchant_sku.toUpperCase();
    const componentsJson = JSON.stringify(components);
    
    // Upsert (insert or update) - explicitly set merchant_sku_norm
    await pool.query(`
      INSERT INTO ref_sku.merchant_sku_combo (merchant_sku, merchant_sku_norm, components)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (merchant_sku) 
      DO UPDATE SET 
        merchant_sku_norm = EXCLUDED.merchant_sku_norm,
        components = EXCLUDED.components,
        updated_at = NOW()
    `, [merchant_sku, merchant_sku_norm, componentsJson]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error saving combo SKU:', error);
    
    // Check for common database errors
    let userFriendlyMessage = 'Failed to save combo SKU';
    if (errorMessage.includes('duplicate key')) {
      userFriendlyMessage = 'Merchant SKU already exists';
    } else if (errorMessage.includes('invalid input syntax for type jsonb')) {
      userFriendlyMessage = 'Invalid components format';
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
