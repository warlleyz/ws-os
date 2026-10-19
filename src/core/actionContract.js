import {
  isRecord,
  isContractData,
  validId,
  validText,
} from '../shared/utils/contractValidation.js';
import { checkCapability } from './authorizationContract.js';

/* === Catálogo extensível de ações confiáveis === */
const allContexts = ['search', 'wally', 'terminal', 'system'];
const definitions = [
  {
    id: 'app.open',
    description: 'Abrir aplicativo',
    params: { appId: 'id', params: 'record?' },
    capability: 'public.navigate',
    contexts: allContexts,
    confirmation: false,
    executor: 'core.open',
  },
  {
    id: 'content.search',
    description: 'Pesquisar conteúdo público',
    params: { query: 'text' },
    capability: 'public.search',
    contexts: allContexts,
    confirmation: false,
    executor: 'public.search',
  },
  {
    id: 'appearance.set-theme',
    description: 'Alterar tema',
    params: { theme: 'theme' },
    capability: 'preferences.update',
    contexts: allContexts,
    confirmation: false,
    executor: 'preferences.theme',
  },
  {
    id: 'personal-files.create-folder',
    description: 'Criar pasta pessoal',
    params: { name: 'name', parentId: 'id?' },
    capability: 'personal-files.write',
    contexts: allContexts,
    confirmation: false,
    executor: 'files.create-folder',
  },
  {
    id: 'personal-files.rename',
    description: 'Renomear arquivo pessoal',
    params: { fileId: 'id', name: 'name' },
    capability: 'personal-files.write',
    contexts: allContexts,
    confirmation: true,
    executor: 'files.rename',
  },
  {
    id: 'personal-files.trash',
    description: 'Mover arquivo pessoal para a lixeira',
    params: { fileId: 'id' },
    capability: 'personal-files.write',
    contexts: allContexts,
    confirmation: true,
    executor: 'files.trash',
  },
  {
    id: 'preferences.reset',
    description: 'Restaurar preferências',
    params: { categories: 'strings?' },
    capability: 'preferences.update',
    contexts: ['search', 'terminal', 'system'],
    confirmation: true,
    executor: 'preferences.reset',
  },
  {
    id: 'administration.open',
    description: 'Abrir Administração',
    params: {},
    capability: 'administration.access',
    contexts: ['search', 'terminal', 'system'],
    confirmation: false,
    executor: 'administration.open',
  },
];
const catalog = Object.freeze(
  definitions.map((value) =>
    Object.freeze({
      ...value,
      params: Object.freeze(value.params),
      contexts: Object.freeze([...value.contexts]),
    }),
  ),
);
export function getRegisteredActions() {
  return [...catalog];
}

/* === Validação de chamadas: respostas remotas não fornecem executores === */
export function validateActionRequest(
  request,
  { context, getApp, administrator = false, localBrowser = false } = {},
) {
  const fail = (code) => ({ ok: false, code });
  if (
    !isRecord(request) ||
    !isContractData(request) ||
    Object.keys(request).some((key) => !['id', 'params'].includes(key))
  )
    return fail('INVALID_ACTION_REQUEST');
  const action = catalog.find((item) => item.id === request.id);
  if (!action) return fail('ACTION_NOT_FOUND');
  if (!action.contexts.includes(context)) return fail('ACTION_CONTEXT_DENIED');
  const capability = checkCapability(action.capability, { administrator, localBrowser });
  if (!capability.ok) return capability;
  const params = request.params ?? {};
  if (!isRecord(params) || Object.keys(params).some((key) => !Object.hasOwn(action.params, key)))
    return fail('INVALID_ACTION_PARAMS');
  for (const [key, kind] of Object.entries(action.params)) {
    const value = params[key],
      optional = kind.endsWith('?'),
      type = kind.replace('?', '');
    if (value === undefined && optional) continue;
    const valid =
      type === 'id'
        ? validId(value)
        : type === 'record'
          ? isRecord(value)
          : type === 'theme'
            ? ['dark', 'light'].includes(value)
            : type === 'strings'
              ? Array.isArray(value) &&
                value.length <= 8 &&
                value.every((item) => validText(item, 80, 1))
              : type === 'name'
                ? validText(value, 255, 1) &&
                  !/[\\/]/.test(value) &&
                  !Array.from(value).some((char) => char.charCodeAt(0) < 32) &&
                  !['.', '..'].includes(value.trim())
                : validText(value, 1000, 2);
    if (!valid) return fail('INVALID_ACTION_PARAMS');
  }
  if (action.id === 'app.open' && (!getApp || !getApp(params.appId)?.public))
    return fail('ACTION_ACCESS_DENIED');
  return { ok: true, action, params: JSON.parse(JSON.stringify(params)) };
}

/* === Execução por adaptadores definidos pelo aplicativo === */
export async function executeRegisteredAction(request, options = {}) {
  let validation = validateActionRequest(request, options);
  if (!validation.ok) return validation;
  const { action } = validation;
  const executor = options.executors?.[action.executor];
  if (typeof executor !== 'function') return { ok: false, code: 'ACTION_UNAVAILABLE' };
  const approvedRequest = { id: action.id, params: JSON.parse(JSON.stringify(validation.params)) };
  if (action.confirmation) {
    if (typeof options.confirm !== 'function')
      return { ok: false, code: 'ACTION_CONFIRMATION_REQUIRED' };
    if ((await options.confirm(action, JSON.parse(JSON.stringify(validation.params)))) !== true)
      return { ok: false, code: 'ACTION_CANCELLED' };
    validation = validateActionRequest(approvedRequest, { ...options, ...options.getContext?.() });
    if (!validation.ok) return validation;
  }
  try {
    const result = await executor(validation.params);
    if (result === false) return { ok: false, code: 'ACTION_PENDING_OR_REJECTED' };
    if (result?.ok === false) return result;
    return { ok: true, actionId: action.id, result };
  } catch (error) {
    return { ok: false, code: error.code ?? 'ACTION_FAILED' };
  }
}

/* ----- Adaptação das sugestões legadas do Wally ----- */
export function adaptSuggestedAction(suggestion) {
  if (!isRecord(suggestion)) return null;
  if (
    suggestion.type === 'open-app' &&
    Object.keys(suggestion).every((key) => ['type', 'appId'].includes(key)) &&
    validId(suggestion.appId)
  )
    return { id: 'app.open', params: { appId: suggestion.appId } };
  if (typeof suggestion.id === 'string') return suggestion;
  return null;
}
