export async function handler(event, context) {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming webhook data
    const data = JSON.parse(event.body);

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
    
    return response;
  } catch (error) {
    console.error('Webhook error:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}
