/**
 * /api/financial-profile/:userId
 *
 * GET - Retrieve financial profile for a user
 * PUT - Update financial profile for a user
 */
import { jsonResponse, errorResponse, notFoundResponse, methodNotAllowed } from '../../lib/response.js';
import { validatePositiveNumber, parseJsonBody } from '../../lib/validation.js';

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

async function getProfile(context) {
  const { DB } = context.env;
  const userId = context.params.userId;

  try {
    const profile = await DB.prepare(
      'SELECT * FROM financial_profiles WHERE user_id = ?'
    ).bind(userId).first();

    if (!profile) {
      return notFoundResponse('Financial profile');
    }

    return jsonResponse(formatProfile(profile));
  } catch (err) {
    return errorResponse(`Failed to fetch financial profile: ${err.message}`, 500);
  }
}

async function updateProfile(context) {
  const { DB } = context.env;
  const userId = context.params.userId;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  // Validate numeric fields
  for (const field of ['annual_income', 'current_savings', 'monthly_contribution', 'social_security_monthly', 'total_debt', 'monthly_expenses']) {
    if (body[field] !== undefined) {
      const check = validatePositiveNumber(body[field], field);
      if (!check.valid) return errorResponse(check.error, 400);
    }
  }

  try {
    const existing = await DB.prepare(
      'SELECT * FROM financial_profiles WHERE user_id = ?'
    ).bind(userId).first();

    if (!existing) {
      return notFoundResponse('Financial profile');
    }

    const updates = [];
    const values = [];

    if (body.annual_income !== undefined) { updates.push('annual_income = ?'); values.push(body.annual_income); }
    if (body.current_savings !== undefined) { updates.push('current_savings = ?'); values.push(body.current_savings); }
    if (body.monthly_contribution !== undefined) { updates.push('monthly_contribution = ?'); values.push(body.monthly_contribution); }
    if (body.retirement_accounts !== undefined) {
      updates.push('retirement_accounts_json = ?');
      values.push(JSON.stringify(body.retirement_accounts));
    }
    if (body.social_security_monthly !== undefined) { updates.push('social_security_monthly = ?'); values.push(body.social_security_monthly); }
    if (body.total_debt !== undefined) { updates.push('total_debt = ?'); values.push(body.total_debt); }
    if (body.monthly_expenses !== undefined) { updates.push('monthly_expenses = ?'); values.push(body.monthly_expenses); }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(existing.id);

    await DB.prepare(
      `UPDATE financial_profiles SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const updated = await DB.prepare(
      'SELECT * FROM financial_profiles WHERE id = ?'
    ).bind(existing.id).first();

    return jsonResponse(formatProfile(updated));
  } catch (err) {
    return errorResponse(`Failed to update financial profile: ${err.message}`, 500);
  }
}

export async function onRequest(context) {
  switch (context.request.method) {
    case 'GET': return getProfile(context);
    case 'PUT': return updateProfile(context);
    default: return methodNotAllowed(['GET', 'PUT']);
  }
}
