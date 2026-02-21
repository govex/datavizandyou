<script>
  // Google Fonts: Work Sans only 
  if (typeof window !== 'undefined') {
    const font1 = document.createElement('link');
    font1.rel = 'stylesheet';
    font1.href = 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700;900&display=swap';
    document.head.appendChild(font1);
  }

  import HorizontalBarChart from './lib/components/HorizontalBarChart.svelte';
  import WordCloud from './lib/components/WordCloud.svelte';
  import QRCode from './lib/components/QRCode.svelte';
  let toolBoxData = $state([]);
  let mostUsedChartsData = $state([]);
  let favoriteToolData = $state([]);
  let favoriteVizData = $state([]);
  let loading = $state(true);
  let isRefreshing = $state(false);
  let error = $state(null);
  let lastUpdate = $state(null);

  // CSV data sources - REPLACE THESE WITH YOUR ACTUAL URLS
  // To get CSV URLs: File > Share > Publish to web > Choose sheet > CSV format
  const TOOLBOX_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgjloHyyyB4tiRtcQUUSVsfpVunRlFqvm9-aFU042UAQcbF06SPGS1ZcCeEl4FHr4lMPQKqOQDNz3a/pub?gid=609809117&single=true&output=csv';
  const CHARTS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgjloHyyyB4tiRtcQUUSVsfpVunRlFqvm9-aFU042UAQcbF06SPGS1ZcCeEl4FHr4lMPQKqOQDNz3a/pub?gid=538410928&single=true&output=csv';
  // Word cloud CSV URLs - REPLACE WITH YOUR PUBLISHED SHEET URLS
  const FAVORITE_TOOL_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgjloHyyyB4tiRtcQUUSVsfpVunRlFqvm9-aFU042UAQcbF06SPGS1ZcCeEl4FHr4lMPQKqOQDNz3a/pub?gid=1443234122&single=true&output=csv';
  const FAVORITE_VIZ_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgjloHyyyB4tiRtcQUUSVsfpVunRlFqvm9-aFU042UAQcbF06SPGS1ZcCeEl4FHr4lMPQKqOQDNz3a/pub?gid=739795947&single=true&output=csv';
  // Replace with your Google Form URL
  const GOOGLE_FORM_URL = 'https://forms.gle/7PAb7GmDP91HpfK3A';
  
  // Auto-refresh interval in milliseconds (10 seconds)
  const REFRESH_INTERVAL = 10000;

  async function fetchCSVData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const parsedData = parseCSV(text);
      return parsedData;
    } catch (err) {
      console.error('Error fetching CSV:', err);
      throw err;
    }
  }

  // Category mapping for combining related items
  const categoryMappings = {
    'AI Generated': ['claude', 'github copilot', 'chatGPT or other AI interface'],
    'Physical Medium': ['paint', 'yarn', 'thread', 'fabric', 'plastic', 'stone', 'clay', 'clay, or some other physical medium', 'or some other physical medium']
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

  /**
   * Compares two data arrays to check if they have changed
   * Returns true if data is different, false if same
   */
  function hasDataChanged(oldData, newData) {
    if (!oldData || oldData.length === 0) return true;
    if (oldData.length !== newData.length) return true;
    
    // Compare each item
    for (let i = 0; i < oldData.length; i++) {
      if (oldData[i].label !== newData[i].label || 
          oldData[i].value !== newData[i].value) {
        return true;
      }
    }
    
    return false;
  }


  async function loadData(isBackgroundRefresh = false) {
    // Only set loading state on initial load, not on background refresh
    if (!isBackgroundRefresh) {
      loading = true;
    } else {
      isRefreshing = true;
    }
    error = null;
    try {
      const [toolbox, charts, favTool, favViz] = await Promise.all([
        fetchCSVData(TOOLBOX_CSV),
        fetchCSVData(CHARTS_CSV),
        fetchCSVData(FAVORITE_TOOL_CSV).catch(() => []),
        fetchCSVData(FAVORITE_VIZ_CSV).catch(() => [])
      ]);
      const newToolBoxData = combineCategories(toolbox);
      const newChartsData = charts;
      const newFavoriteToolData = favTool;
      const newFavoriteVizData = favViz;
      
      // Check if data has actually changed
      const toolboxChanged = hasDataChanged(toolBoxData, newToolBoxData);
      const chartsChanged = hasDataChanged(mostUsedChartsData, newChartsData);
      const favToolChanged = hasDataChanged(favoriteToolData, newFavoriteToolData);
      const favVizChanged = hasDataChanged(favoriteVizData, newFavoriteVizData);
      
      if (toolboxChanged || chartsChanged || favToolChanged || favVizChanged) {
        toolBoxData = newToolBoxData;
        mostUsedChartsData = newChartsData;
        favoriteToolData = newFavoriteToolData;
        favoriteVizData = newFavoriteVizData;
        lastUpdate = new Date();
      }
    } catch (err) {
      console.error('Error loading data:', err.message);
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
      favoriteToolData = [
        { label: 'tableau', value: 8 },
        { label: 'python', value: 6 },
        { label: 'excel', value: 5 }
      ];
      favoriteVizData = [
        { label: 'maps', value: 7 },
        { label: 'scatterplot', value: 5 },
        { label: 'bar', value: 4 }
      ];
      lastUpdate = new Date();
    } finally {
      loading = false;
      isRefreshing = false;
    }
  }


  let refreshInterval;

  $effect(() => {
    loadData(false); // Initial load, not a background refresh
    
    // Set up automatic polling for data updates
    refreshInterval = setInterval(() => {
      loadData(true); // Background refresh
    }, REFRESH_INTERVAL);
    
    // Listen for webhook updates (for future WebSocket implementation)
    const handleDataUpdate = (event) => {
      loadData(true); // Background refresh for webhook updates too
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('data-update', handleDataUpdate);
    }
    
    // Cleanup function - automatically called when component is destroyed
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('data-update', handleDataUpdate);
      }
    };
  });
</script>

<main>

  <section class="hero">
    <div class="hero-content">
      <div class="hero-headlines">
        <h1>Data Viz & You</h1>
        <p>From the GovEx Data Visualization Lunch and Learn</p>
      </div>
      <div class="hero-buttons">
        <div class="qr-hero-block">
          <QRCode url={GOOGLE_FORM_URL} size={100} />
        </div>
        <a class="slides-btn" href="/DataVizLunchLearnSlides.pdf" download target="_blank" rel="noopener">
          <span>Download Slides</span>
        </a>
      </div>
    </div>
  </section>

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
    <div class="update-info" class:refreshing={isRefreshing}>
      {#if lastUpdate}
        <span>
          Last updated: {lastUpdate.toLocaleTimeString()} • Auto-refreshing every {REFRESH_INTERVAL / 1000}s
        </span>
      {/if}
    </div>

    <div class="dashboard-grid">
      <section class="chart-section favorite-tools">
        <h2>Favorite Tools</h2>
        <WordCloud 
          data={favoriteToolData} 
          color="#86C8BC"
        />
      </section>

      <section class="chart-section favorite-viz">
        <h2>Favorite Visualizations</h2>
        <WordCloud 
          data={favoriteVizData} 
          color="#E8927C"
        />
      </section>

      <section class="chart-section toolbox">
        <h2>GovEx Tool Box</h2>
        <HorizontalBarChart 
          data={toolBoxData} 
          color="#418FDE"
          initialVisibleRows={6}
          collapsible={true}
        />
      </section>

      <section class="chart-section most-used-charts">
        <h2>GovEx Most Used Charts</h2>
        <HorizontalBarChart 
          data={mostUsedChartsData} 
          color="#F1C400"
          initialVisibleRows={6}
          collapsible={true}
        />
      </section>
    </div>
  {/if}

  <footer>
    <p>Powered by GovEx | Data updates automatically</p>
  </footer>
</main>

<style>
  /* Mobile-first design */

  :global(html) {
    font-size: 16px;
  }
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Work Sans', sans-serif;
    background: #fff;
    color: #000;
    overflow-x: hidden;
  }

  main {
    margin: 0;
    padding: 0;
  }

  .hero {
    background: linear-gradient(30deg, #002D72 0%, #A15A95 100%);
    padding: 20px;
    margin: 0;
    border-radius: 0;
    color: #fff;
    width: calc(100vw - 40px);
    max-width: calc(100vw - 40px);
    position: relative;
    background-image: 
      url('/wave.svg'),
      linear-gradient(30deg, #002D72 0%, #A15A95 100%);
    background-size: cover, auto;
    background-position: center, center;
    background-repeat: no-repeat, no-repeat;
    background-blend-mode: overlay, normal;
  }
  .hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('/wave.svg') center/cover no-repeat;
    opacity: 0.15;
    pointer-events: none;
  }
  .hero-content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
    overflow-x: auto;
    position: relative;
    z-index: 1;
  }
  .hero-headlines {
    flex: 1 1 0%;
    align-self: flex-start;
    text-align: left;
    margin: 0;
  }
  .hero-headlines h1 {
    font-family: 'Work Sans', sans-serif;
    font-size: 2rem;
    font-weight: 900;
    margin: 0 0 0.25rem 0;
    margin-top: 0;
    color: #fff;
  }
  .hero-headlines p {
    font-size: 0.95rem;
    margin: 0;
    color: #fff;
    font-weight: 400;
    opacity: 0.95;
  }
  .hero-buttons {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: stretch;
    justify-content: flex-end;
  }

  .qr-hero-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    background: #fff;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
    border-radius: 12px;
    padding: 1rem;
    min-width: 160px;
  }
  .qr-hero-block :global(img),
  .qr-hero-block :global(svg) {
    height: 100px !important;
    width: auto !important;
    display: block;
    margin: 0 auto;
    transition: none !important;
  }
  .qr-hero-block :global(img):hover,
  .qr-hero-block :global(svg):hover {
    transition: none !important;
  }

  .slides-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 160px;
    height: auto;
    padding: 1.5rem 1rem;
    background: #fff;
    color: #A15A95;
    font-weight: 700;
    border-radius: 12px;
    text-decoration: none;
    font-size: 0.95rem;
    border: none;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
    transition: background 0.2s, color 0.2s;
    text-align: center;
    white-space: normal;
    box-sizing: border-box;
  }
  .slides-btn span {
    display: block;
    width: 100%;
    text-align: center;
  }
  .slides-btn:hover {
    background: #F1C400;
    color: #fff;
  }

  .error {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffc107;
  }
  

  .update-info {
    position: static;
    background: none;
    color: #002D72;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border: none;
    margin: .5rem 0 0;
    box-shadow: none;
    opacity: 0.7;
    text-align: right;
  }


  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 0.5rem;
    padding: 0 1rem;
    max-width: calc(100vw - 2rem);
    margin-left: auto;
    margin-right: auto;
    align-items: start;
  }
  .chart-section {
    background: #fff;
    padding: 0.5rem;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    height: calc(100% - 1rem);
    max-width: calc(50vw - 4rem);
  }
  .chart-section h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #002D72;
    font-family: 'Work Sans', sans-serif;
    font-weight: 700;
  }

  footer {
    text-align: center;
    padding: 2rem 1rem;
    color: #666;
    font-size: 0.875rem;
  }


  @media (max-width: 899px) {
    .hero {
      padding: 15px 20px;
    }
    .hero-content {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 1rem;
    }
    .hero-headlines {
      flex: 1 1 100%;
    }
    .hero-headlines h1 {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }
    .hero-headlines p {
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .hero-buttons {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.75rem;
      width: 100%;
      justify-content: space-between;
    }
    .qr-hero-block {
      padding: 0.5rem;
      min-width: auto;
      flex: 0 0 calc(50% - 1rem);
    }
    .qr-hero-block :global(img),
    .qr-hero-block :global(svg) {
      height: 70px !important;
    }
    .slides-btn {
      min-width: auto;
      padding: 1rem;
      font-size: 0.9rem;
    }
    /* Reorder visualizations to group tool and chart type together */
    .favorite-tools {
      order: 1;
      height: 250px;
      max-width: calc(100vw - 40px - 1rem);
    }
    .toolbox {
      order: 2;
      max-width: calc(100vw - 40px - 1rem);
    }
    .favorite-viz {
      order: 3;
      height: 250px;
      max-width: calc(100vw - 40px - 1rem);
    }
    .most-used-charts {
      order: 4;
      max-width: calc(100vw - 40px - 1rem);
    }
  }

  @media (min-width: 900px) {
    .dashboard-grid {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 40vh 1fr;
      gap: 1rem;
      padding: 0 2rem;
    }
    .hero {
      padding: 20px 50px;
      width: calc(100vw - 100px);
      max-width: calc(100vw - 100px);
    }
    .hero-content {
      gap: 3rem;
    }
  }
</style>
