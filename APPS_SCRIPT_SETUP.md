# Google Apps Script Setup

This file contains the sample Google Apps Script code to set up webhooks for data updates.

## Setup Instructions

1. Open your Google Sheet
2. Go to Extensions > Apps Script
3. Delete any existing code
4. Paste the code below
5. Replace `YOUR_NETLIFY_WEBHOOK_URL` with your actual Netlify webhook URL (e.g., `https://your-site.netlify.app/.netlify/functions/webhook`)
6. Save the script
7. Run the `createTrigger` function once to set up the automatic triggers
8. Authorize the script when prompted

## Apps Script Code

```javascript
// Configuration
const WEBHOOK_URL = 'YOUR_NETLIFY_WEBHOOK_URL';

/**
 * Sends data to the webhook when the sheet is edited
 */
function onEdit(e) {
  // Get the edited sheet
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  
  // Only trigger for specific sheets if needed
  // Uncomment and modify if you want to limit to specific sheets
  // if (sheetName !== 'ToolBox' && sheetName !== 'Charts') return;
  
  sendWebhook({
    type: 'edit',
    sheet: sheetName,
    timestamp: new Date().toISOString(),
    user: e.user.getEmail()
  });
}

/**
 * Sends data to the webhook when the sheet is opened
 * Useful for periodic updates
 */
function onOpen(e) {
  // Add custom menu
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Data Sync')
    .addItem('Send Update to Website', 'manualSync')
    .addToUi();
}

/**
 * Manual sync function that can be triggered from the menu
 */
function manualSync() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = sheet.getSheets();
  
  allSheets.forEach(s => {
    sendWebhook({
      type: 'manual_sync',
      sheet: s.getName(),
      timestamp: new Date().toISOString(),
      rowCount: s.getLastRow()
    });
  });
  
  SpreadsheetApp.getUi().alert('Data synced successfully!');
}

/**
 * Sends the webhook request
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
 * Creates installable triggers for the spreadsheet
 * Run this function once to set up automatic triggers
 */
function createTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create new triggers
  const ss = SpreadsheetApp.getActive();
  
  // Trigger on edit
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  
  // Trigger on open
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(ss)
    .onOpen()
    .create();
  
  Logger.log('Triggers created successfully');
}
```

## How It Works

1. **onEdit Trigger**: Fires automatically whenever someone edits the spreadsheet
2. **onOpen Trigger**: Fires when the spreadsheet is opened, adds a custom menu
3. **Manual Sync**: Allows users to manually trigger a data sync from the custom menu
4. **Webhook**: Sends a POST request to your Netlify function with update information

## CSV Publishing

To make your data accessible via CSV:

1. Go to File > Share > Publish to web
2. Select the sheet you want to publish
3. Choose "Comma-separated values (.csv)" as the format
4. Click "Publish"
5. Copy the published URL
6. Use this URL in your Svelte app's `App.svelte` file

## Security Considerations

For production use, consider:
- Adding authentication tokens to verify webhook requests
- Implementing rate limiting
- Validating the source of webhook requests
- Using environment variables for sensitive data

## Testing

1. Make an edit to your Google Sheet
2. Check the Apps Script logs (View > Logs) to see if the webhook was sent
3. Check your Netlify function logs to verify the webhook was received
4. Your website should update automatically or on the next data fetch
