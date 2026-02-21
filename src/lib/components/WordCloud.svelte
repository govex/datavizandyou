<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import cloud from 'd3-cloud';

  let { 
    data = [], 
    color = '#418FDE'
  } = $props();

  let chartContainer;
  let mounted = false;
  
  // Check if we have enough data for a word cloud
  let hasEnoughData = $derived(data && data.length >= 2);

  // Constants
  const MAX_FONT_SIZE = 48;
  const MIN_FONT_SIZE = 14;
  const ANIMATION_DURATION = 800;

  function renderCloud() {
    if (!chartContainer || !data || data.length === 0) return;

    // Force a layout recalculation to get fresh dimensions
    // This fixes the double-width bug after orientation changes
    void chartContainer.offsetHeight;
    
    const containerWidth = chartContainer.clientWidth;
    const containerHeight = chartContainer.clientHeight || 250;
    
    // Safety check: don't render if dimensions are invalid
    if (containerWidth <= 0 || containerHeight <= 0) {
      return;
    }

    // Clear existing SVG
    d3.select(chartContainer).select('svg').remove();

    // Find min and max values for scaling
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Create font size scale
    const fontScale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([MIN_FONT_SIZE, MAX_FONT_SIZE]);

    // Prepare words for cloud layout
    const words = data.map(d => ({
      text: d.label,
      size: fontScale(d.value),
      value: d.value
    }));

    // Create cloud layout
    const layout = cloud()
      .size([containerWidth, containerHeight])
      .words(words)
      .padding(5)
      .rotate(() => 0) // No rotation for better readability
      .font('Work Sans')
      .fontSize(d => d.size)
      .on('end', draw);

    layout.start();

    function draw(words) {
      const svg = d3.select(chartContainer)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight);

      const g = svg.append('g')
        .attr('transform', `translate(${containerWidth / 2},${containerHeight / 2})`);

      const text = g.selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => `${d.size}px`)
        .style('font-family', 'Work Sans')
        .style('font-weight', '600')
        .style('fill', color)
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .text(d => d.text)
        .style('opacity', 0)
        .transition()
        .duration(ANIMATION_DURATION)
        .style('opacity', 1);
    }
  }

  onMount(() => {
    mounted = true;
    if (hasEnoughData) {
      renderCloud();
    }

    // Debounce utility to prevent excessive re-renders
    let resizeTimeout;
    const debounce = (func, wait) => {
      return (...args) => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => func(...args), wait);
      };
    };

    // Re-render on window resize with debouncing
    // Use longer debounce to avoid URL bar scroll triggers
    const handleResize = debounce(() => {
      if (mounted && hasEnoughData && chartContainer) {
        // Force read of fresh dimensions
        const newWidth = chartContainer.clientWidth;
        const newHeight = chartContainer.clientHeight;
        
        // Only re-render if dimensions actually changed significantly
        // This prevents URL bar hide/show from triggering re-renders
        if (newWidth > 0 && newHeight > 0) {
          renderCloud();
        }
      }
    }, 300); // 300ms debounce to filter out URL bar changes

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      mounted = false;
    };
  });

  // Re-render when data changes (but skip if not mounted yet)
  // Only track data changes, not derived hasEnoughData state
  $effect(() => {
    if (mounted && data.length > 0) {
      renderCloud();
    }
  });
</script>

<div class="cloud-container" bind:this={chartContainer}>
  {#if !hasEnoughData}
    <div class="placeholder-container">
      <p class="placeholder-text">Not enough responses</p>
    </div>
  {/if}
</div>

<style>
  .cloud-container {
    width: 100%;
    height: 100%;
    position: relative;
    background: #fff;
    border-radius: 0;
    box-shadow: none;
    font-family: 'Work Sans', sans-serif;
  }

  :global(.cloud-container text) {
    cursor: default;
    transition: opacity 0.2s;
  }

  :global(.cloud-container text:hover) {
    opacity: 0.7;
  }
  
  .placeholder-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder-text {
    color: #666;
    font-size: 1.1rem;
    font-weight: 500;
    font-style: italic;
    margin: 0;
    opacity: 0.7;
  }
</style>
