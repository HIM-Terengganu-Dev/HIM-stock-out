import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { batchId: string } }
) {
    try {
        const batchId = params.batchId;

        if (!batchId) {
            return NextResponse.json(
                { error: 'Batch ID is required' },
                { status: 400 }
            );
        }

        const pool = getDbPool();

        // Fetch all records for the given batch ID
        const result = await pool.query(
            `SELECT * FROM history.uploaded_orders WHERE batch_id = $1 ORDER BY id`,
            [batchId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'No records found for this batch ID' },
                { status: 404 }
            );
        }

        // Reconstruct the rows back into the OrderRow format expected by the frontend reports
        const reconstructedOrders = result.rows.map(row => ({
            'Marketplace': row.marketplace,
            'Merchant SKU': row.merchant_sku,
            'Quantity': row.quantity,
            'Stock-Out': row.stock_out,
            'Marketplace Status': row.marketplace_status,
            // Pass the date string; analysis.ts can parse it
            'Order Time': row.order_time ? new Date(row.order_time).toISOString() : null,
            'Completed Time': row.completed_time ? new Date(row.completed_time).toISOString() : null
        }));

        return NextResponse.json({
            batchId,
            upload_timestamp: result.rows[0].upload_timestamp, // All rows in a batch share similar upload timestamps
            orders: reconstructedOrders
        });

    } catch (error) {
        console.error('Error fetching batch details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch batch details' },
            { status: 500 }
        );
    }
}
