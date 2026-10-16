import { onRequestPost as handleWally } from '../functions/api/wally.js';
import { onRequestGet as handlePosts } from '../functions/api/posts.js';
import { onRequestGet as handleWakatime } from '../functions/api/wakatime.js';

import {
  onRequestLogin,
  onRequestMe,
  onRequestLogout,
} from '../functions/api/auth.js';

const routes = {
  '/api/wally': { method: 'POST', handler: handleWally },
  '/api/posts': { method: 'GET', handler: handlePosts },
  '/api/wakatime': { method: 'GET', handler: handleWakatime },
  '/api/auth/login': { method: 'POST', handler: onRequestLogin },
  '/api/auth/me': { method: 'GET', handler: onRequestMe },
  '/api/auth/logout': { method: 'POST', handler: onRequestLogout },
};
function error(code, status, headers = {}) {
  return Response.json(
    { error: code },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...headers,
      },
    },
  );
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const route = routes[url.pathname];
    if (route) {
      if (request.method !== route.method)
        return error('METHOD_NOT_ALLOWED', 405, { Allow: route.method });
      try {
        return await route.handler({ request, env, ctx });
      } catch {
        return error('SERVICE_UNAVAILABLE', 503);
      }
    }
    if (url.pathname.startsWith('/api/')) return error('NOT_FOUND', 404);
    return env.ASSETS.fetch(request);
  },
};
