# Apps Script for Word Cloud Data Processing

## Instructions
1. Open your Google Form's linked spreadsheet
2. Go to Extensions → Apps Script
3. Replace or add this code to your existing script
4. Update the `WEBHOOK_URL` if needed
5. Run `createTrigger()` once to set up automatic processing

## Apps Script Code

```javascript
// Configuration
const WEBHOOK_URL = 'YOUR_NETLIFY_WEBHOOK_URL';

// Sheet names
const FORM_RESPONSES_SHEET = 'Form Responses 1';
const TOOLBOX_SHEET = 'ToolBox';
const CHARTS_SHEET = 'Charts';
const FAVORITE_TOOL_SHEET = 'FavoriteTool';
const FAVORITE_VIZ_SHEET = 'FavoriteViz';

// Word cloud settings
const MIN_WORD_FREQUENCY = 2;
const MAX_WORDS_PER_CLOUD = 20;

// Common English stopwords to filter out
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 
  'by', 'can', 'did', 'do', 'does', 'doing', 'don', 'down', 'during', 'each', 'few', 'for', 
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 
  'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 
  'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 's', 'same', 'she', 
  'should', 'so', 'some', 'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them', 
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 
  'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 
  'while', 'who', 'whom', 'why', 'will', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves',
  // Additional contextual stopwords
  'yet', 'but', 'im', 'ive', 'id', 'dont', 'doesnt', 'one', 'two', 'also', 'make', 'get',
  'much', 'many', 'lot', 'lots', 'see', 'really', 'think', 'know', 'use', 'used', 'using'
]);

/**
 * Processes form responses and updates all aggregate sheets
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
  
  Logger.log('Processing ' + responses.length + ' responses');
  Logger.log('Headers: ' + headers.join(', '));
  
  // Find column indexes - adjust based on your actual form
  const toolboxColumnIndex = headers.findIndex(h => h.toLowerCase().includes('tool'));
  const chartsColumnIndex = headers.findIndex(h => h.toLowerCase().includes('chart'));
  
  // Column E (index 4) - "If you've used more than one data visualization tool, what's your favorite?"
  const favoriteToolColumnIndex = 4; // Column E is index 4
  
  // Column G (index 6) - "What's your favorite data visualization type?"
  const favoriteVizColumnIndex = 6; // Column G is index 6
  
  Logger.log('Tool multiselect column index: ' + toolboxColumnIndex);
  Logger.log('Charts multiselect column index: ' + chartsColumnIndex);
  Logger.log('Favorite tool text column index (E): ' + favoriteToolColumnIndex);
  Logger.log('Favorite viz text column index (G): ' + favoriteVizColumnIndex);
  
  // Count occurrences for multiselect questions
  const toolboxCounts = {};
  const chartsCounts = {};
  
  // Collect text responses for word clouds
  const favoriteToolTexts = [];
  const favoriteVizTexts = [];
  
  responses.forEach(row => {
    // Process toolbox multiselect responses
    if (row[toolboxColumnIndex]) {
      const toolboxItems = row[toolboxColumnIndex].toString().split(',').map(s => s.trim());
      toolboxItems.forEach(item => {
        if (item) {
          toolboxCounts[item] = (toolboxCounts[item] || 0) + 1;
        }
      });
    }
    
    // Process charts multiselect responses
    if (row[chartsColumnIndex]) {
      const chartItems = row[chartsColumnIndex].toString().split(',').map(s => s.trim());
      chartItems.forEach(item => {
        if (item) {
          chartsCounts[item] = (chartsCounts[item] || 0) + 1;
        }
      });
    }
    
    // Collect favorite tool text responses (Column E)
    if (row[favoriteToolColumnIndex] && row[favoriteToolColumnIndex].toString().trim()) {
      favoriteToolTexts.push(row[favoriteToolColumnIndex].toString().trim());
    }
    
    // Collect favorite viz text responses (Column G)
    if (row[favoriteVizColumnIndex] && row[favoriteVizColumnIndex].toString().trim()) {
      favoriteVizTexts.push(row[favoriteVizColumnIndex].toString().trim());
    }
  });
  
  // Update multiselect aggregate sheets
  updateAggregateSheet(ss, TOOLBOX_SHEET, toolboxCounts);
  updateAggregateSheet(ss, CHARTS_SHEET, chartsCounts);
  
  // Process and update word cloud sheets
  const favoriteToolWordCounts = processTextForWordCloud(favoriteToolTexts);
  const favoriteVizWordCounts = processTextForWordCloud(favoriteVizTexts);
  
  updateAggregateSheet(ss, FAVORITE_TOOL_SHEET, favoriteToolWordCounts);
  updateAggregateSheet(ss, FAVORITE_VIZ_SHEET, favoriteVizWordCounts);
  
  Logger.log('Form responses processed successfully');
  Logger.log('Favorite tool words: ' + JSON.stringify(favoriteToolWordCounts));
  Logger.log('Favorite viz words: ' + JSON.stringify(favoriteVizWordCounts));
}

/**
 * Processes text responses into word frequency counts for word clouds
 * @param {Array<string>} texts - Array of text responses
 * @return {Object} Word frequency counts
 */
function processTextForWordCloud(texts) {
  const wordCounts = {};
  
  texts.forEach(text => {
    // Tokenize: split on whitespace and punctuation, convert to lowercase
    const words = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ') // Replace punctuation with space
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .split(/\s+/)
      .filter(word => word.length > 2) // Remove very short words
      .filter(word => !STOPWORDS.has(word)); // Remove stopwords
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  
  // Filter by minimum frequency and limit to max words
  const filteredCounts = {};
  const sortedWords = Object.entries(wordCounts)
    .filter(([word, count]) => count >= MIN_WORD_FREQUENCY)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_WORDS_PER_CLOUD);
  
  sortedWords.forEach(([word, count]) => {
    filteredCounts[word] = count;
  });
  
  return filteredCounts;
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
    responseCount: e.range.getRow() - 1
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

## Publishing the Word Cloud Data as CSV

After running the script:

1. Two new sheets will be created: `FavoriteTool` and `FavoriteViz`
2. Each sheet contains Label/Value pairs with word frequencies
3. Publish each sheet as CSV:
   - File → Share → Publish to web
   - Select the sheet (FavoriteTool or FavoriteViz)
   - Choose "Comma-separated values (.csv)"
   - Click "Publish"
   - Copy the URL

## Update App.svelte

Add these URLs to your `src/App.svelte`:

```javascript
const FAVORITE_TOOL_CSV = 'your-published-csv-url-for-FavoriteTool';
const FAVORITE_VIZ_CSV = 'your-published-csv-url-for-FavoriteViz';
```

## Testing

1. Run `createTrigger()` from Apps Script editor
2. Submit a test form response
3. Check Executions log (View → Executions) for any errors
4. Verify the FavoriteTool and FavoriteViz sheets have data
5. Test the published CSV URLs in your browser
