/**
 * POST /api/scenarios
 *
 * Save a simulation scenario.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';
import { validateRequired, validateEnum, parseJsonBody } from '../../lib/validation.js';

export async function onRequestPost(context) {
  const { DB } = context.env;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  const reqCheck = validateRequired(body, ['user_id', 'name', 'model_type', 'parameters_json', 'results_json']);
  if (!reqCheck.valid) return errorResponse(reqCheck.error, 400);

  const typeCheck = validateEnum(body.model_type, ['monte_carlo', 'fixed_return', 'three_scenario'], 'model_type');
  if (!typeCheck.valid) return errorResponse(typeCheck.error, 400);

  try {
    // Verify user exists
    const user = await DB.prepare('SELECT id FROM users WHERE id = ?').bind(body.user_id).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const scenarioId = crypto.randomUUID();
    const isActive = body.is_active ? 1 : 0;

    // If setting this as active, deactivate other scenarios for this user
    if (isActive) {
      await DB.prepare(
        'UPDATE scenarios SET is_active = 0 WHERE user_id = ?'
      ).bind(body.user_id).run();
    }

    await DB.prepare(
      `INSERT INTO scenarios (id, user_id, name, model_type, parameters_json, results_json, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      scenarioId,
      body.user_id,
      body.name,
      body.model_type,
      body.parameters_json,
      body.results_json,
      isActive,
    ).run();

    const scenario = await DB.prepare('SELECT * FROM scenarios WHERE id = ?').bind(scenarioId).first();

    return jsonResponse({
      id: scenario.id,
      user_id: scenario.user_id,
      name: scenario.name,
      model_type: scenario.model_type,
      parameters_json: scenario.parameters_json,
      results_json: scenario.results_json,
      is_active: !!scenario.is_active,
      created_at: scenario.created_at,
    }, 201);
  } catch (err) {
    return errorResponse(`Failed to save scenario: ${err.message}`, 500);
  }
}
