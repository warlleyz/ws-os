import { runMaintenance } from '../functions/_lib/maintenance.js';
import { onRequest as handleRequests } from '../functions/api/requests.js';
import { onRequest as handleFiles } from '../functions/api/managedFiles.js';
import { onRequest as handleAttachments } from '../functions/api/attachments.js';
import { onRequest as handleRankings } from '../functions/api/rankings.js';
import { onRequest as handleContent } from '../functions/api/managedContent.js';
import { onRequestPost as handleWally } from '../functions/api/wally.js';
import { onRequestGet as handlePosts } from '../functions/api/posts.js';
import { onRequest as handleProjectHighlights } from '../functions/api/projectHighlights.js';
import {
  onRequestGet as handleGetPostLikes,
  onRequestPost as handlePostLike,
} from '../functions/api/postLikes.js';
import { onRequestGet as handleWakatime } from '../functions/api/wakatime.js';

import {
  onRequestGet as handleAdminPosts,
  onRequestCreate as handleCreateNote,
  onRequestUpdate as handleUpdateNote,
  onRequestChangeStatus as handleChangeNoteStatus,
  onRequestDelete as handleDeleteNote,
} from '../functions/api/adminPosts.js';

import {
  onRequestLogin,
  onRequestMe,
  onRequestLogout,
  onRequestAdminStatus,
} from '../functions/api/auth.js';

const routes = {
  '/api/admin/rankings': { methods: ['GET', 'DELETE'], handler: handleRankings },
  '/api/requests': { methods: ['POST'], handler: handleRequests },
  '/api/admin/requests': { methods: ['GET', 'PATCH', 'DELETE'], handler: handleRequests },
  '/api/files': { methods: ['GET'], handler: handleFiles },
  '/api/admin/files': { methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], handler: handleFiles },
  '/api/posts/attachments': { methods: ['GET'], handler: handleAttachments },
  '/api/admin/attachments': { methods: ['POST', 'DELETE'], handler: handleAttachments },
  '/api/rankings': { methods: ['GET', 'POST'], handler: handleRankings },
  '/api/admin/content': { methods: ['GET', 'POST', 'PATCH', 'DELETE'], handler: handleContent },
  '/api/content': { method: 'GET', handler: handleContent },

  '/api/wally': { method: 'POST', handler: handleWally },
  '/api/posts': { method: 'GET', handler: handlePosts },
  '/api/posts/likes': {
    method: 'GET',
    handler: handleGetPostLikes,
  },
  '/api/posts/likes/add': {
    method: 'POST',
    handler: handlePostLike,
  },
  '/api/wakatime': { method: 'GET', handler: handleWakatime },
  '/api/auth/login': { method: 'POST', handler: onRequestLogin },
  '/api/auth/me': { method: 'GET', handler: onRequestMe },
  '/api/auth/logout': { method: 'POST', handler: onRequestLogout },
  '/api/admin/status': { method: 'GET', handler: onRequestAdminStatus },
  '/api/admin/posts': { method: 'GET', handler: handleAdminPosts },
  '/api/admin/posts/create': { method: 'POST', handler: handleCreateNote },
  '/api/admin/posts/update': { method: 'PATCH', handler: handleUpdateNote },
  '/api/admin/posts/status': {
    method: 'PATCH',
    handler: handleChangeNoteStatus,
  },
  '/api/admin/posts/delete': {
    method: 'DELETE',
    handler: handleDeleteNote,
  },
  '/api/project-highlights': {
    method: 'GET',
    handler: handleProjectHighlights,
  },
  '/api/admin/project-highlights': {
    methods: ['GET', 'PUT'],
    handler: handleProjectHighlights,
  },
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
  async scheduled(_event, env) {
    await runMaintenance(env);
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const route = routes[url.pathname];
    if (route) {
      const methods = route.methods ?? [route.method];
      if (!methods.includes(request.method))
        return error('METHOD_NOT_ALLOWED', 405, { Allow: methods.join(', ') });
      try {
        return await route.handler({ request, env, ctx });
      } catch {
        return error('SERVICE_UNAVAILABLE', 503);
      }
    }

    if (url.pathname.startsWith('/api/')) {
      return error('NOT_FOUND', 404);
    }

    const assetResponse = await env.ASSETS.fetch(request);

    /* ----- Preservar conteúdo, status e cache com proteção de documentos HTML ----- */
    const headers = new Headers(assetResponse.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (/^text\/html(?:;|$)/i.test(headers.get('Content-Type') ?? '')) {
      headers.set('X-Frame-Options', 'SAMEORIGIN');
      headers.set(
        'Content-Security-Policy',
        "base-uri 'self'; object-src 'none'; frame-ancestors 'self'",
      );
    }
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
