# Apps Script Changes - Column Indices and Stopword Filtering

## Summary
Fixed two issues in the Google Apps Script for processing form responses:

1. **Explicit Column Indices**: Changed from header inference to explicit column numbers
2. **Apostrophe Handling**: Fixed stopword filtering to properly handle contractions

## Changes Made

### 1. Fixed Column Index Detection (Lines 65-67)

**Before:**
```javascript
const toolboxColumnIndex = headers.findIndex(h => h.toLowerCase().includes('tool'));
const chartsColumnIndex = headers.findIndex(h => h.toLowerCase().includes('chart'));
```

**After:**
```javascript
const toolboxColumnIndex = 2; // Column C
const chartsColumnIndex = 5;  // Column F
```

**Reason:** 
- More reliable - doesn't depend on header text matching
- Explicitly references the correct columns as specified
- Column indices are 0-based, so:
  - Column C (3rd column) = index 2
  - Column F (6th column) = index 5

### 2. Fixed Stopword Filtering for Contractions (Line 148)

**Before:**
```javascript
const words = text
  .toLowerCase()
  .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ') // Replace punctuation with space
  .replace(/\s{2,}/g, ' ')
  .split(/\s+/)
  .filter(word => word.length > 2)
  .filter(word => !STOPWORDS.has(word));
```

**After:**
```javascript
const words = text
  .toLowerCase()
  .replace(/'/g, '') // Remove apostrophes first (so don't becomes dont, it's becomes its, etc.)
  .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ') // Replace punctuation with space
  .replace(/\s{2,}/g, ' ')
  .split(/\s+/)
  .filter(word => word.length > 2)
  .filter(word => !STOPWORDS.has(word));
```

**Reason:**
- The STOPWORDS set contains entries like "dont", "ive", "id", "doesnt"
- Without removing apostrophes, "don't" stayed as "don't" and didn't match "dont"
- Now apostrophes are stripped first, so:
  - "don't" → "dont" ✓ (matches stopword)
  - "it's" → "its" ✓ (matches stopword)
  - "I've" → "ive" ✓ (matches stopword)
  - "doesn't" → "doesnt" ✓ (matches stopword)

## Testing

### Column Indices Test
1. Check the execution log after running `processFormResponses()`
2. Should see:
   ```
   Tool multiselect column index: 2
   Charts multiselect column index: 5
   ```

### Stopword Test
1. Submit form responses with contractions like "don't", "it's", "I've"
2. Run `processFormResponses()` manually
3. Check FavoriteTool and FavoriteViz sheets
4. Verify these contracted stopwords do NOT appear in the word clouds

## Example Processing

### Input Text:
```
"I don't have a favorite yet but I look forward to seeing what's available"
```

### Processing Steps:
1. Lowercase: `"i don't have a favorite yet but i look forward to seeing what's available"`
2. Remove apostrophes: `"i dont have a favorite yet but i look forward to seeing whats available"`
3. Replace punctuation: (no change in this example)
4. Split: `["i", "dont", "have", "favorite", "yet", "but", "look", "forward", "seeing", "whats", "available"]`
5. Filter length > 2: `["dont", "have", "favorite", "yet", "but", "look", "forward", "seeing", "whats", "available"]`
6. Filter stopwords: `["have", "favorite", "forward", "seeing", "whats", "available"]`
   - Removed: "dont", "yet", "but", "look"

### Final Result:
Words counted for word cloud: `favorite`, `forward`, `seeing`, `whats`, `available`, `have`

## Deployment

1. Open your Google Form's linked spreadsheet
2. Go to Extensions → Apps Script
3. Update the `processFormResponses()` function with the new code from `WORD_CLOUD_APPS_SCRIPT.md`
4. Save the script
5. Run `processFormResponses()` manually to test
6. Verify the execution log shows correct column indices (2 and 5)
7. Check that contractions are properly filtered from word clouds
