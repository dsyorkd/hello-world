/**
 * /api/goals/:userId/:goalId
 *
 * PUT    - Update a specific goal
 * DELETE - Delete a specific goal
 */
import { jsonResponse, errorResponse, notFoundResponse, methodNotAllowed } from '../../../lib/response.js';
import { validateEnum, validateInteger, parseJsonBody } from '../../../lib/validation.js';

async function updateGoal(context) {
  const { DB } = context.env;
  const { userId, goalId } = context.params;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  if (body.priority !== undefined) {
    const priCheck = validateInteger(body.priority, 'priority', 1, 100);
    if (!priCheck.valid) return errorResponse(priCheck.error, 400);
  }

  try {
    const existing = await DB.prepare(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?'
    ).bind(goalId, userId).first();

    if (!existing) {
      return notFoundResponse('Goal');
    }

    const updates = [];
    const values = [];

    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
    if (body.target_amount !== undefined) { updates.push('target_amount = ?'); values.push(body.target_amount); }
    if (body.target_monthly_income !== undefined) { updates.push('target_monthly_income = ?'); values.push(body.target_monthly_income); }
    if (body.target_date !== undefined) { updates.push('target_date = ?'); values.push(body.target_date); }
    if (body.priority !== undefined) { updates.push('priority = ?'); values.push(body.priority); }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    values.push(goalId);

    await DB.prepare(
      `UPDATE goals SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const updated = await DB.prepare('SELECT * FROM goals WHERE id = ?').bind(goalId).first();

    return jsonResponse({
      id: updated.id,
      user_id: updated.user_id,
      goal_type: updated.goal_type,
      description: updated.description,
      target_amount: updated.target_amount,
      target_monthly_income: updated.target_monthly_income,
      target_date: updated.target_date,
      priority: updated.priority,
      created_at: updated.created_at,
    });
  } catch (err) {
    return errorResponse(`Failed to update goal: ${err.message}`, 500);
  }
}

async function deleteGoal(context) {
  const { DB } = context.env;
  const { userId, goalId } = context.params;

  try {
    const existing = await DB.prepare(
      'SELECT id FROM goals WHERE id = ? AND user_id = ?'
    ).bind(goalId, userId).first();

    if (!existing) {
      return notFoundResponse('Goal');
    }

    await DB.prepare('DELETE FROM goals WHERE id = ?').bind(goalId).run();

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return errorResponse(`Failed to delete goal: ${err.message}`, 500);
  }
}

export async function onRequest(context) {
  switch (context.request.method) {
    case 'PUT': return updateGoal(context);
    case 'DELETE': return deleteGoal(context);
    default: return methodNotAllowed(['PUT', 'DELETE']);
  }
}
