<script>
  let { 
    url = '', 
    size = 200 
  } = $props();

  // Generate QR code URL using a public API
  const qrCodeUrl = $derived(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`);
</script>

<div class="qr-container">
  <a href={url} target="_blank" rel="noopener noreferrer">
    <img 
      src={qrCodeUrl} 
      alt="QR Code" 
      width={size} 
      height={size}
      class="qr-code"
    />
  </a>
  <p class="qr-link">
    <a href={url} target="_blank" rel="noopener noreferrer">
      Or click here to open the form
    </a>
  </p>
</div>

<style>
  .qr-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .qr-code {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 0;
    background: white;
    transition: transform 0.2s;
  }



  .qr-link {
    margin: 0;
  }

  .qr-link a {
    color: #4A90E2;
    text-decoration: none;
    font-weight: 500;
  }


</style>
