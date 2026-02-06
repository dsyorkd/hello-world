/**
 * Input validation utilities.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export function validateRequired(obj, fields) {
  const missing = fields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === '');
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  return { valid: true };
}

export function validateEnum(value, allowedValues, fieldName) {
  if (value !== undefined && value !== null && !allowedValues.includes(value)) {
    return { valid: false, error: `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}` };
  }
  return { valid: true };
}

export function validatePositiveNumber(value, fieldName) {
  if (value !== undefined && value !== null) {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: `${fieldName} must be a non-negative number` };
    }
  }
  return { valid: true };
}

export function validateInteger(value, fieldName, min, max) {
  if (value !== undefined && value !== null) {
    const num = Number(value);
    if (!Number.isInteger(num)) {
      return { valid: false, error: `${fieldName} must be an integer` };
    }
    if (min !== undefined && num < min) {
      return { valid: false, error: `${fieldName} must be at least ${min}` };
    }
    if (max !== undefined && num > max) {
      return { valid: false, error: `${fieldName} must be at most ${max}` };
    }
  }
  return { valid: true };
}

export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
