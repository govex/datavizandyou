<script>
  import HorizontalBarChart from './lib/components/HorizontalBarChart.svelte';
  import QRCode from './lib/components/QRCode.svelte';
  import { onMount } from 'svelte';

  let toolBoxData = $state([]);
  let mostUsedChartsData = $state([]);
  let loading = $state(true);
  let error = $state(null);

  // CSV data sources - REPLACE THESE WITH YOUR ACTUAL URLS
  // To get CSV URLs: File > Share > Publish to web > Choose sheet > CSV format
  const TOOLBOX_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgjloHyyyB4tiRtcQUUSVsfpVunRlFqvm9-aFU042UAQcbF06SPGS1ZcCeEl4FHr4lMPQKqOQDNz3a/pub?gid=458688954&single=true&output=csv';
  const CHARTS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgjloHyyyB4tiRtcQUUSVsfpVunRlFqvm9-aFU042UAQcbF06SPGS1ZcCeEl4FHr4lMPQKqOQDNz3a/pub?gid=772083968&single=true&output=csv';
  // Replace with your Google Form URL
  const GOOGLE_FORM_URL = 'https://forms.gle/7PAb7GmDP91HpfK3A';

  async function fetchCSVData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return parseCSV(text);
    } catch (err) {
      console.error('Error fetching CSV:', err);
      throw err;
    }
  }

  // Category mapping for combining related items
  const categoryMappings = {
    'AI Generated': ['claude', 'github copilot', 'chatGPT or other AI interface'],
    'Physical Medium': ['paint', 'yarn', 'thread', 'fabric', 'plastic', 'stone', 'clay, or some other physical medium']
  };

  function getCombinedCategory(label) {
    const lowerLabel = label.toLowerCase().trim();
    
    for (const [category, items] of Object.entries(categoryMappings)) {
      for (const item of items) {
        if (lowerLabel === item.toLowerCase().trim()) {
          return category;
        }
      }
    }
    
    return label; // Return original label if no mapping found
  }

  function combineCategories(data) {
    // Group items by combined category and take the first value for each
    const combined = new Map();
    
    for (const item of data) {
      const category = getCombinedCategory(item.label);
      
      // Only add if we haven't seen this category yet (take first value)
      if (!combined.has(category)) {
        combined.set(category, item.value);
      }
    }
    
    return Array.from(combined.entries()).map(([label, value]) => ({
      label,
      value
    }));
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Simple CSV parsing with support for quoted fields
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length >= 2) {
        const label = values[0].replace(/^"|"$/g, '');
        const valueStr = values[1].replace(/^"|"$/g, '');
        
        // Skip entries with #VALUE! errors from spreadsheets
        if (label === '#VALUE!' || valueStr === '#VALUE!') {
          continue;
        }
        
        const numericValue = parseFloat(valueStr);
        
        // Skip entries with invalid numeric values (NaN)
        if (isNaN(numericValue)) {
          continue;
        }
        
        data.push({
          label,
          value: numericValue
        });
      }
    }
    
    return data;
  }

  async function loadData() {
    loading = true;
    error = null;
    
    try {
      const [toolbox, charts] = await Promise.all([
        fetchCSVData(TOOLBOX_CSV),
        fetchCSVData(CHARTS_CSV)
      ]);
      
      toolBoxData = combineCategories(toolbox);
      mostUsedChartsData = charts;
    } catch (err) {
      error = err.message;
      // Use sample data for demonstration if fetch fails
      toolBoxData = [
        { label: 'Excel', value: 45 },
        { label: 'Tableau', value: 30 },
        { label: 'Power BI', value: 15 },
        { label: 'R', value: 10 }
      ];
      mostUsedChartsData = [
        { label: 'Bar Chart', value: 40 },
        { label: 'Line Chart', value: 25 },
        { label: 'Pie Chart', value: 20 },
        { label: 'Scatter Plot', value: 15 }
      ];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
    
    // Listen for webhook updates
    if (typeof window !== 'undefined') {
      window.addEventListener('data-update', (event) => {
        console.log('Data update received:', event.detail);
        loadData();
      });
    }
  });
</script>

<main>
  <header>
    <h1>GovEx Data Visualization</h1>
    <p>Real-time insights from our data collection</p>
  </header>

  {#if loading}
    <div class="loading">
      <p>Loading data...</p>
    </div>
  {/if}

  {#if error}
    <div class="error">
      <p>Note: Using sample data. {error}</p>
    </div>
  {/if}

  {#if !loading}
    <section class="chart-section">
      <h2>GovEx Tool Box</h2>
      <HorizontalBarChart 
        data={toolBoxData} 
        color="#4A90E2"
      />
    </section>

    <section class="chart-section">
      <h2>GovEx Most Used Charts</h2>
      <HorizontalBarChart 
        data={mostUsedChartsData} 
        color="#50C878"
      />
    </section>

    <section class="qr-section">
      <h2>Share Your Feedback</h2>
      <p>Scan the QR code to fill out our survey</p>
      <QRCode url={GOOGLE_FORM_URL} size={200} />
    </section>
  {/if}

  <footer>
    <p>Powered by GovEx | Data updates automatically</p>
  </footer>
</main>

<style>
  /* Mobile-first design */
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #f5f5f5;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    text-align: center;
    padding: 2rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    font-weight: 700;
  }

  header p {
    margin: 0;
    font-size: 1rem;
    opacity: 0.9;
  }

  .loading, .error {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .error {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffc107;
  }

  .chart-section, .qr-section {
    background: white;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .chart-section h2, .qr-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    color: #333;
  }

  .qr-section {
    text-align: center;
  }

  .qr-section p {
    color: #666;
    margin-bottom: 1rem;
  }

  footer {
    text-align: center;
    padding: 2rem 1rem;
    color: #666;
    font-size: 0.875rem;
  }

  /* Tablet and up */
  @media (min-width: 768px) {
    main {
      padding: 2rem;
    }

    header h1 {
      font-size: 2.5rem;
    }

    header p {
      font-size: 1.125rem;
    }

    .chart-section, .qr-section {
      padding: 2rem;
    }

    .chart-section h2, .qr-section h2 {
      font-size: 1.75rem;
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    main {
      padding: 3rem;
    }

    header {
      padding: 3rem 2rem;
    }
  }
</style>
