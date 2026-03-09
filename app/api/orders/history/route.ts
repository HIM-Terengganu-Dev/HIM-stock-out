import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

// GET - Fetch a list of all past uploaded file batches
export async function GET() {
    try {
        const pool = getDbPool();

        // Group by batch_id and get the minimum upload timestamp and the total row count
        const historyResult = await pool.query(`
      SELECT 
        batch_id,
        MIN(upload_timestamp) as upload_timestamp,
        COUNT(*) as total_rows
      FROM history.uploaded_orders
      GROUP BY batch_id
      ORDER BY upload_timestamp DESC
    `);

        return NextResponse.json({
            history: historyResult.rows,
        });
    } catch (error) {
        console.error('Error fetching uploaded orders history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch uploaded orders history' },
            { status: 500 }
        );
    }
}
