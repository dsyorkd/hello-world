/**
 * /api/users/:id
 *
 * GET  - Retrieve user profile
 * PUT  - Update user profile
 */
import { jsonResponse, errorResponse, notFoundResponse, methodNotAllowed } from '../../lib/response.js';
import { validateEnum, validateInteger, parseJsonBody } from '../../lib/validation.js';

async function getUser(context) {
  const { DB } = context.env;
  const userId = context.params.id;

  try {
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    if (!user) {
      return notFoundResponse('User');
    }

    const profile = await DB.prepare(
      'SELECT id FROM financial_profiles WHERE user_id = ?'
    ).bind(userId).first();

    const conversation = await DB.prepare(
      'SELECT status FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first();

    return jsonResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      retirement_age: user.retirement_age,
      risk_tolerance: user.risk_tolerance,
      employment_status: user.employment_status,
      disclaimer_acknowledged_at: user.disclaimer_acknowledged_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      has_financial_profile: !!profile,
      onboarding_complete: conversation?.status === 'completed',
    });
  } catch (err) {
    return errorResponse(`Failed to fetch user: ${err.message}`, 500);
  }
}

async function updateUser(context) {
  const { DB } = context.env;
  const userId = context.params.id;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  // Validate fields
  const riskCheck = validateEnum(body.risk_tolerance, ['conservative', 'moderate', 'aggressive'], 'risk_tolerance');
  if (!riskCheck.valid) return errorResponse(riskCheck.error, 400);

  const ageCheck = validateInteger(body.age, 'age', 1, 120);
  if (!ageCheck.valid) return errorResponse(ageCheck.error, 400);

  const retAgeCheck = validateInteger(body.retirement_age, 'retirement_age', 1, 120);
  if (!retAgeCheck.valid) return errorResponse(retAgeCheck.error, 400);

  try {
    // Check user exists
    const existing = await DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    if (!existing) {
      return notFoundResponse('User');
    }

    // Build dynamic update
    const updates = [];
    const values = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
    if (body.age !== undefined) { updates.push('age = ?'); values.push(body.age); }
    if (body.retirement_age !== undefined) { updates.push('retirement_age = ?'); values.push(body.retirement_age); }
    if (body.risk_tolerance !== undefined) { updates.push('risk_tolerance = ?'); values.push(body.risk_tolerance); }
    if (body.employment_status !== undefined) { updates.push('employment_status = ?'); values.push(body.employment_status); }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(userId);

    await DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    // Return updated user
    return getUser(context);
  } catch (err) {
    return errorResponse(`Failed to update user: ${err.message}`, 500);
  }
}

export async function onRequest(context) {
  switch (context.request.method) {
    case 'GET': return getUser(context);
    case 'PUT': return updateUser(context);
    default: return methodNotAllowed(['GET', 'PUT']);
  }
}
