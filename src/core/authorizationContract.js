/* === Capacidades e fronteiras de confiança === */
export const CAPABILITY_POLICIES = Object.freeze({
  'public.read': { scope: 'public', administrator: false },
  'requests.submit': { scope: 'server', administrator: false },
  'posts.like': { scope: 'server', administrator: false },
  'rankings.submit': { scope: 'server', administrator: false },
  'public.navigate': { scope: 'public', administrator: false },
  'public.search': { scope: 'public', administrator: false },
  'preferences.update': { scope: 'local', administrator: false },
  'personal-files.write': { scope: 'local', administrator: false },
  'administration.access': { scope: 'server', administrator: true },
  'posts.manage': { scope: 'server', administrator: true },
  'official-files.manage': { scope: 'server', administrator: true },
  'events.manage': { scope: 'server', administrator: true },
  'requests.manage': { scope: 'server', administrator: true },
});

/* ----- Pré-checagem local não substitui autorização no Worker ----- */
export function checkCapability(capability, { administrator = false, localBrowser = false } = {}) {
  if (!Object.hasOwn(CAPABILITY_POLICIES, capability))
    return { ok: false, code: 'UNKNOWN_CAPABILITY' };
  const policy = CAPABILITY_POLICIES[capability];
  if (policy.administrator && administrator !== true) return { ok: false, code: 'ACCESS_DENIED' };
  if (policy.scope === 'local' && localBrowser !== true)
    return { ok: false, code: 'LOCAL_CONTEXT_REQUIRED' };
  return { ok: true, requiresServerAuthorization: policy.scope === 'server' };
}

/* === Matriz recurso × operação; condições vêm de código confiável === */
export function authorizeResourceOperation(resource, operation, context = {}) {
  const map = {
    posts: { read: 'public.read', manage: 'posts.manage', like: 'posts.like' },
    'official-files': { read: 'public.read', manage: 'official-files.manage' },
    events: { read: 'public.read', manage: 'events.manage' },
    requests: { submit: 'requests.submit', read: 'requests.manage', manage: 'requests.manage' },
    rankings: { read: 'public.read', submit: 'rankings.submit' },
    'personal-files': { read: 'personal-files.write', manage: 'personal-files.write' },
    preferences: { manage: 'preferences.update' },
  };
  if (!Object.hasOwn(map, resource) || !Object.hasOwn(map[resource], operation))
    return { ok: false, code: 'UNKNOWN_RESOURCE_OPERATION' };
  if (
    operation === 'read' &&
    ['posts', 'official-files', 'events'].includes(resource) &&
    context.published !== true
  ) {
    const administrative = map[resource].manage;
    return checkCapability(administrative, context);
  }
  return checkCapability(map[resource][operation], context);
}
