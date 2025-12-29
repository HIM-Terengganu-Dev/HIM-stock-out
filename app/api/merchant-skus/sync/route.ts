import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// POST - Sync database to JSON file
export async function POST() {
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
    
    // Transform data to match JSON structure
    const comboSkus: Record<string, any[]> = {};
    for (const row of comboResult.rows) {
      comboSkus[row.merchant_sku] = typeof row.components === 'string' 
        ? JSON.parse(row.components) 
        : row.components;
    }
    
    const singleSkus = singleResult.rows.map(row => row.merchant_sku);
    
    const singleSkuProductCategories: Record<string, string> = {};
    for (const row of singleResult.rows) {
      if (row.product_category) {
        singleSkuProductCategories[row.merchant_sku] = row.product_category;
      }
    }
    
    const jsonData = {
      comboSkus,
      singleSkus,
      singleSkuProductCategories,
    };
    
    // Write to JSON file
    const filePath = path.join(process.cwd(), 'merchantSkus.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (writeError) {
      console.error('Error writing to merchantSkus.json:', writeError);
      throw new Error('Failed to write JSON file');
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'JSON file updated successfully',
      stats: {
        comboCount: Object.keys(comboSkus).length,
        singleCount: singleSkus.length,
      }
    });
  } catch (error) {
    console.error('Error syncing to JSON:', error);
    return NextResponse.json(
      { error: 'Failed to sync to JSON file' },
      { status: 500 }
    );
  }
}
