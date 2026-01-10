import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET - Serve the JSON file or fetch from database as fallback
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'merchantSkus.json');
    
    // Try to read from file first
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return NextResponse.json(data);
    } catch (fileError) {
      // If file doesn't exist or can't be read, try fetching from database
      console.warn('Could not read merchantSkus.json, falling back to database:', fileError);
      
      try {
        const { getDbPool } = await import('@/lib/db');
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
        
        // Transform data to match JSON structure
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
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
        console.error('Error fetching from database:', dbError);
        throw new Error(`Failed to read merchant SKU data from file and database: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error reading merchant SKU data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to read merchant SKU data',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
