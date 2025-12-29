import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// POST - Update database with JSON file (upsert only - add/update, never delete)
export async function POST() {
  try {
    // Read JSON file
    const filePath = path.join(process.cwd(), 'merchantSkus.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    const pool = getDbPool();
    let stats = {
      singleAdded: 0,
      singleUpdated: 0,
      comboAdded: 0,
      comboUpdated: 0,
      errors: [] as string[],
    };

    // Upsert Single SKUs from JSON (add/update only, never delete existing database entries)
    if (jsonData.singleSkus && Array.isArray(jsonData.singleSkus)) {
      for (const merchantSku of jsonData.singleSkus) {
        try {
          const productCategory = jsonData.singleSkuProductCategories?.[merchantSku] || null;
          const merchantSkuNorm = merchantSku.toUpperCase();

          // Upsert: Insert if not exists, update if exists (never delete)
          const result = await pool.query(`
            INSERT INTO ref_sku.merchant_sku_single (merchant_sku, merchant_sku_norm, product_category, sale_class)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (merchant_sku) 
            DO UPDATE SET 
              merchant_sku_norm = EXCLUDED.merchant_sku_norm,
              product_category = EXCLUDED.product_category,
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
          `, [merchantSku, merchantSkuNorm, productCategory, null]);
          
          if (result.rows[0].inserted) {
            stats.singleAdded++;
          } else {
            stats.singleUpdated++;
          }
        } catch (error) {
          stats.errors.push(`Error syncing single SKU ${merchantSku}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Upsert Combo SKUs from JSON (add/update only, never delete existing database entries)
    if (jsonData.comboSkus && typeof jsonData.comboSkus === 'object') {
      for (const [merchantSku, components] of Object.entries(jsonData.comboSkus)) {
        try {
          if (!Array.isArray(components)) continue;

          const merchantSkuNorm = merchantSku.toUpperCase();
          const componentsJson = JSON.stringify(components);

          // Upsert: Insert if not exists, update if exists (never delete)
          const result = await pool.query(`
            INSERT INTO ref_sku.merchant_sku_combo (merchant_sku, merchant_sku_norm, components)
            VALUES ($1, $2, $3::jsonb)
            ON CONFLICT (merchant_sku) 
            DO UPDATE SET 
              merchant_sku_norm = EXCLUDED.merchant_sku_norm,
              components = EXCLUDED.components,
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
          `, [merchantSku, merchantSkuNorm, componentsJson]);
          
          if (result.rows[0].inserted) {
            stats.comboAdded++;
          } else {
            stats.comboUpdated++;
          }
        } catch (error) {
          stats.errors.push(`Error syncing combo SKU ${merchantSku}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database updated with JSON data successfully (upsert only - no deletions)',
      stats: {
        singleAdded: stats.singleAdded,
        singleUpdated: stats.singleUpdated,
        comboAdded: stats.comboAdded,
        comboUpdated: stats.comboUpdated,
        totalProcessed: stats.singleAdded + stats.singleUpdated + stats.comboAdded + stats.comboUpdated,
        errors: stats.errors,
      },
    });
  } catch (error) {
    console.error('Error syncing from JSON to database:', error);
    return NextResponse.json(
      { error: 'Failed to sync from JSON to database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
