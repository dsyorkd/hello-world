/**
 * Global middleware for all Pages Functions routes.
 * Handles CORS preflight, session token validation, and error wrapping.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
  'Access-Control-Max-Age': '86400',
};

const PUBLIC_PATHS = [
  '/api/auth/login',
];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export async function onRequest(context) {
  // Handle CORS preflight for any route
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(context.request.url);

  // Only validate sessions for API routes that are not public
  if (url.pathname.startsWith('/api/') && !isPublicPath(url.pathname)) {
    const sessionToken = context.request.headers.get('X-Session-Token');

    if (!sessionToken) {
      return jsonResponse({ error: 'Authentication required. Provide X-Session-Token header.' }, 401);
    }

    try {
      const { DB } = context.env;
      const session = await DB.prepare(
        "SELECT s.user_id FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"
      ).bind(sessionToken).first();

      if (!session) {
        return jsonResponse({ error: 'Invalid or expired session token.' }, 401);
      }

      // Attach authenticated user ID to context data
      context.data = context.data || {};
      context.data.userId = session.user_id;
      context.data.sessionToken = sessionToken;
    } catch (err) {
      return jsonResponse({ error: 'Session validation failed.', details: err.message }, 500);
    }
  }

  // Execute downstream handler with error wrapping
  try {
    const response = await context.next();

    // Add CORS headers to every response
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    console.error('Unhandled error in request handler:', err);
    return jsonResponse({ error: 'Internal server error.', details: err.message }, 500);
  }
}
