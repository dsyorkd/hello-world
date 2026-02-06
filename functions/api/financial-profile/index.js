/**
 * POST /api/financial-profile
 *
 * Create a new financial profile for a user.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';
import { validateRequired, validatePositiveNumber, parseJsonBody } from '../../lib/validation.js';

export async function onRequestPost(context) {
  const { DB } = context.env;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  const reqCheck = validateRequired(body, ['user_id', 'annual_income', 'current_savings', 'monthly_contribution']);
  if (!reqCheck.valid) return errorResponse(reqCheck.error, 400);

  for (const field of ['annual_income', 'current_savings', 'monthly_contribution']) {
    const check = validatePositiveNumber(body[field], field);
    if (!check.valid) return errorResponse(check.error, 400);
  }

  try {
    // Verify user exists
    const user = await DB.prepare('SELECT id FROM users WHERE id = ?').bind(body.user_id).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Check for existing profile
    const existing = await DB.prepare(
      'SELECT id FROM financial_profiles WHERE user_id = ?'
    ).bind(body.user_id).first();

    if (existing) {
      return errorResponse('Financial profile already exists for this user. Use PUT to update.', 409);
    }

    const profileId = crypto.randomUUID();
    const retirementAccountsJson = body.retirement_accounts
      ? JSON.stringify(body.retirement_accounts)
      : null;

    await DB.prepare(
      `INSERT INTO financial_profiles (id, user_id, annual_income, current_savings, monthly_contribution, retirement_accounts_json, social_security_monthly, total_debt, monthly_expenses, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      profileId,
      body.user_id,
      body.annual_income,
      body.current_savings,
      body.monthly_contribution,
      retirementAccountsJson,
      body.social_security_monthly || 0,
      body.total_debt || 0,
      body.monthly_expenses || 0,
    ).run();

    const profile = await DB.prepare(
      'SELECT * FROM financial_profiles WHERE id = ?'
    ).bind(profileId).first();

    return jsonResponse(formatProfile(profile), 201);
  } catch (err) {
    return errorResponse(`Failed to create financial profile: ${err.message}`, 500);
  }
}

function formatProfile(profile) {
  return {
    id: profile.id,
    user_id: profile.user_id,
    annual_income: profile.annual_income,
    current_savings: profile.current_savings,
    monthly_contribution: profile.monthly_contribution,
    retirement_accounts: profile.retirement_accounts_json
      ? JSON.parse(profile.retirement_accounts_json)
      : [],
    social_security_monthly: profile.social_security_monthly,
    total_debt: profile.total_debt,
    monthly_expenses: profile.monthly_expenses,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}
