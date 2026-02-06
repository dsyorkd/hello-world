/**
 * Shared response helpers for Cloudflare Pages Functions.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
};

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

export function notFoundResponse(resource = 'Resource') {
  return errorResponse(`${resource} not found`, 404);
}

export function unauthorizedResponse(message = 'Authentication required') {
  return errorResponse(message, 401);
}

export function methodNotAllowed(allowed = []) {
  return errorResponse(`Method not allowed. Allowed: ${allowed.join(', ')}`, 405);
}

export function corsPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
