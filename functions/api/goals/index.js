/**
 * POST /api/goals
 *
 * Create a new financial goal.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';
import { validateRequired, validateEnum, validateInteger, parseJsonBody } from '../../lib/validation.js';

export async function onRequestPost(context) {
  const { DB } = context.env;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  const reqCheck = validateRequired(body, ['user_id', 'goal_type']);
  if (!reqCheck.valid) return errorResponse(reqCheck.error, 400);

  const typeCheck = validateEnum(body.goal_type, ['retirement_income', 'legacy', 'major_expense'], 'goal_type');
  if (!typeCheck.valid) return errorResponse(typeCheck.error, 400);

  if (body.priority !== undefined) {
    const priCheck = validateInteger(body.priority, 'priority', 1, 100);
    if (!priCheck.valid) return errorResponse(priCheck.error, 400);
  }

  try {
    // Verify user exists
    const user = await DB.prepare('SELECT id FROM users WHERE id = ?').bind(body.user_id).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const goalId = crypto.randomUUID();

    await DB.prepare(
      `INSERT INTO goals (id, user_id, goal_type, description, target_amount, target_monthly_income, target_date, priority, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      goalId,
      body.user_id,
      body.goal_type,
      body.description || null,
      body.target_amount || null,
      body.target_monthly_income || null,
      body.target_date || null,
      body.priority || 1,
    ).run();

    const goal = await DB.prepare('SELECT * FROM goals WHERE id = ?').bind(goalId).first();

    return jsonResponse({
      id: goal.id,
      user_id: goal.user_id,
      goal_type: goal.goal_type,
      description: goal.description,
      target_amount: goal.target_amount,
      target_monthly_income: goal.target_monthly_income,
      target_date: goal.target_date,
      priority: goal.priority,
      created_at: goal.created_at,
    }, 201);
  } catch (err) {
    return errorResponse(`Failed to create goal: ${err.message}`, 500);
  }
}
