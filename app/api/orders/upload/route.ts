import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { batchId, orders } = await request.json();

        if (!batchId || !orders || !Array.isArray(orders)) {
            return NextResponse.json(
                { error: 'Invalid request payload. Expected batchId and orders array.' },
                { status: 400 }
            );
        }

        if (orders.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'No orders to save.' });
        }

        const pool = getDbPool();

        // Use a transaction for bulk insert
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // We need to parse dates carefully since they might come in different formats
            const insertQuery = `
        INSERT INTO history.uploaded_orders (
          batch_id, 
          marketplace, 
          merchant_sku, 
          quantity, 
          stock_out, 
          marketplace_status, 
          order_time, 
          completed_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

            // Helper function to handle various date formats (similar to parseDate in analysis.ts)
            const safeDate = (dateVal: any) => {
                if (!dateVal) return null;
                const date = new Date(dateVal);
                return isNaN(date.getTime()) ? null : date.toISOString();
            };

            // Perform bulk insert using individual parameterized queries inside the transaction
            let insertedCount = 0;

            for (const order of orders) {
                // Find possible date columns (falling back to common names used in the app)
                const orderTime = order['Order Time'] || order['Order Date'] || order['Created At'] || null;
                const completedTime = order['Completed Time'] || order['Completed Date'] || null;

                const quantity = parseInt(order['Quantity'], 10);

                await client.query(insertQuery, [
                    batchId,
                    order['Marketplace'] || null,
                    order['Merchant SKU'] || null,
                    isNaN(quantity) ? null : quantity,
                    order['Stock-Out'] || null,
                    order['Marketplace Status'] || null,
                    safeDate(orderTime),
                    safeDate(completedTime)
                ]);

                insertedCount++;
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                count: insertedCount,
                batchId
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error saving uploaded orders:', error);
        return NextResponse.json(
            { error: 'Failed to save uploaded orders' },
            { status: 500 }
        );
    }
}
