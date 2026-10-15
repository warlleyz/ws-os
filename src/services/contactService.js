import { portfolio } from '../content/portfolioContent';
let lastSent = 0;
let sending = false;
export function validateContact(value, now = Date.now()) {
  if (!value || typeof value !== 'object') throw new Error('Dados de contato inválidos.');
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const email = typeof value.email === 'string' ? value.email.trim() : '';
  const message = typeof value.message === 'string' ? value.message.trim() : '';
  if (name.length < 2 || name.length > 100)
    throw new Error('Informe um nome entre 2 e 100 caracteres.');
  if (email.length > 254 || !/^\S+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Informe um e-mail válido.');
  if (message.length < 10 || message.length > 5000)
    throw new Error('A mensagem deve ter entre 10 e 5000 caracteres.');
  if (
    value.website ||
    value.consent !== true ||
    !Number.isFinite(value.startedAt) ||
    now - value.startedAt < 3000
  )
    throw new Error('Revise o formulário e confirme o envio dos dados.');
  if (!['message', 'schedule'].includes(value.kind))
    throw new Error('Tipo de solicitação inválido.');
  let requestedAt = '';
  if (value.kind === 'schedule') {
    const date = Date.parse(value.requestedAt);
    if (!Number.isFinite(date) || date <= now || date > now + 366 * 86400000)
      throw new Error('Informe uma data futura dentro de um ano.');
    requestedAt = new Date(date).toISOString();
  }
  return { name, email, message, kind: value.kind, requestedAt };
}
export function isContactConfigured() {
  const config = portfolio.contact;
  return [config.emailService, config.emailTemplate, config.emailPublicKey].every(
    (value) => typeof value === 'string' && value.trim(),
  );
}
export async function sendContact(value, { signal } = {}) {
  const params = validateContact(value);
  if (!isContactConfigured())
    throw new Error(
      'O envio ainda não foi configurado. Utilize os canais profissionais disponíveis.',
    );
  if (sending || Date.now() - lastSent < 60000)
    throw new Error('Aguarde um minuto antes de enviar novamente.');
  if (signal?.aborted) throw new DOMException('Operação cancelada.', 'AbortError');
  sending = true;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 15000);
  const requestId = crypto.randomUUID();
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        service_id: portfolio.contact.emailService,
        template_id: portfolio.contact.emailTemplate,
        user_id: portfolio.contact.emailPublicKey,
        template_params: {
          from_name: params.name,
          reply_to: params.email,
          message: params.message,
          request_type: params.kind,
          requested_at: params.requestedAt,
          request_id: requestId,
        },
      }),
    });
    if (!response.ok)
      throw new Error('O serviço não confirmou o envio. Tente novamente mais tarde.');
    lastSent = Date.now();
    return { requestId, kind: params.kind };
  } catch (cause) {
    if (controller.signal.aborted)
      throw new Error('Envio não confirmado. Confira antes de reenviar para evitar duplicidade.', {
        cause,
      });
    throw cause;
  } finally {
    sending = false;
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
