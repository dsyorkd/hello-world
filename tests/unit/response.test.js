/**
 * Unit tests for response helpers.
 */
import { describe, it, expect } from 'vitest';
import {
  jsonResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  methodNotAllowed,
  corsPreflightResponse,
} from '../../functions/lib/response.js';

describe('jsonResponse', () => {
  it('should create a Response with JSON body', async () => {
    const res = jsonResponse({ hello: 'world' });
    const body = await res.json();
    expect(body).toEqual({ hello: 'world' });
  });

  it('should set Content-Type to application/json', () => {
    const res = jsonResponse({ test: true });
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('should set CORS headers', () => {
    const res = jsonResponse({});
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('X-Session-Token');
  });

  it('should default to 200 status', () => {
    const res = jsonResponse({});
    expect(res.status).toBe(200);
  });

  it('should accept custom status codes', () => {
    const res = jsonResponse({}, 201);
    expect(res.status).toBe(201);
  });
});

describe('errorResponse', () => {
  it('should create error response with message', async () => {
    const res = errorResponse('Something went wrong', 400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Something went wrong' });
    expect(res.status).toBe(400);
  });

  it('should default to 400 status', () => {
    const res = errorResponse('Bad request');
    expect(res.status).toBe(400);
  });
});

describe('notFoundResponse', () => {
  it('should create 404 response with resource name', async () => {
    const res = notFoundResponse('User');
    const body = await res.json();
    expect(body.error).toContain('User');
    expect(body.error).toContain('not found');
    expect(res.status).toBe(404);
  });

  it('should default to "Resource"', async () => {
    const res = notFoundResponse();
    const body = await res.json();
    expect(body.error).toContain('Resource');
  });
});

describe('unauthorizedResponse', () => {
  it('should create 401 response', async () => {
    const res = unauthorizedResponse();
    const body = await res.json();
    expect(body.error).toContain('Authentication required');
    expect(res.status).toBe(401);
  });

  it('should accept custom message', async () => {
    const res = unauthorizedResponse('Token expired');
    const body = await res.json();
    expect(body.error).toBe('Token expired');
  });
});

describe('methodNotAllowed', () => {
  it('should create 405 response listing allowed methods', async () => {
    const res = methodNotAllowed(['GET', 'POST']);
    const body = await res.json();
    expect(body.error).toContain('GET');
    expect(body.error).toContain('POST');
    expect(res.status).toBe(405);
  });
});

describe('corsPreflightResponse', () => {
  it('should return 204 with CORS headers', () => {
    const res = corsPreflightResponse();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400');
  });
});
