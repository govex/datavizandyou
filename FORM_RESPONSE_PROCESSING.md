# Processing Google Form Multiselect Responses

## The Problem

Google Sheets formulas (like QUERY, COUNTIF, SPLIT) that process form responses may not update the published CSV immediately because:
1. Formulas only recalculate when the spreadsheet is opened or edited
2. Published CSVs may be cached
3. Complex formulas can cause delays in recalculation

## Solution: Process Raw Form Responses with Apps Script

Instead of relying on spreadsheet formulas, use Google Apps Script to process the raw form responses and generate the aggregated data directly.

### Setup Instructions

1. Open your Google Form
2. Go to Responses tab → Click the Google Sheets icon to link/view responses
3. In the Responses spreadsheet, go to Extensions → Apps Script
4. Replace the existing code with the code below
5. Save and authorize the script
6. Run `createTrigger()` once to set up automatic processing

### Apps Script Code

```javascript
// Configuration
const WEBHOOK_URL = 'YOUR_NETLIFY_WEBHOOK_URL';

// Sheet names (adjust if different)
const FORM_RESPONSES_SHEET = 'Form Responses 1';
const TOOLBOX_SHEET = 'ToolBox';
const CHARTS_SHEET = 'Charts';

/**
 * Processes form responses and updates aggregate sheets
 * Call this when new form responses arrive
 */
function processFormResponses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responsesSheet = ss.getSheetByName(FORM_RESPONSES_SHEET);
  
  if (!responsesSheet) {
    Logger.log('Form responses sheet not found');
    return;
  }
  
  // Get all responses (skip header row)
  const data = responsesSheet.getDataRange().getValues();
  const headers = data[0];
  const responses = data.slice(1);
  
  // Find the column indexes for your multiselect questions
  // Adjust these based on your actual form questions
  const toolboxColumnIndex = headers.findIndex(h => h.toLowerCase().includes('tool'));
  const chartsColumnIndex = headers.findIndex(h => h.toLowerCase().includes('chart'));
  
  if (toolboxColumnIndex === -1 || chartsColumnIndex === -1) {
    Logger.log('Could not find question columns. Headers: ' + headers.join(', '));
    return;
  }
  
  // Count occurrences for each multiselect option
  const toolboxCounts = {};
  const chartsCounts = {};
  
  responses.forEach(row => {
    // Process toolbox responses (multiselect separated by commas)
    if (row[toolboxColumnIndex]) {
      const toolboxItems = row[toolboxColumnIndex].toString().split(',').map(s => s.trim());
      toolboxItems.forEach(item => {
        if (item) {
          toolboxCounts[item] = (toolboxCounts[item] || 0) + 1;
        }
      });
    }
    
    // Process charts responses (multiselect separated by commas)
    if (row[chartsColumnIndex]) {
      const chartItems = row[chartsColumnIndex].toString().split(',').map(s => s.trim());
      chartItems.forEach(item => {
        if (item) {
          chartsCounts[item] = (chartsCounts[item] || 0) + 1;
        }
      });
    }
  });
  
  // Update or create the ToolBox sheet
  updateAggregateSheet(ss, TOOLBOX_SHEET, toolboxCounts);
  
  // Update or create the Charts sheet
  updateAggregateSheet(ss, CHARTS_SHEET, chartsCounts);
  
  Logger.log('Form responses processed successfully');
  Logger.log('ToolBox items: ' + JSON.stringify(toolboxCounts));
  Logger.log('Charts items: ' + JSON.stringify(chartsCounts));
}

/**
 * Updates or creates an aggregate sheet with label/value pairs
 */
function updateAggregateSheet(spreadsheet, sheetName, counts) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  // Clear existing data
  sheet.clear();
  
  // Write header
  sheet.appendRow(['Label', 'Value']);
  
  // Write data sorted by count (descending)
  const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  sortedEntries.forEach(([label, count]) => {
    sheet.appendRow([label, count]);
  });
  
  // Format the sheet
  const headerRange = sheet.getRange('A1:B1');
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4a90e2');
  headerRange.setFontColor('#ffffff');
  
  sheet.autoResizeColumns(1, 2);
}

/**
 * Triggers when a new form response is submitted
 */
function onFormSubmit(e) {
  Logger.log('New form response received');
  processFormResponses();
  
  // Send webhook notification
  sendWebhook({
    type: 'form_submit',
    timestamp: new Date().toISOString(),
    responseCount: e.range.getRow() - 1 // Row number minus header
  });
}

/**
 * Sends webhook notification
 */
function sendWebhook(data) {
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      Logger.log('Webhook sent successfully');
    } else {
      Logger.log('Webhook failed with code: ' + responseCode);
    }
  } catch (error) {
    Logger.log('Error sending webhook: ' + error.toString());
  }
}

/**
 * Adds custom menu for manual processing
 */
function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Form Processing')
    .addItem('Process All Responses', 'processFormResponses')
    .addItem('Send Update to Website', 'manualSync')
    .addToUi();
}

/**
 * Manual sync function
 */
function manualSync() {
  processFormResponses();
  sendWebhook({
    type: 'manual_sync',
    timestamp: new Date().toISOString()
  });
  SpreadsheetApp.getUi().alert('Data processed and synced successfully!');
}

/**
 * Creates installable triggers
 * Run this once to set up automatic processing
 */
function createTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  const ss = SpreadsheetApp.getActive();
  
  // Trigger when form is submitted
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
  
  // Trigger on open
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(ss)
    .onOpen()
    .create();
  
  Logger.log('Triggers created successfully');
  
  // Process existing responses
  processFormResponses();
}
```

## How It Works

1. **Automatic Processing**: When a new form response arrives, `onFormSubmit` triggers automatically
2. **Aggregation**: The script reads all form responses, splits multiselect answers, and counts occurrences
3. **Sheet Update**: Aggregate sheets (ToolBox, Charts) are updated with fresh counts
4. **CSV Publishing**: The updated sheets are immediately available via published CSV URLs
5. **Webhook Notification**: Your website is notified to refresh the data

## Advantages

✅ **Real-time updates**: No need to open the spreadsheet
✅ **No formula lag**: Direct processing is faster than formulas
✅ **Reliable**: Works even if spreadsheet is closed
✅ **Scalable**: Handles large numbers of responses efficiently
✅ **Debugging**: Logger statements help troubleshoot issues

## Testing

1. Run `createTrigger()` to set up the script
2. Submit a test form response
3. Check Apps Script logs (View > Executions) to verify processing
4. Check the ToolBox and Charts sheets for updated data
5. Your website should refresh automatically within 30 seconds

## Customization

Adjust these variables based on your form:

```javascript
// Sheet names
const FORM_RESPONSES_SHEET = 'Form Responses 1'; // Your response sheet name
const TOOLBOX_SHEET = 'ToolBox';                 // Sheet for toolbox data
const CHARTS_SHEET = 'Charts';                   // Sheet for charts data

// Column detection - adjust if your questions have different text
const toolboxColumnIndex = headers.findIndex(h => h.toLowerCase().includes('tool'));
const chartsColumnIndex = headers.findIndex(h => h.toLowerCase().includes('chart'));
```

## Troubleshooting

**Issue**: Script can't find columns
- Check the Logger output for actual header names
- Update the `findIndex` conditions to match your question text

**Issue**: Multiselect not parsing correctly
- Check how Google Forms separates multiselect values (usually commas)
- Adjust the `split(',')` if your form uses different separators

**Issue**: Webhook not being sent
- Verify `WEBHOOK_URL` is correct
- Check Netlify function logs for incoming requests
- Ensure CORS headers allow the request

**Issue**: Trigger not firing
- Run `createTrigger()` again
- Check Apps Script > Triggers page to verify trigger exists
- Check Apps Script > Executions for any error messages
