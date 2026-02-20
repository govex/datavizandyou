export async function handler(event, context) {
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Webhook request received`);
  console.log('Request method:', event.httpMethod);
  console.log('Request headers:', JSON.stringify(event.headers, null, 2));
  
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    console.log(`[${timestamp}] Rejected: Method not allowed (${event.httpMethod})`);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming webhook data
    const data = JSON.parse(event.body);
    
    console.log(`[${timestamp}] Webhook data received:`, JSON.stringify(data, null, 2));
    console.log('Data type:', data.type);
    console.log('Sheet name:', data.sheet);
    console.log('User:', data.user || 'N/A');

    // In a production environment, you would:
    // 1. Validate the webhook signature
    // 2. Store the update in a database
    // 3. Trigger a rebuild or notify connected clients

    // For now, we'll just acknowledge the webhook
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Webhook received successfully',
        timestamp: new Date().toISOString(),
        receivedData: {
          type: data.type,
          sheet: data.sheet,
          timestamp: data.timestamp
        }
      })
    };
    
    console.log(`[${timestamp}] Webhook processed successfully`);
    console.log('Response:', response.body);
    
    return response;
  } catch (error) {
    console.error(`[${timestamp}] Webhook error:`, error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', event.body);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: timestamp
      })
    };
  }
}
