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

  function renderChart() {
    if (!chartContainer || !data || data.length === 0) return;

    // Clear previous chart
    d3.select(chartContainer).selectAll('*').remove();

    // Sort data in descending order by value (highest values on top)
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    const containerWidth = chartContainer.clientWidth;
    const margin = { top: 20, right: 30, bottom: 40, left: 120 };
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
      .style('font-size', '12px');

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
