'use client';

import { useState, useEffect } from 'react';
import type { OrderRow } from '@/lib/analysis';

interface PastRecord {
    batch_id: string;
    upload_timestamp: string;
    total_rows: string; // BIGINT count comes back as string from pg
    min_date: string | null;
    max_date: string | null;
}

interface PastRecordsViewProps {
    onLoadRecord: (orders: OrderRow[]) => void;
    refreshKey?: number;
}

export default function PastRecordsView({ onLoadRecord, refreshKey }: PastRecordsViewProps) {
    const [records, setRecords] = useState<PastRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingBatch, setLoadingBatch] = useState<string | null>(null);
    const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, [refreshKey]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/orders/history', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setRecords(data.history || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadRecord = async (batchId: string) => {
        try {
            setLoadingBatch(batchId);
            setError(null);

            const res = await fetch(`/api/orders/history/${batchId}`, { cache: 'no-store' });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to load record details');
            }

            const data = await res.json();

            if (data.orders && Array.isArray(data.orders)) {
                onLoadRecord(data.orders);
            } else {
                throw new Error('Invalid format received from server');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoadingBatch(null);
        }
    };

    const handleDeleteRecord = async (batchId: string) => {
        try {
            setDeletingBatch(batchId);
            setConfirmingDelete(null);
            setError(null);

            const res = await fetch(`/api/orders/history/${batchId}`, {
                method: 'DELETE',
                cache: 'no-store'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete record');
            }

            // Immediately remove from the local state so UI updates instantly
            setRecords(prev => prev.filter(r => r.batch_id !== batchId));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setDeletingBatch(null);
        }
    };

    const formatDateRange = (minDate: string | null, maxDate: string | null) => {
        if (!minDate && !maxDate) return 'Unknown';

        const formatDate = (dateStr: string) => {
            return new Intl.DateTimeFormat('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            }).format(new Date(dateStr));
        };

        if (minDate && maxDate) {
            return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
        }

        return minDate ? formatDate(minDate) : (maxDate ? formatDate(maxDate) : 'Unknown');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" aria-hidden="true"></div>
                <span className="ml-4 text-base font-semibold text-gray-700">Loading upload history...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Upload History</h2>
                <button
                    onClick={fetchHistory}
                    className="text-base font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4"
                    aria-label="Refresh upload history list"
                >
                    Refresh List
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {records.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200 text-base font-medium text-gray-500">
                    No past records found. Upload an Excel file to see it here!
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-md">
                    <table className="min-w-full divide-y divide-gray-200" aria-label="Order Upload History">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-base font-bold text-gray-700 uppercase tracking-wider">
                                    Upload Time
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-base font-bold text-gray-700 uppercase tracking-wider">
                                    Date Range
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-base font-bold text-gray-700 uppercase tracking-wider">
                                    Total Rows
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-base font-bold text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {records.map((record) => (
                                <tr key={record.batch_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-5 whitespace-nowrap text-base font-semibold text-gray-900">
                                        {new Date(record.upload_timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-600">
                                        {formatDateRange(record.min_date, record.max_date)}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-base text-gray-600 font-medium">
                                        {record.total_rows} orders
                                    </td>
                                    <td className="px-6 py-5 text-right text-base space-x-3">
                                        {confirmingDelete === record.batch_id ? (
                                            <div className="flex items-center justify-end gap-3" role="alert">
                                                <span className="text-base font-bold text-red-600">Confirm delete?</span>
                                                <button
                                                    onClick={() => handleDeleteRecord(record.batch_id)}
                                                    disabled={deletingBatch === record.batch_id}
                                                    className="inline-flex items-center px-4 py-2 rounded-lg text-base font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm"
                                                    aria-label={`Confirm permanent deletion of batch from ${new Date(record.upload_timestamp).toLocaleString()}`}
                                                >
                                                    {deletingBatch === record.batch_id ? 'Deleting...' : 'Yes, Delete'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingDelete(null)}
                                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-base font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleLoadRecord(record.batch_id)}
                                                    disabled={loadingBatch === record.batch_id || deletingBatch === record.batch_id}
                                                    className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50"
                                                    aria-label={`View reports for batch from ${new Date(record.upload_timestamp).toLocaleString()}`}
                                                >
                                                    {loadingBatch === record.batch_id ? 'Loading...' : 'View Reports'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingDelete(record.batch_id)}
                                                    disabled={loadingBatch === record.batch_id}
                                                    className="inline-flex items-center px-5 py-2.5 border border-red-200 rounded-lg shadow-sm text-base font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50"
                                                    aria-label={`Delete batch from ${new Date(record.upload_timestamp).toLocaleString()}`}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
