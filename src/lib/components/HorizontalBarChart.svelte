<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let { 
    data = [], 
    color = '#4A90E2', // main color for max bar
    barHeight = 50,
    minHeight = 200,
    initialVisibleRows = 10,
    collapsible = false
  } = $props();

  // Find the max value for coloring (runes mode)
  let maxValue = $derived(() => data.length ? Math.max(...data.map(d => d.value)) : null);

  let chartContainer;
  let mounted = false;
  let isExpanded = $state(false);
  
  // Determine which data to show based on expand state
  let displayData = $derived(
    !collapsible || isExpanded || data.length <= initialVisibleRows 
      ? data 
      : data.slice(0, initialVisibleRows)
  );
  
  let hasMoreRows = $derived(collapsible && data.length > initialVisibleRows);

  // Constants
  const LABEL_PADDING = 10; // Padding for axis labels in pixels
  const LABEL_X_OFFSET = 5; // Horizontal offset for value labels from bar end
  const AXIS_TEXT_SIZE = '12px'; // Font size for axis labels
  
  // Animation durations (ms)
  const ANIMATION_DURATION_ENTER = 800;
  const ANIMATION_DURATION_UPDATE = 600;
  const ANIMATION_DURATION_EXIT = 400;
  const ANIMATION_DELAY_LABEL_ENTER = 200; // Delay before labels fade in
  
  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  /**
   * Wraps text within a specified width by splitting into multiple tspan elements
   * @param {d3.Selection} text - D3 selection of text elements to wrap
   * @param {number} width - Maximum width in pixels for the text
   */
  function wrapText(text, width) {
    text.each(function() {
      const textElement = d3.select(this);
      // Split on whitespace and forward slashes, but keep the slash with the preceding word
      const textContent = textElement.text();
      const words = textContent.split(/(\s+)/).flatMap(part => {
        // Further split each part on forward slashes, keeping slash with preceding word
        if (/\//.test(part)) {
          return part.split(/(?<=\/)/).filter(segment => segment.trim() !== '');
        }
        return part.trim() === '' ? [] : [part.trim()];
      }).reverse();
      const y = textElement.attr('y');
      const lineHeight = 1.0; // ems
      
      // First pass: determine how many lines we need
      // Use a copy of words array to preserve original for second pass
      const wordsCopy = [...words];
      let line = [];
      let lineCount = 1;
      let tempTspan = textElement.append('tspan')
        .style('visibility', 'hidden');
      
      try {
        // Process words in the same order as the second pass
        let word = wordsCopy.pop();
        while (word !== undefined) {
          line.push(word);
          tempTspan.text(line.join(' '));
          if (tempTspan.node().getComputedTextLength() > width) {
            line.pop();
            lineCount++;
            line = [word];
          }
          word = wordsCopy.pop();
        }
      } finally {
        tempTspan.remove();
      }
      
      // Calculate dy offset to position the text based on number of lines
      // Shifts the first line up to accommodate multiple lines below it
      const dyOffset = -(lineCount - 1) * lineHeight / 2;
      
      // Second pass: actually create the wrapped text with proper centering
      line = [];
      let lineNumber = 0;
      let tspan = textElement.text(null)
        .append('tspan')
        .attr('x', -LABEL_PADDING)
        .attr('y', y)
        .attr('dy', dyOffset + 'em');
      
      let word = words.pop();
      while (word !== undefined) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = textElement.append('tspan')
            .attr('x', -LABEL_PADDING)
            .attr('y', y)
            .attr('dy', lineHeight + 'em')
            .text(word);
          lineNumber++;
        }
        word = words.pop();
      }
    });
  }

  function renderChart() {
    if (!chartContainer || displayData.length === 0) return;

    // Sort data in descending order by value (highest values on top)
    const sortedData = [...displayData].sort((a, b) => b.value - a.value);

    const containerWidth = chartContainer.clientWidth;
    
    // Calculate responsive left margin with maximum width constraints
    // Mobile: max 100px, Tablet: max 120px, Desktop: max 150px
    let maxLeftMargin;
    if (containerWidth < 768) {
      maxLeftMargin = Math.min(100, containerWidth * 0.25); // 25% of width, max 100px
    } else if (containerWidth < 1024) {
      maxLeftMargin = Math.min(120, containerWidth * 0.2); // 20% of width, max 120px
    } else {
      maxLeftMargin = Math.min(150, containerWidth * 0.15); // 15% of width, max 150px
    }
    
    const margin = { top: 20, right: 30, bottom: 40, left: maxLeftMargin };
    const width = containerWidth - margin.left - margin.right;
    
    // Calculate dynamic height based on number of bars
    const calculatedHeight = Math.max(minHeight, (sortedData.length * barHeight) + margin.top + margin.bottom);
    const chartHeight = calculatedHeight - margin.top - margin.bottom;

    // Get or create SVG elements
    let svgRoot = d3.select(chartContainer).select('svg');
    const isInitialRender = svgRoot.empty();
    
    let chartGroup; // D3 selection of the 'g' element for chart content

    if (isInitialRender) {
      // Create SVG structure for initial render
      svgRoot = d3.select(chartContainer)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', calculatedHeight);
      
      chartGroup = svgRoot.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    } else {
      // Update existing SVG dimensions
      svgRoot
        .attr('width', containerWidth)
        .attr('height', calculatedHeight);
      
      chartGroup = svgRoot.select('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    }

    // Determine x scale domain
    // Default to [0,5] if max value is less than 5
    const maxValue = d3.max(sortedData, d => d.value);
    const xDomain = maxValue < 5 ? [0, 5] : [0, maxValue];

    // Scales
    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(sortedData.map(d => d.label))
      .range([0, chartHeight])
      .padding(0.2);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d3.format('.0f'));

    const yAxis = d3.axisLeft(yScale);

    if (isInitialRender) {
      // Add X axis
      chartGroup.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-size', AXIS_TEXT_SIZE);

      // Add Y axis
      chartGroup.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('font-size', AXIS_TEXT_SIZE)
        .call(wrapText, margin.left - LABEL_PADDING);
    } else {
      // Update X axis
      chartGroup.select('.x-axis')
        .attr('transform', `translate(0,${chartHeight})`)
        .transition()
        .duration(ANIMATION_DURATION_UPDATE)
        .call(xAxis)
        .on('end', function() {
          // Style text after transition completes
          d3.select(this).selectAll('text')
            .style('font-size', AXIS_TEXT_SIZE);
        });

      // Update Y axis - no transition to prevent label shifting
      chartGroup.select('.y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('font-size', AXIS_TEXT_SIZE)
        .call(wrapText, margin.left - LABEL_PADDING);
    }

    // Data join for bars with enter/update/exit pattern
    const bars = chartGroup.selectAll('.bar')
      .data(sortedData, d => d.label);

    // Enter new bars
    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.label))
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.value === maxValue ? color : '#B2B2B2')
      .attr('rx', 0)
      .transition()
      .duration(ANIMATION_DURATION_ENTER)
      .attr('width', d => xScale(d.value));

    // Update existing bars
    bars.transition()
      .duration(ANIMATION_DURATION_UPDATE)
      .attr('y', d => yScale(d.label))
      .attr('height', yScale.bandwidth())
      .attr('width', d => xScale(d.value))
      .attr('fill', d => d.value === maxValue ? color : '#B2B2B2')
      .attr('rx', 0);

    // Exit old bars
    bars.exit()
      .transition()
      .duration(ANIMATION_DURATION_EXIT)
      .attr('width', 0)
      .remove();

    // Data join for labels
    const labels = chartGroup.selectAll('.label')
      .data(sortedData, d => d.label);

    // Enter new labels
    const enteringLabels = labels.enter()
      .append('text')
      .attr('class', 'label')
      .attr('opacity', 0)  // Set initial opacity immediately
      .attr('x', d => xScale(d.value) + LABEL_X_OFFSET)
      .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
      .attr('dy', '.35em')
      .style('font-size', AXIS_TEXT_SIZE)
      .style('fill', '#333')
      .text(d => d.value);
    
    // Transition opacity from 0 to 1
    enteringLabels
      .transition()
      .duration(ANIMATION_DURATION_ENTER)
      .delay(ANIMATION_DELAY_LABEL_ENTER)
      .attr('opacity', 1);

    // Update existing labels
    labels
      .attr('opacity', 1)  // Ensure existing labels are visible
      .transition()
      .duration(ANIMATION_DURATION_UPDATE)
      .attr('x', d => xScale(d.value) + LABEL_X_OFFSET)
      .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
      .text(d => d.value);

    // Exit old labels
    labels.exit()
      .transition()
      .duration(ANIMATION_DURATION_EXIT)
      .attr('opacity', 0)
      .remove();
  }

  onMount(() => {
    mounted = true;
    renderChart();

    // Re-render on window resize
    const handleResize = () => {
      if (mounted) {
        renderChart();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mounted = false;
    };
  });

  $effect(() => {
    if (mounted && displayData.length > 0) {
      renderChart();
    }
  });
</script>

<div class="chart-wrapper">
  <div class="chart-container" bind:this={chartContainer}></div>
  {#if hasMoreRows}
    <button class="expand-btn" onclick={toggleExpand}>
      {isExpanded ? 'Show Less' : `Show More (${data.length - initialVisibleRows} more)`}
    </button>
  {/if}
</div>

<style>
  .chart-wrapper {
    width: 100%;
    position: relative;
  }
  
  .chart-container {
    width: 100%;
    min-height: 200px;
    position: relative;
    background: #fff;
    border-radius: 0;
    box-shadow: none;
    font-family: 'Work Sans', sans-serif;
  }

  :global(.bar) {
    cursor: pointer;
    transition: opacity 0.2s;
    rx: 0;
  }

  :global(.bar:hover) {
    opacity: 0.8;
  }
  
  .expand-btn {
    display: block;
    width: 100%;
    margin-top: 1rem;
    padding: 0.75rem;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    color: #002D72;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .expand-btn:hover {
    background: #e8e8e8;
    border-color: #d0d0d0;
  }
</style>
