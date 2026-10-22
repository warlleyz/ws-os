const REQUEST_TIMEOUT_MS = 15000;

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

  const timeout = setTimeout(() => {
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
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
