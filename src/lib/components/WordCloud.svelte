<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import cloud from 'd3-cloud';

  let { 
    data = [], 
    color = '#418FDE',
    minHeight = 300
  } = $props();

  let chartContainer;
  let mounted = false;

  // Constants
  const MAX_FONT_SIZE = 48;
  const MIN_FONT_SIZE = 14;
  const ANIMATION_DURATION = 800;

  function renderCloud() {
    if (!chartContainer || !data || data.length === 0) return;

    const containerWidth = chartContainer.clientWidth;
    const containerHeight = Math.max(minHeight, containerWidth * 0.6);

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
    renderCloud();

    // Re-render on window resize
    const handleResize = () => {
      if (mounted) {
        renderCloud();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mounted = false;
    };
  });

  $effect(() => {
    if (mounted && data && data.length > 0) {
      renderCloud();
    }
  });
</script>

<div class="cloud-container" bind:this={chartContainer}></div>

<style>
  .cloud-container {
    width: 100%;
    min-height: 300px;
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
</style>
