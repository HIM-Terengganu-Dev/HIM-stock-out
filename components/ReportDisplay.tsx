'use client';

interface ReportDisplayProps {
  title: string;
  data: Array<{ merchant_sku: string; stock_out_quantity: number }>;
  onExport: () => void;
  hideExportButton?: boolean;
}

export default function ReportDisplay({ title, data, onExport, hideExportButton = false }: ReportDisplayProps) {
  if (data.length === 0) {
    return null;
  }

  const totalQuantity = data.reduce((sum, item) => sum + item.stock_out_quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          {!hideExportButton && (
            <button
              onClick={onExport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export to Excel
            </button>
          )}
        </div>
      )}
      
      <div className="mb-4 text-sm text-gray-600">
        <p>Total Stock-Out Quantity: <span className="font-semibold">{totalQuantity}</span></p>
        <p>Unique Merchant SKUs: <span className="font-semibold">{data.length}</span></p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchant SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock-Out Quantity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.merchant_sku}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  {item.stock_out_quantity.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


