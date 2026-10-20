import { database } from './backend.js';

/* === Notificação independente; envio incerto nunca é repetido automaticamente === */
export async function notifyPrivateRequest(env, result, data, visitor) {
  if (['confirmed', 'failed', 'unknown'].includes(result.email)) return result.email;
  if (result.email === 'sending') return 'unknown';
  if (
    env.EMAILJS_NOTIFICATIONS_ENABLED !== 'true' ||
    ![
      env.EMAILJS_SERVICE_ID,
      env.EMAILJS_TEMPLATE_ID,
      env.EMAILJS_PUBLIC_KEY,
      env.EMAILJS_PRIVATE_KEY,
    ].every((value) => typeof value === 'string' && value)
  )
    return 'not_sent';
  try {
    const claimed = await database(env, 'rpc/claim_request_notification', {
      method: 'POST',
      service: true,
      body: { target_id: result.id, target_visitor: visitor },
    });
    if (claimed !== true)
      return ['confirmed', 'failed', 'unknown'].includes(result.email) ? result.email : 'unknown';
  } catch {
    return 'unknown';
  }
  let state;
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: env.EMAILJS_TEMPLATE_ID,
        user_id: env.EMAILJS_PUBLIC_KEY,
        accessToken: env.EMAILJS_PRIVATE_KEY,
        template_params: {
          from_name: data.name,
          reply_to: data.email,
          message: data.message,
          request_type: data.type,
          requested_at: data.requestedAt ?? '',
          request_timezone: data.timezone ?? '',
          request_id: result.id,
        },
      }),
    });
    state = response.ok ? 'confirmed' : 'failed';
  } catch {
    state = 'unknown';
  }
  try {
    const recorded = await database(env, 'rpc/finish_request_notification', {
      method: 'POST',
      service: true,
      body: { target_id: result.id, target_visitor: visitor, delivery_state: state },
    });
    if (recorded !== true) return 'unknown';
  } catch {
    return 'unknown';
  }
  return state;
}
