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
      try {
        comboSkus[row.merchant_sku] = typeof row.components === 'string' 
          ? JSON.parse(row.components) 
          : row.components;
      } catch (parseError) {
        console.error(`Error parsing components for ${row.merchant_sku}:`, parseError);
        // Continue with next row if parsing fails
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
    
    const jsonData = {
      comboSkus,
      singleSkus,
      singleSkuProductCategories,
    };
    
    // Check if we're in Vercel (read-only filesystem)
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    
    if (isVercel) {
      // In Vercel, filesystem is read-only - return the JSON data instead
      // The file would need to be updated at build time or via a different mechanism
      return NextResponse.json({ 
        success: true,
        message: 'Data synced successfully. In Vercel environment, file system is read-only. JSON data is available in response.',
        isVercel: true,
        jsonData,
        stats: {
          comboCount: Object.keys(comboSkus).length,
          singleCount: singleSkus.length,
        }
      });
    }
    
    // Write to JSON file (local development)
    const filePath = path.join(process.cwd(), 'merchantSkus.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (writeError) {
      const errorMessage = writeError instanceof Error ? writeError.message : 'Unknown error';
      console.error('Error writing to merchantSkus.json:', writeError);
      return NextResponse.json(
        { 
          error: 'Failed to write JSON file', 
          details: errorMessage,
          jsonData // Still return the data so it can be used
        },
        { status: 500 }
      );
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error syncing to JSON:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync to JSON file',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}
