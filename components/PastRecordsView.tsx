'use client';

import { useState, useEffect } from 'react';
import type { OrderRow } from '@/lib/analysis';
import { RefreshCw, Calendar, FileSpreadsheet, Trash2, BookOpen, AlertTriangle } from 'lucide-react';

interface PastRecord {
    batch_id: string;
    upload_timestamp: string;
    total_rows: string; // BIGINT count comes back as string from pg
    min_date: string | null;
    max_date: string | null;
}

interface PastRecordsViewProps {
    onLoadRecord: (orders: OrderRow[], uploadTime?: string) => void;
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
                const record = records.find(r => r.batch_id === batchId);
                const uploadTime = record ? record.upload_timestamp : new Date().toISOString();
                onLoadRecord(data.orders, uploadTime);
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

            setRecords(prev => prev.filter(r => r.batch_id !== batchId));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setDeletingBatch(null);
        }
    };

    const formatDateRange = (minDate: string | null, maxDate: string | null) => {
        if (!minDate && !maxDate) return 'No dates';

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
            <div className="flex flex-col justify-center items-center py-20" role="status" aria-live="polite">
                <RefreshCw className="animate-spin h-8 w-8 text-indigo-600 mb-3" />
                <span className="text-base font-bold text-slate-700">Loading upload history...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Upload History Log</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">Access previous file imports and report configurations</p>
                </div>
                <button
                    onClick={fetchHistory}
                    className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-all"
                    aria-label="Refresh upload history list"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
                    {error}
                </div>
            )}

            {records.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400">
                    No past records found. Upload an Excel file to see it here!
                </div>
            ) : (
                <div className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-sm bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/70" aria-label="Order Upload History">
                            <thead className="bg-slate-50/70">
                                <tr>
                                    <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Import Time
                                    </th>
                                    <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Data Date Range
                                    </th>
                                    <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Records Count
                                    </th>
                                    <th scope="col" className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {records.map((record) => (
                                    <tr key={record.batch_id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                            {new Date(record.upload_timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {formatDateRange(record.min_date, record.max_date)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">
                                            <span className="flex items-center gap-1.5">
                                                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                                                {record.total_rows} orders
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right text-sm">
                                            {confirmingDelete === record.batch_id ? (
                                                <div className="flex items-center justify-end gap-2" role="alert">
                                                    <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        Delete?
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteRecord(record.batch_id)}
                                                        disabled={deletingBatch === record.batch_id}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
                                                        aria-label="Confirm permanent deletion of batch"
                                                    >
                                                        {deletingBatch === record.batch_id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmingDelete(null)}
                                                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2.5">
                                                    <button
                                                        onClick={() => handleLoadRecord(record.batch_id)}
                                                        disabled={loadingBatch === record.batch_id || deletingBatch === record.batch_id}
                                                        className="inline-flex items-center gap-1 px-4.5 py-2 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
                                                        aria-label="Load reports for historical batch"
                                                    >
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        {loadingBatch === record.batch_id ? 'Loading...' : 'View'}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmingDelete(record.batch_id)}
                                                        disabled={loadingBatch === record.batch_id}
                                                        className="inline-flex items-center gap-1 px-3 py-2 border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                                                        aria-label="Delete batch"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
