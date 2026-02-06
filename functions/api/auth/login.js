/**
 * POST /api/auth/login
 *
 * Create or resume a user session. Accepts email and optional name.
 * Returns user object, session token, and flags.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';
import { validateEmail, parseJsonBody } from '../../lib/validation.js';

export async function onRequestPost(context) {
  const { DB } = context.env;

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  const { email, name } = body;

  if (!email || !validateEmail(email)) {
    return errorResponse('Valid email is required', 400);
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name ? name.trim() : '';

  try {
    // Check for existing user
    let user = await DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(trimmedEmail).first();

    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      const userId = crypto.randomUUID();
      const userName = trimmedName || trimmedEmail.split('@')[0];

      await DB.prepare(
        'INSERT INTO users (id, name, email, age, retirement_age, risk_tolerance, created_at, updated_at) VALUES (?, ?, ?, 30, 65, ?, datetime(\'now\'), datetime(\'now\'))'
      ).bind(userId, userName, trimmedEmail, 'moderate').run();

      user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    } else if (trimmedName && trimmedName !== user.name) {
      // Update name if provided and different
      await DB.prepare(
        'UPDATE users SET name = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(trimmedName, user.id).run();
      user.name = trimmedName;
    }

    // Create session token
    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomUUID();
    // Session expires in 24 hours
    await DB.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, datetime(\'now\', \'+24 hours\'), datetime(\'now\'))'
    ).bind(sessionId, user.id, sessionToken).run();

    // Check for financial profile
    const profile = await DB.prepare(
      'SELECT id FROM financial_profiles WHERE user_id = ?'
    ).bind(user.id).first();

    // Check for active conversation (onboarding completeness)
    const conversation = await DB.prepare(
      'SELECT status FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(user.id).first();

    const disclaimerRequired = !user.disclaimer_acknowledged_at;

    return jsonResponse({
      user: {
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
      },
      session_token: sessionToken,
      is_new_user: isNewUser,
      disclaimer_required: disclaimerRequired,
    }, 200);
  } catch (err) {
    return errorResponse(`Login failed: ${err.message}`, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
    },
  });
}
