import { getAppDefinition } from '../core/appRegistry';
import { openApp } from '../core/appManager';
import { setTheme } from '../core/themeManager';
import { restoreSystemPreferences } from '../core/preferencesManager';
import { executeRegisteredAction, adaptSuggestedAction } from '../core/actionContract';
import { translate as t } from '../shared/i18n/i18n';
import { createLocalFolder, changeLocalFile } from './storage/localFilesStorage';
import { isAdminAuthenticated } from './authService';

/* === Adaptadores locais: sem execução de código vindo de texto === */
export function executeSystemAction(
  request,
  {
    run,
    context = 'system',
    origin = 'system',
    originInstanceId,
    onOpen,
    searchPublic,
    confirm,
  } = {},
) {
  const getContext = () => ({ administrator: isAdminAuthenticated(), localBrowser: true });
  return executeRegisteredAction(request, {
    context,
    getApp: getAppDefinition,
    ...getContext(),
    getContext,
    confirm: confirm ?? ((action) => window.confirm(t(action.description) + '?')),
    executors: {
      'core.open': ({ appId, params = {} }) =>
        onOpen
          ? onOpen(appId, params)
          : (run?.(openApp, appId, {
              origin,
              params,
              ...(originInstanceId ? { originInstanceId } : {}),
            }) ?? false),
      'public.search': ({ query }) =>
        typeof searchPublic === 'function'
          ? searchPublic(query)
          : { ok: false, code: 'ACTION_UNAVAILABLE' },
      'preferences.theme': ({ theme }) => {
        const saved = setTheme(theme);
        return { ok: true, persisted: saved };
      },
      'files.create-folder': ({ name, parentId }) => createLocalFolder(name, parentId ?? null),
      'files.rename': ({ fileId, name }) => changeLocalFile({ type: 'rename', id: fileId, name }),
      'files.trash': ({ fileId }) => changeLocalFile({ type: 'trash', id: fileId }),
      'preferences.reset': ({ categories }) => restoreSystemPreferences(categories),
      'administration.open': () => run?.(openApp, 'administration', { origin }) ?? false,
    },
  });
}

export function executeSuggestedAction(suggestion, options) {
  const request = adaptSuggestedAction(suggestion);
  return request
    ? executeSystemAction(request, { ...options, context: 'wally' })
    : Promise.resolve({ ok: false, code: 'INVALID_ACTION_REQUEST' });
}
