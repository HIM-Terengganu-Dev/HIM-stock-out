# Stock-Out Tracker

A Next.js web application for tracking stock-out quantities by merchant SKU from Excel order files.

## Features

- 📊 **4 Different Reports**:
  1. All Marketplace (Excluding Canceled/Cancelled)
  2. All Marketplace (Status = Completed)
  3. Grouped by Marketplace (TikTok, Shopee, Lazada)
  4. Detailed Stock-Out by Marketplace and Merchant SKU

- 📁 **Drag & Drop File Upload**: Easy Excel file import
- ⚡ **Fast Analysis**: Client-side processing for instant results
- 📥 **Export to Excel**: Download reports in Excel format
- 🎯 **Automatic SKU Breakdown**: Combo SKUs are automatically broken down into components

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## How to Use

1. Upload your orders Excel file using drag-and-drop or file browser
2. The application will automatically:
   - Filter for TikTok, Shopee, and Lazada marketplaces
   - Exclude canceled/cancelled orders
   - Break down combo SKUs into components
   - Calculate stock-out quantities
3. View the generated reports
4. Export any report to Excel format

## Data Format

The Excel file should contain the following columns:
- `Marketplace`: Should be "TikTok", "Shopee", or "Lazada"
- `Merchant SKU`: The SKU identifier
- `Quantity`: Order quantity
- `Stock-Out`: Should be "Yes" or "No"
- `Marketplace Status`: Order status (will exclude "Canceled", "Cancelled", "Cancellation")

## Merchant SKU Reference

The merchant SKU reference data (combo and single SKUs) is hardcoded in the application for fast processing.




