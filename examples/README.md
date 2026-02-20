# Example Data Files

This directory contains example CSV files that demonstrate the expected data format for the GovEx Data Visualization app.

## File Format

Your CSV files should have exactly 2 columns:
- **Column 1 (Label)**: Text labels for your data items
- **Column 2 (Value)**: Numeric values for the bars

### Example

```csv
Label,Value
Excel,45
Tableau,30
Power BI,15
R,10
```

## Files

- `sample-toolbox-data.csv` - Example data for the GovEx Tool Box chart
- `sample-charts-data.csv` - Example data for the GovEx Most Used Charts chart

## Using These Files

### Option 1: Import to Google Sheets

1. Create a new Google Sheet
2. Go to File > Import
3. Upload one of these CSV files
4. Publish the sheet as CSV (File > Share > Publish to web)
5. Copy the URL and use it in `src/App.svelte`

### Option 2: Create Your Own

1. Open Google Sheets
2. Create a new spreadsheet
3. Add your data in two columns: Label and Value
4. Make sure the first row contains headers: `Label,Value`
5. Publish as CSV and use the URL in your app

## Data Guidelines

- **Labels**: Keep them short for better mobile display
- **Values**: Must be numeric (integers or decimals)
- **Rows**: No practical limit, but keep it reasonable for visualization
- **Special Characters**: If your labels contain commas, the CSV parser will handle quoted fields

## Advanced: Multiple Sheets

To use different data for each chart:

1. Create multiple sheets in one Google Sheets document
2. Name them appropriately (e.g., "ToolBox", "Charts")
3. Publish each sheet individually as CSV
4. Each published sheet will have a different `gid` parameter in its URL
