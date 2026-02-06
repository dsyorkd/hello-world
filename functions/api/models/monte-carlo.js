/**
 * POST /api/models/monte-carlo
 *
 * Run Monte Carlo retirement simulation.
 * Fetches user's financial profile, runs simulation, returns percentile paths.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';
import { validateRequired, validateInteger, parseJsonBody } from '../../lib/validation.js';
import { runMonteCarlo } from '../../lib/simulation.js';

export async function onRequestPost(context) {
  const { DB } = context.env;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  const reqCheck = validateRequired(body, ['user_id']);
  if (!reqCheck.valid) return errorResponse(reqCheck.error, 400);

  if (body.simulation_count !== undefined) {
    const simCheck = validateInteger(body.simulation_count, 'simulation_count', 100, 10000);
    if (!simCheck.valid) return errorResponse(simCheck.error, 400);
  }

  if (body.max_age !== undefined) {
    const ageCheck = validateInteger(body.max_age, 'max_age', 50, 120);
    if (!ageCheck.valid) return errorResponse(ageCheck.error, 400);
  }

  try {
    // Fetch user
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(body.user_id).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Fetch financial profile
    const profile = await DB.prepare(
      'SELECT * FROM financial_profiles WHERE user_id = ?'
    ).bind(body.user_id).first();

    if (!profile) {
      return errorResponse('Financial profile not found. Create one before running simulations.', 400);
    }

    // Apply overrides if provided
    const overrides = body.override_params || {};

    const params = {
      currentAge: user.age,
      retirementAge: overrides.retirement_age || user.retirement_age,
      maxAge: body.max_age || 95,
      currentSavings: overrides.current_savings !== undefined ? overrides.current_savings : profile.current_savings,
      monthlyContribution: overrides.monthly_contribution !== undefined ? overrides.monthly_contribution : profile.monthly_contribution,
      riskTolerance: overrides.risk_tolerance || user.risk_tolerance,
      retirementMonthlySpending: overrides.retirement_monthly_spending !== undefined
        ? overrides.retirement_monthly_spending
        : profile.monthly_expenses,
      socialSecurityMonthly: overrides.social_security_monthly !== undefined
        ? overrides.social_security_monthly
        : profile.social_security_monthly,
      simulationCount: body.simulation_count || 1000,
    };

    const result = runMonteCarlo(params);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(`Monte Carlo simulation failed: ${err.message}`, 500);
  }
}
