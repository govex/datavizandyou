<script>
  let { 
    url = '', 
    size = 200 
  } = $props();
</script>

<div class="qr-container">
  <a href={url} target="_blank" rel="noopener noreferrer" class="qr-link-wrapper">
    <img 
      src="/survey.png" 
      alt="QR Code" 
      width={size} 
      height={size}
      class="qr-code"
    />
  </a>
  <a href={url} target="_blank" rel="noopener noreferrer" class="text-link">
    Open Form
  </a>
</div>

<style>
  .qr-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .qr-link-wrapper {
    display: block;
    line-height: 0;
  }

  .qr-code {
    border: none;
    border-radius: 8px;
    padding: 0;
    background: white;
    transition: opacity 0.2s;
  }

  .qr-code:hover {
    opacity: 0.9;
  }

  .text-link {
    color: #002D72;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: color 0.2s;
    text-align: center;
  }

  .text-link:hover {
    color: #418FDE;
  }
</style>
