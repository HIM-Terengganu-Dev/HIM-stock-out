import pandas as pd
import json
from collections import defaultdict

# Read the data files
orders = pd.read_excel('orders-data/Order-SKU-all20251214082629172.xlsx')
combo_ref = pd.read_csv('merchant-sku-reference/merchant_sku_combo.csv')
single_ref = pd.read_csv('merchant-sku-reference/merchant_sku_single.csv')

# Filter for TikTok, Shopee, Lazada marketplaces only
target_marketplaces = ['TikTok', 'Shopee', 'Lazada']
orders_filtered = orders[orders['Marketplace'].isin(target_marketplaces)].copy()

print(f'Total orders in filtered data: {len(orders_filtered)}')
print(f'Marketplaces: {orders_filtered["Marketplace"].value_counts().to_dict()}')

# Create lookup dictionaries for faster processing
combo_skus_dict = {}
for idx, row in combo_ref.iterrows():
    combo_skus_dict[row['merchant_sku']] = json.loads(row['components'])

single_skus_set = set(single_ref['merchant_sku'].unique())

def calculate_stockout_quantities(df):
    """
    Calculate stock-out quantities by component merchant_sku.
    Returns a dictionary with merchant_sku as key and total quantity as value.
    """
    stockout_quantities = defaultdict(int)
    
    # Filter for stock-out orders only
    stockout_orders = df[df['Stock-Out'] == 'Yes'].copy()
    
    for idx, row in stockout_orders.iterrows():
        merchant_sku = row['Merchant SKU']
        order_qty = row['Quantity']
        
        if pd.isna(merchant_sku):
            continue
            
        # Check if it's a combo SKU
        if merchant_sku in combo_skus_dict:
            components = combo_skus_dict[merchant_sku]
            for comp in components:
                component_sku = comp['component_merchant_sku']
                component_qty = comp['qty']
                total_qty = component_qty * order_qty
                stockout_quantities[component_sku] += total_qty
        # Check if it's a single SKU
        elif merchant_sku in single_skus_set:
            stockout_quantities[merchant_sku] += order_qty
        # SKU not in reference (handle as single SKU)
        else:
            stockout_quantities[merchant_sku] += order_qty
    
    return dict(stockout_quantities)

def generate_report(df, report_name, output_file):
    """Generate a stock-out report and save to Excel"""
    stockout_qty = calculate_stockout_quantities(df)
    
    # Create DataFrame for the report
    report_data = []
    for sku, qty in sorted(stockout_qty.items(), key=lambda x: x[1], reverse=True):
        report_data.append({
            'merchant_sku': sku,
            'stock_out_quantity': qty
        })
    
    report_df = pd.DataFrame(report_data)
    
    # Add summary statistics
    total_orders = len(df)
    stockout_orders = len(df[df['Stock-Out'] == 'Yes'])
    total_stockout_qty = sum(stockout_qty.values())
    
    print(f'\n=== {report_name} ===')
    print(f'Total orders: {total_orders}')
    print(f'Stock-out orders: {stockout_orders}')
    print(f'Total stock-out quantity (all components): {total_stockout_qty}')
    print(f'Unique merchant_skus: {len(stockout_qty)}')
    print(f'\nTop 10 stock-out quantities:')
    print(report_df.head(10).to_string(index=False))
    
    # Save to Excel
    report_df.to_excel(output_file, index=False)
    print(f'\nReport saved to: {output_file}')

# Report 1: All marketplace (TikTok, Shopee, Lazada), all marketplace_status excluding "Canceled" and "Cancelled"
print('\n' + '='*80)
print('REPORT 1: All Marketplace (TikTok, Shopee, Lazada), Excluding Canceled/Cancelled')
print('='*80)
report1_df = orders_filtered[~orders_filtered['Marketplace Status'].isin(['Canceled', 'Cancelled', 'Cancellation'])].copy()
generate_report(report1_df, 'Report 1', 'report1_all_marketplace_excluding_canceled.xlsx')

# Report 2: All marketplace, but marketplace_status = "Completed"
print('\n' + '='*80)
print('REPORT 2: All Marketplace, Status = Completed')
print('='*80)
report2_df = orders_filtered[orders_filtered['Marketplace Status'] == 'Completed'].copy()
generate_report(report2_df, 'Report 2', 'report2_all_marketplace_completed.xlsx')

# Report 3: All marketplace_status grouped by marketplace (one report per marketplace), excluding canceled
print('\n' + '='*80)
print('REPORT 3: Grouped by Marketplace (One Report Per Marketplace), Excluding Canceled/Cancelled')
print('='*80)
for marketplace in target_marketplaces:
    marketplace_df = orders_filtered[
        (orders_filtered['Marketplace'] == marketplace) & 
        (~orders_filtered['Marketplace Status'].isin(['Canceled', 'Cancelled', 'Cancellation']))
    ].copy()
    if len(marketplace_df) > 0:
        output_file = f'report3_{marketplace.lower()}_all_status.xlsx'
        print(f'\n--- {marketplace} ---')
        generate_report(marketplace_df, f'Report 3 - {marketplace}', output_file)

# Report 4: Detailed stock out quantity by marketplace, detailed by merchant_sku, excluding canceled
print('\n' + '='*80)
print('REPORT 4: Detailed Stock-Out by Marketplace and Merchant SKU (Excluding Canceled/Cancelled)')
print('='*80)

report4_data = []
for marketplace in target_marketplaces:
    marketplace_df = orders_filtered[
        (orders_filtered['Marketplace'] == marketplace) & 
        (~orders_filtered['Marketplace Status'].isin(['Canceled', 'Cancelled', 'Cancellation']))
    ].copy()
    stockout_orders = marketplace_df[marketplace_df['Stock-Out'] == 'Yes'].copy()
    
    for idx, row in stockout_orders.iterrows():
        merchant_sku = row['Merchant SKU']
        order_qty = row['Quantity']
        
        if pd.isna(merchant_sku):
            continue
        
        # Check if it's a combo SKU
        if merchant_sku in combo_skus_dict:
            components = combo_skus_dict[merchant_sku]
            for comp in components:
                component_sku = comp['component_merchant_sku']
                component_qty = comp['qty']
                total_qty = component_qty * order_qty
                report4_data.append({
                    'marketplace': marketplace,
                    'merchant_sku': component_sku,
                    'stock_out_quantity': total_qty,
                    'order_merchant_sku': merchant_sku,
                    'order_quantity': order_qty,
                    'component_qty_per_unit': component_qty
                })
        # Check if it's a single SKU
        elif merchant_sku in single_skus_set:
            report4_data.append({
                'marketplace': marketplace,
                'merchant_sku': merchant_sku,
                'stock_out_quantity': order_qty,
                'order_merchant_sku': merchant_sku,
                'order_quantity': order_qty,
                'component_qty_per_unit': 1
            })
        # SKU not in reference
        else:
            report4_data.append({
                'marketplace': marketplace,
                'merchant_sku': merchant_sku,
                'stock_out_quantity': order_qty,
                'order_merchant_sku': merchant_sku,
                'order_quantity': order_qty,
                'component_qty_per_unit': 1
            })

report4_df = pd.DataFrame(report4_data)

# Create summary by marketplace and merchant_sku
report4_summary = report4_df.groupby(['marketplace', 'merchant_sku'])['stock_out_quantity'].sum().reset_index()
report4_summary = report4_summary.sort_values(['marketplace', 'stock_out_quantity'], ascending=[True, False])

print(f'\nTotal stock-out records: {len(report4_df)}')
print(f'Unique marketplace-merchant_sku combinations: {len(report4_summary)}')
print(f'\nSummary by Marketplace:')
for marketplace in target_marketplaces:
    marketplace_summary = report4_summary[report4_summary['marketplace'] == marketplace]
    if len(marketplace_summary) > 0:
        total_qty = marketplace_summary['stock_out_quantity'].sum()
        print(f'\n{marketplace}:')
        print(f'  Total stock-out quantity: {total_qty}')
        print(f'  Unique merchant_skus: {len(marketplace_summary)}')
        print(f'  Top 10:')
        print(marketplace_summary.head(10).to_string(index=False))

# Save detailed report
with pd.ExcelWriter('report4_detailed_by_marketplace.xlsx', engine='openpyxl') as writer:
    report4_summary.to_excel(writer, sheet_name='Summary by Marketplace', index=False)
    report4_df.to_excel(writer, sheet_name='Detailed Records', index=False)

print(f'\nDetailed report saved to: report4_detailed_by_marketplace.xlsx')
print('  - Sheet 1: Summary by Marketplace (aggregated)')
print('  - Sheet 2: Detailed Records (all individual breakdowns)')

print('\n' + '='*80)
print('ALL REPORTS GENERATED SUCCESSFULLY!')
print('='*80)
