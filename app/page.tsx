'use client';

import { useState, useCallback } from 'react';
import { parseExcelFile, exportToExcel, exportReport4, exportBreakdownReport, exportMissingMerchantSkus } from '@/lib/excelUtils';
import { generateReport1, generateReport2, generateReport3, generateReport4, generateBreakdownReport, findMissingMerchantSkus, getDateRange, OrderRow, MissingMerchantSku } from '@/lib/analysis';
import FileUpload from '@/components/FileUpload';
import ReportDisplay from '@/components/ReportDisplay';

export default function Home() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report1, setReport1] = useState<any[]>([]);
  const [report2, setReport2] = useState<any[]>([]);
  const [report3, setReport3] = useState<Record<string, any[]>>({});
  const [report4, setReport4] = useState<{ summary: any[]; detailed: any[] } | null>(null);
  const [breakdownReport, setBreakdownReport] = useState<any[]>([]);
  const [missingMerchantSkus, setMissingMerchantSkus] = useState<MissingMerchantSku[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderRow[]>([]);

  // Helper function to get date range for Report 1 (excluding canceled)
  const getReport1DateRange = () => {
    const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
    const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];
    const filtered = filteredOrders.filter(order => 
      TARGET_MARKETPLACES.includes(order['Marketplace'] || '')
    );
    const excludingCanceled = filtered.filter(order => 
      !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
    );
    return getDateRange(excludingCanceled);
  };

  // Helper function to get date range for Report 2 (completed only)
  const getReport2DateRange = () => {
    const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
    const filtered = filteredOrders.filter(order => 
      TARGET_MARKETPLACES.includes(order['Marketplace'] || '')
    );
    const completed = filtered.filter(order => order['Marketplace Status'] === 'Completed');
    return getDateRange(completed);
  };

  // Helper function to get date range for Report 3 (by marketplace, excluding canceled)
  const getReport3DateRange = (marketplace: string) => {
    const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];
    const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
    const filtered = filteredOrders.filter(order => 
      TARGET_MARKETPLACES.includes(order['Marketplace'] || '')
    );
    const excludingCanceled = filtered.filter(order => 
      !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
    );
    const marketplaceOrders = excludingCanceled.filter(order => order['Marketplace'] === marketplace);
    return getDateRange(marketplaceOrders);
  };

  // Helper function to get date range for Report 4 (excluding canceled)
  const getReport4DateRange = () => {
    const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
    const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];
    const filtered = filteredOrders.filter(order => 
      TARGET_MARKETPLACES.includes(order['Marketplace'] || '')
    );
    const excludingCanceled = filtered.filter(order => 
      !CANCELED_STATUSES.includes(order['Marketplace Status'] || '')
    );
    return getDateRange(excludingCanceled);
  };

  // Helper function to get date range for Breakdown Report (excluding canceled)
  const getBreakdownDateRange = () => {
    const TARGET_MARKETPLACES = ['TikTok', 'Shopee', 'Lazada'];
    const CANCELED_STATUSES = ['Canceled', 'Cancelled', 'Cancellation'];
    const filtered = filteredOrders.filter(order => 
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
      const parsedOrders = await parseExcelFile(file);
      setOrders(parsedOrders);
      setFilteredOrders(parsedOrders);
      
      // Generate all reports
      const r1 = generateReport1(parsedOrders);
      const r2 = generateReport2(parsedOrders);
      const r3 = generateReport3(parsedOrders);
      const r4 = generateReport4(parsedOrders);
      const breakdown = generateBreakdownReport(parsedOrders);
      const missing = findMissingMerchantSkus(parsedOrders);
      
      setReport1(r1);
      setReport2(r2);
      setReport3(r3);
      setReport4(r4);
      setBreakdownReport(breakdown);
      setMissingMerchantSkus(missing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExportReport1 = () => {
    if (report1.length > 0) {
      exportToExcel(report1, 'report1_all_marketplace_excluding_canceled.xlsx');
    }
  };

  const handleExportReport2 = () => {
    if (report2.length > 0) {
      exportToExcel(report2, 'report2_all_marketplace_completed.xlsx');
    }
  };

  const handleExportReport3 = (marketplace: string) => {
    if (report3[marketplace] && report3[marketplace].length > 0) {
      exportToExcel(report3[marketplace], `report3_${marketplace.toLowerCase()}_all_status.xlsx`);
    }
  };

  const handleExportReport4 = () => {
    if (report4) {
      exportReport4(report4.summary, report4.detailed, 'report4_detailed_by_marketplace.xlsx');
    }
  };

  const handleExportBreakdown = () => {
    if (breakdownReport.length > 0) {
      exportBreakdownReport(breakdownReport, 'breakdown_report_by_marketplace_and_merchant_sku.xlsx');
    }
  };

  const handleExportMissingSkus = () => {
    if (missingMerchantSkus.length > 0) {
      exportMissingMerchantSkus(missingMerchantSkus, 'missing_merchant_skus.xlsx');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock-Out Tracker</h1>
        <p className="text-gray-600 mb-8">Upload your orders Excel file to generate stock-out reports</p>

        <FileUpload onFileUpload={handleFileUpload} loading={loading} />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <p className="text-sm text-gray-600">
                Loaded <span className="font-semibold">{orders.length}</span> orders
              </p>
            </div>

            <div className="space-y-6">
              {/* Report 1 */}
              <ReportDisplay
                title="Report 1: All Marketplace (Excluding Canceled/Cancelled)"
                dateRange={getReport1DateRange()}
                data={report1}
                onExport={handleExportReport1}
              />

              {/* Report 2 */}
              <ReportDisplay
                title="Report 2: All Marketplace (Status = Completed)"
                dateRange={getReport2DateRange()}
                data={report2}
                onExport={handleExportReport2}
              />

              {/* Report 3 */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Report 3: Grouped by Marketplace</h2>
                  {getReport3DateRange(Object.keys(report3)[0] || '') && (
                    <p className="text-sm text-gray-500 mt-1">Date Range: {getReport3DateRange(Object.keys(report3)[0] || '')}</p>
                  )}
                </div>
                <div className="space-y-4">
                  {Object.entries(report3).map(([marketplace, data]) => (
                    <div key={marketplace} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-semibold">{marketplace}</h3>
                          {getReport3DateRange(marketplace) && (
                            <p className="text-xs text-gray-500 mt-1">Date Range: {getReport3DateRange(marketplace)}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleExportReport3(marketplace)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Export
                        </button>
                      </div>
                      <ReportDisplay
                        title=""
                        data={data}
                        onExport={() => {}}
                        hideExportButton
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Report 4 */}
              {report4 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">Report 4: Detailed Stock-Out by Marketplace</h2>
                      {getReport4DateRange() && (
                        <p className="text-sm text-gray-500 mt-1">Date Range: {getReport4DateRange()}</p>
                      )}
                    </div>
                    <button
                      onClick={handleExportReport4}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Export
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Summary by Marketplace</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marketplace</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Merchant SKU</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Category</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock-Out Quantity</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {report4.summary.slice(0, 20).map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-sm">{row.marketplace}</td>
                                <td className="px-4 py-2 text-sm">{row.merchant_sku}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{row.product_category || '-'}</td>
                                <td className="px-4 py-2 text-sm font-semibold">{row.stock_out_quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {report4.summary.length > 20 && (
                        <p className="text-sm text-gray-500 mt-2">
                          Showing first 20 of {report4.summary.length} records. Export to see all.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Breakdown Report */}
              {breakdownReport.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">Breakdown Report: By Marketplace and Merchant SKU</h2>
                      {getBreakdownDateRange() && (
                        <p className="text-sm text-gray-500 mt-1">Date Range: {getBreakdownDateRange()}</p>
                      )}
                    </div>
                    <button
                      onClick={handleExportBreakdown}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Export
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marketplace
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Merchant SKU (Order Item)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Merchandise SKU (Component/Tracked Item)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Merchandise Quantity per Order Item
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Merchandise Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {breakdownReport.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{row.marketplace}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.merchant_sku_order_item}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{row.order_quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{row.merchandise_sku_component}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{row.product_category || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{row.merchandise_quantity_per_order_item}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.total_merchandise_quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {breakdownReport.length > 50 && (
                    <p className="text-sm text-gray-500 mt-4">
                      Showing first 50 of {breakdownReport.length} records. Export to see all.
                    </p>
                  )}
                </div>
              )}

              {/* Missing Merchant SKUs Report */}
              <div className={`bg-white rounded-lg shadow p-6 border-2 ${missingMerchantSkus.length > 0 ? 'border-yellow-300' : 'border-green-300'}`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className={`text-xl font-semibold ${missingMerchantSkus.length > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                      {missingMerchantSkus.length > 0 ? '⚠️ Missing Merchant SKUs' : '✅ All Merchant SKUs Present'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {missingMerchantSkus.length > 0 
                        ? 'Merchant SKUs from TikTok, Shopee, and Lazada orders that are not yet hardcoded in the reference files'
                        : 'All merchant SKUs from TikTok, Shopee, and Lazada orders are present in the reference files'}
                    </p>
                  </div>
                  {missingMerchantSkus.length > 0 && (
                    <button
                      onClick={handleExportMissingSkus}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Export to Excel
                    </button>
                  )}
                </div>
                {missingMerchantSkus.length > 0 ? (
                  <>
                    <div className="mb-4 text-sm text-gray-600">
                      <p>Total Missing Merchant SKUs: <span className="font-semibold">{missingMerchantSkus.length}</span></p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-yellow-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Marketplace
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Merchant SKU
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {missingMerchantSkus.map((item, idx) => (
                            <tr key={idx} className="hover:bg-yellow-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.marketplace}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.merchant_sku}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-lg font-semibold text-green-700">All merchant SKUs are accounted for!</p>
                    <p className="text-sm text-gray-600 mt-2">No missing merchant SKUs found in TikTok, Shopee, and Lazada orders.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

