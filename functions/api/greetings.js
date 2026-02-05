export async function onRequestGet(context) {
  const { DB } = context.env;
  
  try {
    const queryResult = await DB.prepare(
      'SELECT id, message, created_at FROM greetings ORDER BY created_at DESC LIMIT 50'
    ).all();
    
    return new Response(JSON.stringify({
      greetings: queryResult.results || []
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Database query failed',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  
  try {
    const requestBody = await context.request.json();
    const greetingMessage = requestBody.message;
    
    if (!greetingMessage || greetingMessage.trim().length === 0) {
      return new Response(JSON.stringify({
        error: 'Message cannot be empty'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const insertResult = await DB.prepare(
      'INSERT INTO greetings (message, created_at) VALUES (?, datetime("now"))'
    ).bind(greetingMessage.trim()).run();
    
    return new Response(JSON.stringify({
      success: true,
      id: insertResult.meta.last_row_id
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to save greeting',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
