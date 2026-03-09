'use client';

import { useState, useCallback, useEffect } from 'react';
import { parseExcelFile, exportToExcel, exportReport4, exportBreakdownReport, exportMissingMerchantSkus } from '@/lib/excelUtils';
import { generateReport1, generateReport2, generateReport3, generateReport4, generateBreakdownReport, findMissingMerchantSkus, getDateRange, filterByDateRange, OrderRow, MissingMerchantSku } from '@/lib/analysis';
import { updateMerchantSkusData } from '@/lib/merchantSkuReference';
import FileUpload from '@/components/FileUpload';
import ReportTabs from '@/components/ReportTabs';
import ReportContainer from '@/components/ReportContainer';
import MerchantSkuManager from '@/components/MerchantSkuManager';
import SkuNotification from '@/components/SkuNotification';
import DateRangePicker from '@/components/DateRangePicker';
import PastRecordsView from '@/components/PastRecordsView';

export default function Home() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [report1, setReport1] = useState<any[]>([]);
  const [report2, setReport2] = useState<any[]>([]);
  const [report3, setReport3] = useState<Record<string, any[]>>({});
  const [report4, setReport4] = useState<{ summary: any[]; detailed: any[] } | null>(null);
  const [breakdownReport, setBreakdownReport] = useState<any[]>([]);
  const [missingMerchantSkus, setMissingMerchantSkus] = useState<MissingMerchantSku[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderRow[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState('summary');
  const [showNotification, setShowNotification] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
  const [pastRecordsRefreshKey, setPastRecordsRefreshKey] = useState(0);
  const [dbSaveStatus, setDbSaveStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Function to generate all reports with current date range
  const generateAllReports = useCallback((orders: OrderRow[], dateRange: { start: Date | null, end: Date | null }) => {
    setReport1(generateReport1(orders, dateRange));
    setReport2(generateReport2(orders, dateRange));
    setReport3(generateReport3(orders, dateRange));
    setReport4(generateReport4(orders, dateRange));
    setBreakdownReport(generateBreakdownReport(orders, dateRange));
    setMissingMerchantSkus(findMissingMerchantSkus(orders));
  }, []);

  // Load merchant SKU data on mount (client-side)
  useEffect(() => {
    const loadMerchantSkus = async () => {
      try {
        const response = await fetch('/api/merchant-skus/data');
        if (response.ok) {
          const data = await response.json();
          updateMerchantSkusData(data);
        }
      } catch (error) {
        console.error('Failed to load merchant SKU data:', error);
      }
    };
    loadMerchantSkus();
  }, []);

  // Regenerate reports when date range changes
  useEffect(() => {
    if (orders.length > 0) {
      generateAllReports(orders, dateRange);
    }
  }, [dateRange, orders, generateAllReports]);

  // Helper functions for date ranges - now use filtered data based on user's date filter
  const getReport1DateRange = () => {
    const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
    const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];

    // Apply date filter first
    const dateFiltered = dateRange.start || dateRange.end
      ? filterByDateRange(filteredOrders, dateRange.start, dateRange.end, 'Order Time')
      : filteredOrders;

    const filtered = dateFiltered.filter(order =>
      TARGET_MARKETPLACES.includes(order['Marketplace'] || '')
    );
    const excludingCanceled = filtered.filter(order =>
      !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
    );
    return getDateRange(excludingCanceled);
  };

  // Helper function to format date range from user's filter
  const formatUserDateRange = (): string => {
    if (!dateRange.start && !dateRange.end) {
      return '';
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (dateRange.start && dateRange.end) {
      if (dateRange.start.getTime() === dateRange.end.getTime()) {
        return formatDate(dateRange.start);
      }
      return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    } else if (dateRange.start) {
      return `From ${formatDate(dateRange.start)}`;
    } else if (dateRange.end) {
      return `Until ${formatDate(dateRange.end)}`;
    }

    return '';
  };

  const getReport2DateRange = () => {
    // For Report 2, show the user's selected date range (filtered by Completed Time)
    return formatUserDateRange();
  };

  const getReport3DateRange = (marketplace: string) => {
    // For Report 3, show the user's selected date range (filtered by Order Time)
    // This is called per marketplace, but the date range is the same for all
    return formatUserDateRange();
  };

  const getReport4DateRange = () => {
    const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
    const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];

    // Apply date filter first
    const dateFiltered = dateRange.start || dateRange.end
      ? filterByDateRange(filteredOrders, dateRange.start, dateRange.end, 'Order Time')
      : filteredOrders;

    const filtered = dateFiltered.filter(order =>
      TARGET_MARKETPLACES.includes(order['Marketplace'] || '')
    );
    const excludingCanceled = filtered.filter(order =>
      !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
    );
    return getDateRange(excludingCanceled);
  };

  const getBreakdownDateRange = () => {
    const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
    const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];

    // Apply date filter first
    const dateFiltered = dateRange.start || dateRange.end
      ? filterByDateRange(filteredOrders, dateRange.start, dateRange.end, 'Order Time')
      : filteredOrders;

    const filtered = dateFiltered.filter(order =>
      TARGET_MARKETPLACES.includes(order['Marketplace'] || '')
    );
    const excludingCanceled = filtered.filter(order =>
      !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
    );
    return getDateRange(excludingCanceled);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // Ensure merchant SKU data is loaded before analysis
      try {
        const response = await fetch('/api/merchant-skus/data');
        if (response.ok) {
          const data = await response.json();
          updateMerchantSkusData(data);
        }
      } catch (err) {
        console.warn('Failed to reload merchant SKU data:', err);
      }

      const parsedOrders = await parseExcelFile(file);
      setOrders(parsedOrders);
      setFilteredOrders(parsedOrders);

      // Save the orders to the database
      const batchId = crypto.randomUUID();
      try {
        const uploadResponse = await fetch('/api/orders/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId, orders: parsedOrders }),
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('Failed to save to database:', errorData.error);
          setDbSaveStatus({ ok: false, message: `Failed to save to database: ${errorData.error || 'Unknown error'}` });
        } else {
          const successData = await uploadResponse.json();
          setDbSaveStatus({ ok: true, message: `✅ Saved ${successData.count} rows to database successfully!` });
          setPastRecordsRefreshKey(prev => prev + 1);
        }
      } catch (uploadObjErr) {
        console.error('Error saving to database:', uploadObjErr);
      }

      // Generate all reports with current date range
      generateAllReports(parsedOrders, dateRange);

      // Show notification after analysis
      setShowNotification(true);

      // Default to first report tab if data loaded
      setActiveTab('report1');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  }, [dateRange, generateAllReports]);

  const handleExportReport1 = () => {
    if (report1.length > 0) exportToExcel(report1, 'report1_all_marketplace_excluding_canceled.xlsx');
  };

  const handleExportReport2 = () => {
    if (report2.length > 0) exportToExcel(report2, 'report2_all_marketplace_completed.xlsx');
  };

  const handleExportReport3 = (marketplace: string) => {
    if (report3[marketplace] && report3[marketplace].length > 0) {
      exportToExcel(report3[marketplace], `report3_${marketplace.toLowerCase()}_all_status.xlsx`);
    }
  };

  const handleExportReport4 = () => {
    if (report4) exportReport4(report4.summary, report4.detailed, 'report4_detailed_by_marketplace.xlsx');
  };

  const handleExportBreakdown = () => {
    if (breakdownReport.length > 0) exportBreakdownReport(breakdownReport, 'breakdown_report_by_marketplace_and_merchant_sku.xlsx');
  };

  const handleExportMissingSkus = () => {
    if (missingMerchantSkus.length > 0) exportMissingMerchantSkus(missingMerchantSkus, 'missing_merchant_skus.xlsx');
  };

  // Tabs Configuration (removed 'missing' tab as it's now a notification)
  const tabs = [
    { id: 'report1', label: 'Report 1: Overview' },
    { id: 'report2', label: 'Report 2: Completed' },
    { id: 'report3', label: 'Report 3: By Marketplace' },
    { id: 'report4', label: 'Report 4: Detailed' },
    { id: 'breakdown', label: 'Breakdown' },
    { id: 'manage', label: 'Manage SKUs' },
    { id: 'past_records', label: 'Past Records' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock-Out Tracker</h1>
        <p className="text-gray-600 mb-8">Upload your orders Excel file to generate visual stock-out reports</p>

        <div className="flex gap-6 mb-8">
          {/* Left side - Notification area (25%) */}
          {showNotification && (
            <SkuNotification
              missingSkus={missingMerchantSkus}
              onClose={() => setShowNotification(false)}
            />
          )}

          {/* Right side - File Upload (75%) */}
          <div className={`${showNotification ? 'w-3/4' : 'w-full'}`}>
            <FileUpload onFileUpload={handleFileUpload} loading={loading} />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* DB Save Toast Notification */}
        {dbSaveStatus && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-white text-sm font-medium transition-all ${dbSaveStatus.ok ? 'bg-green-500' : 'bg-red-500'
              }`}
          >
            <span>{dbSaveStatus.message}</span>
            <button
              onClick={() => setDbSaveStatus(null)}
              className="ml-2 text-white/80 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {orders.length > 0 && (
          <DateRangePicker onDateRangeChange={(start, end) => setDateRange({ start, end })} />
        )}

        <div className="mt-8">
          <ReportTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

          <div className="bg-white rounded-lg shadow min-h-[400px] p-6">
            {activeTab === 'report1' && (
              <ReportContainer
                title="Report 1: All Marketplace (Excluding Canceled)"
                dateRange={getReport1DateRange()}
                data={report1}
                onExport={handleExportReport1}
              />
            )}

            {activeTab === 'report2' && (
              <ReportContainer
                title="Report 2: All Marketplace (Status = Completed)"
                dateRange={getReport2DateRange() || undefined}
                data={report2}
                onExport={handleExportReport2}
              />
            )}

            {activeTab === 'report3' && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold mb-4">Report 3: Grouped by Marketplace</h2>
                {Object.entries(report3).map(([marketplace, data]) => {
                  const marketplaceDateRange = getReport3DateRange(marketplace);
                  return (
                    <div key={marketplace} className="border-t pt-6 first:border-0 first:pt-0">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{marketplace}</h3>
                          {marketplaceDateRange && (
                            <p className="text-sm text-gray-500 mt-1">Date Range: {marketplaceDateRange}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleExportReport3(marketplace)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Export CSV
                        </button>
                      </div>
                      <ReportContainer
                        title=""
                        data={data}
                        onExport={() => { }}
                        hideExportButton
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'report4' && report4 && (
              <ReportContainer
                title="Report 4: Detailed Stock-Out by Marketplace"
                dateRange={getReport4DateRange()}
                data={report4.summary}
                onExport={handleExportReport4}
                visualsEnabled={true}
              // Note: Report 4 has a complex 'detailed' view that we are simplifying to summary for the Visual view passed here.
              // The original Report 4 table had a specific layout. 
              // For now, reusing ReportContainer with summary data for visuals.
              // The original specific table implementation for Report 4 might be desired for the "Table" view.
              // However, for this task, standardizing on ReportContainer is cleaner for now.
              // If we need the specific toggle for merchant SKU in Report 4, we might need to customize ReportContainer later.
              // For now, using the summary data which works for both table and visuals.
              />
            )}

            {activeTab === 'breakdown' && (
              // Breakdown is data-heavy and flat, visuals might be less useful or need specific grouping.
              // Enabling visuals regardless as per request "new tab for every report".
              <ReportContainer
                title="Breakdown Report: By Marketplace and Merchant SKU"
                dateRange={getBreakdownDateRange()}
                data={breakdownReport.map(item => ({
                  // Mapping for ReportDisplay compatibility
                  marketplace: item.marketplace,
                  merchant_sku: item.merchant_sku_order_item, // Show the order item SKU
                  product_category: item.product_category,
                  stock_out_quantity: item.total_merchandise_quantity
                }))}
                onExport={handleExportBreakdown}
              />
            )}

            {activeTab === 'manage' && (
              <MerchantSkuManager />
            )}

            {activeTab === 'past_records' && (
              <PastRecordsView
                key={pastRecordsRefreshKey}
                refreshKey={pastRecordsRefreshKey}
                onLoadRecord={(loadedOrders) => {
                  setOrders(loadedOrders);
                  setFilteredOrders(loadedOrders);
                  generateAllReports(loadedOrders, { start: null, end: null });
                  setDateRange({ start: null, end: null });
                  setActiveTab('report1');
                }}
              />
            )}

            {activeTab !== 'manage' && activeTab !== 'past_records' && orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>Please upload an Excel file or select a past record to view reports</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


