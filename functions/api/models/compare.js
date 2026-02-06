/**
 * POST /api/models/compare
 *
 * Run multiple models and return a summary comparison.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';
import { validateRequired, parseJsonBody } from '../../lib/validation.js';
import { runMonteCarlo, runFixedReturn, runThreeScenario } from '../../lib/simulation.js';

const VALID_MODEL_TYPES = ['monte_carlo', 'fixed_return', 'three_scenario'];

export async function onRequestPost(context) {
  const { DB } = context.env;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  const reqCheck = validateRequired(body, ['user_id', 'model_types']);
  if (!reqCheck.valid) return errorResponse(reqCheck.error, 400);

  if (!Array.isArray(body.model_types) || body.model_types.length === 0) {
    return errorResponse('model_types must be a non-empty array', 400);
  }

  for (const mt of body.model_types) {
    if (!VALID_MODEL_TYPES.includes(mt)) {
      return errorResponse(`Invalid model type: ${mt}. Must be one of: ${VALID_MODEL_TYPES.join(', ')}`, 400);
    }
  }

  try {
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(body.user_id).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const profile = await DB.prepare(
      'SELECT * FROM financial_profiles WHERE user_id = ?'
    ).bind(body.user_id).first();

    if (!profile) {
      return errorResponse('Financial profile not found.', 400);
    }

    const overrides = body.parameters_override || {};

    const baseParams = {
      currentAge: user.age,
      retirementAge: overrides.retirement_age || user.retirement_age,
      maxAge: 95,
      currentSavings: overrides.current_savings !== undefined ? overrides.current_savings : profile.current_savings,
      monthlyContribution: overrides.monthly_contribution !== undefined ? overrides.monthly_contribution : profile.monthly_contribution,
      riskTolerance: overrides.risk_tolerance || user.risk_tolerance,
      retirementMonthlySpending: overrides.retirement_monthly_spending !== undefined
        ? overrides.retirement_monthly_spending
        : profile.monthly_expenses,
      socialSecurityMonthly: overrides.social_security_monthly !== undefined
        ? overrides.social_security_monthly
        : profile.social_security_monthly,
    };

    const comparisons = [];

    for (const modelType of body.model_types) {
      let summary;

      switch (modelType) {
        case 'monte_carlo': {
          const result = runMonteCarlo({
            ...baseParams,
            simulationCount: 500, // Reduced for comparison speed
          });
          summary = {
            model_type: 'monte_carlo',
            balance_at_retirement: result.median_at_retirement,
            success_rate: result.success_rate,
            years_funds_last: null, // MC reports success_rate instead
            meets_goal: result.success_rate >= 80,
          };
          break;
        }

        case 'fixed_return': {
          const result = runFixedReturn(baseParams);
          summary = {
            model_type: 'fixed_return',
            balance_at_retirement: result.balance_at_retirement,
            success_rate: null,
            years_funds_last: result.years_funds_last,
            meets_goal: result.meets_goal,
          };
          break;
        }

        case 'three_scenario': {
          const result = runThreeScenario(baseParams);
          summary = {
            model_type: 'three_scenario',
            balance_at_retirement: result.expected.balance_at_retirement,
            success_rate: null,
            years_funds_last: result.expected.years_funds_last,
            meets_goal: result.expected.meets_goal,
          };
          break;
        }
      }

      comparisons.push({ model_type: modelType, summary });
    }

    return jsonResponse({ comparisons });
  } catch (err) {
    return errorResponse(`Model comparison failed: ${err.message}`, 500);
  }
}
