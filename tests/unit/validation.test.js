/**
 * Unit tests for validation utilities.
 */
import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateRequired,
  validateEnum,
  validatePositiveNumber,
  validateInteger,
  parseJsonBody,
} from '../../functions/lib/validation.js';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    expect(validateEmail('hello+tag@gmail.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('missing@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
  });

  it('should reject null and undefined', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });

  it('should reject non-string types', () => {
    expect(validateEmail(123)).toBe(false);
    expect(validateEmail({})).toBe(false);
  });

  it('should trim whitespace', () => {
    expect(validateEmail('  user@example.com  ')).toBe(true);
  });
});

describe('validateRequired', () => {
  it('should pass when all required fields are present', () => {
    const result = validateRequired({ name: 'John', email: 'j@e.com' }, ['name', 'email']);
    expect(result.valid).toBe(true);
  });

  it('should fail when a required field is missing', () => {
    const result = validateRequired({ name: 'John' }, ['name', 'email']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('email');
  });

  it('should fail when a required field is empty string', () => {
    const result = validateRequired({ name: '' }, ['name']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('name');
  });

  it('should fail when a required field is null', () => {
    const result = validateRequired({ name: null }, ['name']);
    expect(result.valid).toBe(false);
  });

  it('should fail when a required field is undefined', () => {
    const result = validateRequired({}, ['name']);
    expect(result.valid).toBe(false);
  });

  it('should list all missing fields', () => {
    const result = validateRequired({}, ['name', 'email', 'age']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('name');
    expect(result.error).toContain('email');
    expect(result.error).toContain('age');
  });

  it('should pass with empty required list', () => {
    const result = validateRequired({}, []);
    expect(result.valid).toBe(true);
  });

  it('should accept zero as a valid value', () => {
    const result = validateRequired({ amount: 0 }, ['amount']);
    expect(result.valid).toBe(true);
  });

  it('should accept false as a valid value', () => {
    const result = validateRequired({ active: false }, ['active']);
    expect(result.valid).toBe(true);
  });
});

describe('validateEnum', () => {
  it('should pass for valid enum values', () => {
    const result = validateEnum('moderate', ['conservative', 'moderate', 'aggressive'], 'risk');
    expect(result.valid).toBe(true);
  });

  it('should fail for invalid enum values', () => {
    const result = validateEnum('extreme', ['conservative', 'moderate', 'aggressive'], 'risk');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('risk');
    expect(result.error).toContain('conservative');
  });

  it('should pass when value is undefined (optional)', () => {
    const result = validateEnum(undefined, ['a', 'b'], 'field');
    expect(result.valid).toBe(true);
  });

  it('should pass when value is null (optional)', () => {
    const result = validateEnum(null, ['a', 'b'], 'field');
    expect(result.valid).toBe(true);
  });
});

describe('validatePositiveNumber', () => {
  it('should pass for positive numbers', () => {
    expect(validatePositiveNumber(100, 'amount').valid).toBe(true);
    expect(validatePositiveNumber(0, 'amount').valid).toBe(true);
    expect(validatePositiveNumber(0.5, 'amount').valid).toBe(true);
  });

  it('should fail for negative numbers', () => {
    const result = validatePositiveNumber(-1, 'amount');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('amount');
  });

  it('should fail for NaN', () => {
    const result = validatePositiveNumber(NaN, 'amount');
    expect(result.valid).toBe(false);
  });

  it('should pass for undefined (optional)', () => {
    expect(validatePositiveNumber(undefined, 'amount').valid).toBe(true);
  });

  it('should pass for null (optional)', () => {
    expect(validatePositiveNumber(null, 'amount').valid).toBe(true);
  });

  it('should accept string numbers', () => {
    expect(validatePositiveNumber('100', 'amount').valid).toBe(true);
  });

  it('should reject non-numeric strings', () => {
    const result = validatePositiveNumber('abc', 'amount');
    expect(result.valid).toBe(false);
  });
});

describe('validateInteger', () => {
  it('should pass for valid integers within range', () => {
    expect(validateInteger(30, 'age', 1, 120).valid).toBe(true);
    expect(validateInteger(1, 'age', 1, 120).valid).toBe(true);
    expect(validateInteger(120, 'age', 1, 120).valid).toBe(true);
  });

  it('should fail for non-integers', () => {
    const result = validateInteger(30.5, 'age');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('integer');
  });

  it('should fail for values below minimum', () => {
    const result = validateInteger(0, 'age', 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least');
  });

  it('should fail for values above maximum', () => {
    const result = validateInteger(200, 'age', 1, 120);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most');
  });

  it('should pass for undefined (optional)', () => {
    expect(validateInteger(undefined, 'age', 1, 120).valid).toBe(true);
  });

  it('should pass for null (optional)', () => {
    expect(validateInteger(null, 'age', 1, 120).valid).toBe(true);
  });

  it('should work without min/max constraints', () => {
    expect(validateInteger(5, 'count').valid).toBe(true);
    expect(validateInteger(-5, 'count').valid).toBe(true);
  });
});

describe('parseJsonBody', () => {
  it('should parse valid JSON from request', async () => {
    const mockRequest = {
      json: async () => ({ name: 'test' }),
    };
    const result = await parseJsonBody(mockRequest);
    expect(result).toEqual({ name: 'test' });
  });

  it('should return null for invalid JSON', async () => {
    const mockRequest = {
      json: async () => { throw new Error('Invalid JSON'); },
    };
    const result = await parseJsonBody(mockRequest);
    expect(result).toBeNull();
  });
});
