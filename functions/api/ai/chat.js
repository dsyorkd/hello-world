/**
 * POST /api/ai/chat
 *
 * AI-guided onboarding assistant. Proxies to Anthropic Claude API,
 * maintains conversation history in D1, and extracts financial parameters
 * from natural language responses.
 */
import { jsonResponse, errorResponse } from '../../lib/response.js';
import { validateRequired, parseJsonBody } from '../../lib/validation.js';

const SYSTEM_PROMPT = `You are RetireWise, a friendly and professional financial planning assistant. Your job is to help users set up their retirement planning profile through natural conversation.

IMPORTANT: You are NOT a licensed financial advisor. Always remind users that this tool is for educational and entertainment purposes only.

Your goals:
1. Collect the user's financial information through friendly conversation
2. Extract structured parameters from their responses
3. Guide them toward running their first retirement simulation

Information to collect (in rough order):
- Name and age
- Target retirement age
- Current employment status
- Risk tolerance (conservative/moderate/aggressive) - explain what each means
- Current savings and net worth
- Annual income
- Monthly savings/contribution amount
- Existing retirement accounts (401k, IRA, Roth IRA, etc.) with balances
- Expected Social Security benefit (if known)
- Current debt obligations
- Monthly expenses
- Retirement goals (target income, legacy goals, major planned expenses)

Guidelines:
- Ask 1-2 questions at a time, not all at once
- Be encouraging and non-judgmental about financial situations
- Explain concepts simply when needed
- After collecting enough information, summarize what you have and confirm with the user
- When the profile feels mostly complete, recommend a simulation model

CRITICAL: In your response, you MUST include a JSON block wrapped in <extracted_params> tags containing any parameters you've extracted from the conversation so far. The format is:

<extracted_params>
{
  "name": "string or null",
  "age": "number or null",
  "retirement_age": "number or null",
  "risk_tolerance": "string or null",
  "annual_income": "number or null",
  "current_savings": "number or null",
  "monthly_contribution": "number or null",
  "monthly_expenses": "number or null",
  "social_security_monthly": "number or null",
  "employment_status": "string or null",
  "retirement_accounts": [{"type": "string", "balance": number}] or null,
  "goals": [{"goal_type": "string", "target_amount": number, "description": "string"}] or null,
  "completeness": 0.0 to 1.0
}
</extracted_params>

Always include this block, even if all values are null. Update completeness based on how much information has been gathered (0 = nothing, 1 = everything needed for a simulation).

When completeness >= 0.8, recommend a model type based on the user's profile:
- monte_carlo: Best for users who want to understand the range of possible outcomes
- fixed_return: Best for users who want a simple, easy-to-understand projection
- three_scenario: Best for users who want to see best/expected/worst case quickly`;

function parseExtractedParams(text) {
  const match = text.match(/<extracted_params>\s*([\s\S]*?)\s*<\/extracted_params>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function cleanResponseText(text) {
  // Remove the extracted_params block from the visible response
  return text.replace(/<extracted_params>[\s\S]*?<\/extracted_params>/, '').trim();
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  const ANTHROPIC_API_KEY = context.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return errorResponse('AI service not configured', 503);
  }

  const body = await parseJsonBody(context.request);
  if (!body) {
    return errorResponse('Invalid JSON body', 400);
  }

  const reqCheck = validateRequired(body, ['user_id', 'message']);
  if (!reqCheck.valid) return errorResponse(reqCheck.error, 400);

  try {
    // Verify user exists
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(body.user_id).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    let conversationId = body.conversation_id;
    let messages = [];
    let existingParams = null;

    if (conversationId) {
      // Load existing conversation
      const conversation = await DB.prepare(
        'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
      ).bind(conversationId, body.user_id).first();

      if (conversation) {
        messages = JSON.parse(conversation.messages_json || '[]');
        existingParams = conversation.extracted_params_json
          ? JSON.parse(conversation.extracted_params_json)
          : null;
      } else {
        // Invalid conversation ID, create new
        conversationId = null;
      }
    }

    if (!conversationId) {
      // Create new conversation
      conversationId = crypto.randomUUID();
      await DB.prepare(
        `INSERT INTO conversations (id, user_id, messages_json, status, created_at, updated_at)
         VALUES (?, ?, '[]', 'active', datetime('now'), datetime('now'))`
      ).bind(conversationId, body.user_id).run();
    }

    // Add user message to history
    messages.push({
      role: 'user',
      content: body.message,
      timestamp: new Date().toISOString(),
    });

    // Build messages for Anthropic API (only role + content)
    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: apiMessages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('Anthropic API error:', errText);
      return errorResponse('AI service unavailable', 502);
    }

    const anthropicData = await anthropicResponse.json();
    const assistantText = anthropicData.content?.[0]?.text || '';

    // Parse extracted parameters
    const extractedParams = parseExtractedParams(assistantText) || existingParams;
    const cleanedResponse = cleanResponseText(assistantText);

    // Add assistant message to history
    messages.push({
      role: 'assistant',
      content: assistantText,
      timestamp: new Date().toISOString(),
    });

    // Determine onboarding completeness
    const completeness = extractedParams?.completeness || 0;
    const onboardingComplete = completeness >= 0.8;

    // Determine recommended model
    let recommendedModel = null;
    if (onboardingComplete) {
      if (extractedParams?.risk_tolerance === 'conservative') {
        recommendedModel = 'fixed_return';
      } else if (extractedParams?.risk_tolerance === 'aggressive') {
        recommendedModel = 'monte_carlo';
      } else {
        recommendedModel = 'three_scenario';
      }
    }

    // Update conversation status
    const status = onboardingComplete ? 'completed' : 'active';

    await DB.prepare(
      `UPDATE conversations SET messages_json = ?, extracted_params_json = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(
      JSON.stringify(messages),
      extractedParams ? JSON.stringify(extractedParams) : null,
      status,
      conversationId,
    ).run();

    return jsonResponse({
      response: cleanedResponse,
      conversation_id: conversationId,
      extracted_parameters: extractedParams,
      onboarding_complete: onboardingComplete,
      recommended_model: recommendedModel,
    });
  } catch (err) {
    return errorResponse(`AI chat failed: ${err.message}`, 500);
  }
}
