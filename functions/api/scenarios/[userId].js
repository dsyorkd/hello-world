/**
 * GET /api/scenarios/:userId
 *
 * Get all saved scenarios for a user.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';

export async function onRequestGet(context) {
  const { DB } = context.env;
  const userId = context.params.userId;

  try {
    const result = await DB.prepare(
      'SELECT * FROM scenarios WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    const scenarios = (result.results || []).map(s => ({
      id: s.id,
      user_id: s.user_id,
      name: s.name,
      model_type: s.model_type,
      parameters_json: s.parameters_json,
      results_json: s.results_json,
      is_active: !!s.is_active,
      created_at: s.created_at,
    }));

    return jsonResponse({ scenarios });
  } catch (err) {
    return errorResponse(`Failed to fetch scenarios: ${err.message}`, 500);
  }
}
