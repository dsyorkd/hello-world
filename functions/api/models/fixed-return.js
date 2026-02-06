/**
 * POST /api/models/fixed-return
 *
 * Run a fixed annual return projection.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';
import { validateRequired, parseJsonBody } from '../../lib/validation.js';
import { runFixedReturn } from '../../lib/simulation.js';

export async function onRequestPost(context) {
  const { DB } = context.env;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  const reqCheck = validateRequired(body, ['user_id']);
  if (!reqCheck.valid) return errorResponse(reqCheck.error, 400);

  try {
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(body.user_id).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const profile = await DB.prepare(
      'SELECT * FROM financial_profiles WHERE user_id = ?'
    ).bind(body.user_id).first();

    if (!profile) {
      return errorResponse('Financial profile not found. Create one before running projections.', 400);
    }

    const overrides = body.override_params || {};

    const params = {
      currentAge: user.age,
      retirementAge: overrides.retirement_age || user.retirement_age,
      maxAge: 95,
      currentSavings: overrides.current_savings !== undefined ? overrides.current_savings : profile.current_savings,
      monthlyContribution: overrides.monthly_contribution !== undefined ? overrides.monthly_contribution : profile.monthly_contribution,
      annualReturn: body.annual_return !== undefined ? body.annual_return : undefined,
      inflationRate: body.inflation_rate !== undefined ? body.inflation_rate : 0.03,
      riskTolerance: overrides.risk_tolerance || user.risk_tolerance,
      retirementMonthlySpending: overrides.retirement_monthly_spending !== undefined
        ? overrides.retirement_monthly_spending
        : profile.monthly_expenses,
      socialSecurityMonthly: overrides.social_security_monthly !== undefined
        ? overrides.social_security_monthly
        : profile.social_security_monthly,
    };

    const result = runFixedReturn(params);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(`Fixed return projection failed: ${err.message}`, 500);
  }
}
