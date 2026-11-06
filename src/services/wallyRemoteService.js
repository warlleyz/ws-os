const REQUEST_TIMEOUT_MS = 30000;

export async function askWallyRemote({
  question,
  locale = 'pt-BR',
  history = [],
  turnstileToken,
  signal,
}) {
  if (!turnstileToken) {
    throw new Error('VERIFICATION_REQUIRED');
  }

  const controller = new AbortController();

  const abort = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', abort, { once: true });
  }

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/wally', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        locale,
        history,
        turnstileToken,
      }),
      signal: controller.signal,
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error('INVALID_SERVER_RESPONSE');
    }

    if (!response.ok) {
      throw new Error(data.error || 'REMOTE_UNAVAILABLE');
    }

    if (controller.signal.aborted) throw new DOMException('Operação cancelada.', 'AbortError');
    if (typeof data?.message !== 'string' || !data.message.trim() || data.message.length > 4000) {
      throw new Error('EMPTY_RESPONSE');
    }

    return {
      message: data.message,
      actions: [],
      provider: 'gemini',
    };
  } catch (error) {
    if (timedOut && !signal?.aborted) throw new Error('AI_TIMEOUT', { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
