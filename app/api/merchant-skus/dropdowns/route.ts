import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

// GET - Fetch dropdown options for forms
export async function GET() {
  try {
    const pool = getDbPool();
    
    // Fetch distinct product categories
    const productCategoriesResult = await pool.query(`
      SELECT DISTINCT product_category
      FROM ref_sku.merchant_sku_single
      WHERE product_category IS NOT NULL AND product_category != ''
      ORDER BY product_category
    `);
    
    // Fetch distinct sale classes
    const saleClassesResult = await pool.query(`
      SELECT DISTINCT sale_class
      FROM ref_sku.merchant_sku_single
      WHERE sale_class IS NOT NULL AND sale_class != ''
      ORDER BY sale_class
    `);
    
    // Fetch all single SKUs for combo component dropdown
    const singleSkusResult = await pool.query(`
      SELECT merchant_sku
      FROM ref_sku.merchant_sku_single
      ORDER BY merchant_sku
    `);
    
    return NextResponse.json({
      productCategories: productCategoriesResult.rows.map(row => row.product_category),
      saleClasses: saleClassesResult.rows.map(row => row.sale_class),
      singleSkus: singleSkusResult.rows.map(row => row.merchant_sku),
    });
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dropdown options' },
      { status: 500 }
    );
  }
}
