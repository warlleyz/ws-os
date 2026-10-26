/* === UZDoom: entrega sequencial do pacote original em partes === */
const DATA_PATH = '/games/uzdoom/uzdoom.data';
const PART_PREFIX = '/games/uzdoom/uzdoom.data.part';
const PART_COUNT = 6;
const headers = {
  'Content-Type': 'application/octet-stream',
  'Cache-Control': 'public, max-age=3600',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

export function isDoomDataRequest(pathname) {
  return pathname === DATA_PATH;
}

export async function serveDoomData(request, env) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const origin = new URL(request.url).origin;
  const parts = [];
  let partIndex = 0;
  let reader = null;
  let stopped = false;

  /* ----- Liberar também as partes ainda não consumidas em falhas e cancelamentos. ----- */
  async function release() {
    stopped = true;
    const activeReader = reader;
    reader = null;
    const remaining = parts.slice(partIndex + (activeReader ? 1 : 0));
    if (activeReader) {
      await activeReader.cancel().catch(() => {});
      activeReader.releaseLock();
    }
    await Promise.allSettled(remaining.map((part) => part.body?.cancel()));
  }

  try {
    for (let index = 1; index <= PART_COUNT; index++) {
      const response = await env.ASSETS.fetch(
        new Request(new URL(`${PART_PREFIX}${index}`, origin)),
      );
      parts.push(response);
      /* ----- O fallback HTML da SPA não é um pacote de dados válido. ----- */
      if (
        !response.ok ||
        !response.body ||
        /text\/html/i.test(response.headers.get('Content-Type') ?? '')
      ) {
        throw Error('UZDOOM_DATA_UNAVAILABLE');
      }
    }
  } catch {
    await release();
    return new Response('UZDOOM_DATA_UNAVAILABLE', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  }

  if (request.method === 'HEAD') {
    await release();
    return new Response(null, { headers });
  }

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        while (partIndex < parts.length) {
          reader ??= parts[partIndex].body.getReader();
          const { done, value } = await reader.read();
          if (stopped) return;
          if (done) {
            reader.releaseLock();
            reader = null;
            partIndex++;
            continue;
          }
          controller.enqueue(value);
          return;
        }
        controller.close();
      } catch (error) {
        await release();
        controller.error(error);
      }
    },
    cancel: release,
  });
  return new Response(stream, { headers });
}
