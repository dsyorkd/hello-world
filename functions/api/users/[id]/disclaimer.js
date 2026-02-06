/**
 * POST /api/users/:id/disclaimer
 *
 * Acknowledge the disclaimer for a user.
 */
import { jsonResponse, errorResponse, notFoundResponse } from '../../../lib/response.js';

export async function onRequestPost(context) {
  const { DB } = context.env;
  const userId = context.params.id;

  try {
    const user = await DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return notFoundResponse('User');
    }

    await DB.prepare(
      "UPDATE users SET disclaimer_acknowledged_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).bind(userId).run();

    const updated = await DB.prepare(
      'SELECT disclaimer_acknowledged_at FROM users WHERE id = ?'
    ).bind(userId).first();

    return jsonResponse({
      acknowledged_at: updated.disclaimer_acknowledged_at,
    });
  } catch (err) {
    return errorResponse(`Failed to acknowledge disclaimer: ${err.message}`, 500);
  }
}
