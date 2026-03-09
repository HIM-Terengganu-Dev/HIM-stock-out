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
}

export default function PastRecordsView({ onLoadRecord }: PastRecordsViewProps) {
    const [records, setRecords] = useState<PastRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingBatch, setLoadingBatch] = useState<string | null>(null);
    const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/orders/history');
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

            const res = await fetch(`/api/orders/history/${batchId}`);

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
        if (!confirm('Are you sure you want to delete this past record? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingBatch(batchId);
            setError(null);

            const res = await fetch(`/api/orders/history/${batchId}`, {
                method: 'DELETE'
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
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading past records...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Past Records</h2>
                <button
                    onClick={fetchHistory}
                    className="text-sm text-blue-600 hover:text-blue-800"
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
                <div className="text-center py-12 bg-white rounded-lg border shadow-sm text-gray-500">
                    No past records found. Upload an Excel file to see it here!
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Upload Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date Range
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Rows
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {records.map((record) => (
                                <tr key={record.batch_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {new Date(record.upload_timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDateRange(record.min_date, record.max_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.total_rows} orders
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        <button
                                            onClick={() => handleLoadRecord(record.batch_id)}
                                            disabled={loadingBatch === record.batch_id || deletingBatch === record.batch_id}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {loadingBatch === record.batch_id ? 'Loading...' : 'View Reports'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRecord(record.batch_id)}
                                            disabled={loadingBatch === record.batch_id || deletingBatch === record.batch_id}
                                            className="inline-flex items-center px-3 py-1.5 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                        >
                                            {deletingBatch === record.batch_id ? 'Wait...' : 'Delete'}
                                        </button>
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
