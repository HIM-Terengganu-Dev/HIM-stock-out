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

            // Helper function to handle various date formats (similar to parseDate in analysis.ts)
            const safeDate = (dateVal: any) => {
                if (!dateVal) return null;
                const date = new Date(dateVal);
                return isNaN(date.getTime()) ? null : date.toISOString();
            };

            // Prepare parallel arrays for the UNNEST query
            const batchIds: string[] = [];
            const marketplaces: (string | null)[] = [];
            const merchantSkus: (string | null)[] = [];
            const quantities: (number | null)[] = [];
            const stockOuts: (string | null)[] = [];
            const statuses: (string | null)[] = [];
            const orderTimes: (string | null)[] = [];
            const completedTimes: (string | null)[] = [];

            for (const order of orders) {
                const orderTime = order['Order Time'] || order['Order Date'] || order['Created At'] || null;
                const completedTime = order['Completed Time'] || order['Completed Date'] || null;
                const quantity = parseInt(order['Quantity'], 10);

                batchIds.push(batchId);
                marketplaces.push(order['Marketplace'] || null);
                merchantSkus.push(order['Merchant SKU'] || null);
                quantities.push(isNaN(quantity) ? null : quantity);
                stockOuts.push(order['Stock-Out'] || null);
                statuses.push(order['Marketplace Status'] || null);
                orderTimes.push(safeDate(orderTime));
                completedTimes.push(safeDate(completedTime));
            }

            // Perform a single bulk insert using PostgreSQL UNNEST
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
                ) 
                SELECT * FROM UNNEST(
                    $1::uuid[], 
                    $2::text[], 
                    $3::text[], 
                    $4::int[], 
                    $5::text[], 
                    $6::text[], 
                    $7::timestamptz[], 
                    $8::timestamptz[]
                )
            `;

            await client.query(insertQuery, [
                batchIds,
                marketplaces,
                merchantSkus,
                quantities,
                stockOuts,
                statuses,
                orderTimes,
                completedTimes
            ]);

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                count: orders.length,
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
