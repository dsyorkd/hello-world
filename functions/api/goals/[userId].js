/**
 * /api/goals/:userId
 *
 * GET - Retrieve all goals for a user
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';

export async function onRequestGet(context) {
  const { DB } = context.env;
  const userId = context.params.userId;

  try {
    const result = await DB.prepare(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY priority ASC, created_at DESC'
    ).bind(userId).all();

    const goals = (result.results || []).map(g => ({
      id: g.id,
      user_id: g.user_id,
      goal_type: g.goal_type,
      description: g.description,
      target_amount: g.target_amount,
      target_monthly_income: g.target_monthly_income,
      target_date: g.target_date,
      priority: g.priority,
      created_at: g.created_at,
    }));

    return jsonResponse({ goals });
  } catch (err) {
    return errorResponse(`Failed to fetch goals: ${err.message}`, 500);
  }
}
