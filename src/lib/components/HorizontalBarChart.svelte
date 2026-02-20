<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let { 
    data = [], 
    color = '#4A90E2',
    barHeight = 50,
    minHeight = 200
  } = $props();

  let chartContainer;
  let mounted = $state(false);

  // Constants
  const LABEL_PADDING = 10; // Padding for axis labels in pixels

  /**
   * Wraps text within a specified width by splitting into multiple tspan elements
   * @param {d3.Selection} text - D3 selection of text elements to wrap
   * @param {number} width - Maximum width in pixels for the text
   */
  function wrapText(text, width) {
    text.each(function() {
      const textElement = d3.select(this);
      const words = textElement.text().split(/\s+/).reverse();
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.0; // ems
      const y = textElement.attr('y');
      const dy = parseFloat(textElement.attr('dy')) || 0;
      let tspan = textElement.text(null)
        .append('tspan')
        .attr('x', -LABEL_PADDING)
        .attr('y', y)
        .attr('dy', dy + 'em');
      
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
            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
            .text(word);
        }
        word = words.pop();
      }
    });
  }

  function renderChart() {
    if (!chartContainer || !data || data.length === 0) return;

    // Clear previous chart
    d3.select(chartContainer).selectAll('*').remove();

    // Sort data in descending order by value (highest values on top)
    const sortedData = [...data].sort((a, b) => b.value - a.value);

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

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', calculatedHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

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

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // Add Y axis
    svg.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .call(wrapText, margin.left - LABEL_PADDING); // Wrap text to fit within left margin

    // Add bars
    svg.selectAll('.bar')
      .data(sortedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.label))
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', color)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('width', d => xScale(d.value));

    // Add value labels
    svg.selectAll('.label')
      .data(sortedData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
      .attr('dy', '.35em')
      .style('font-size', '12px')
      .style('fill', '#333')
      .style('opacity', 0)
      .text(d => d.value)
      .transition()
      .duration(800)
      .delay(400)
      .style('opacity', 1);
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

  // Re-render when data changes
  $effect(() => {
    if (mounted && data && data.length > 0) {
      renderChart();
    }
  });
</script>

<div class="chart-container" bind:this={chartContainer}></div>

<style>
  .chart-container {
    width: 100%;
    min-height: 200px;
    position: relative;
  }

  :global(.bar) {
    cursor: pointer;
    transition: opacity 0.2s;
  }

  :global(.bar:hover) {
    opacity: 0.8;
  }
</style>
