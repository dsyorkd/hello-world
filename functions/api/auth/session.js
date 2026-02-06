/**
 * GET /api/auth/session
 *
 * Validate the current session token and return user data.
 * Session token is validated by middleware; this endpoint returns the user.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';

export async function onRequestGet(context) {
  const { DB } = context.env;
  const userId = context.data?.userId;

  if (!userId) {
    return errorResponse('Session not found', 401);
  }

  try {
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    if (!user) {
      return errorResponse('User not found', 404);
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
    return errorResponse(`Session validation failed: ${err.message}`, 500);
  }
}
