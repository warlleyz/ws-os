import { invalidatePublicData } from '../../services/publicDataService';
import { useEffect, useRef, useState } from 'react';
import {
  getAdminAccessToken,
  createAdminRequestScope,
  getAdminSessionVersion,
  invalidateAdminSession,
  subscribeAdminSession,
} from '../../services/authService';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import { translate as t, useLocale } from '../../shared/i18n/i18n';

const empty = () => ({ title: '', description: '', date: '', url: '' });
export default function AdminContent({ kind, instanceId, authorized }) {
  useLocale();
  const [items, setItems] = useState([]),
    [draft, setDraft] = useState(null),
    [baseline, setBaseline] = useState(''),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const controllerRef = useRef(null),
    mutation = useRef(false);
  const dirty = !!draft && JSON.stringify(draft) !== baseline;
  useUnsavedChanges(instanceId, dirty || busy);
  useEffect(() => () => controllerRef.current?.abort(), []);
  async function request(method = 'GET', body, signal) {
    const version = getAdminSessionVersion(),
      token = getAdminAccessToken();
    if (!token) throw Error(t('Sessão administrativa indisponível.'));
    const scope = createAdminRequestScope(signal);
    if (!scope.ok) throw Error(t('Sessão administrativa indisponível.'));
    try {
      const response = await fetch('/api/admin/content?kind=' + kind, {
        method,
        cache: 'no-store',
        signal: scope.signal,
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if ([401, 403].includes(response.status)) invalidateAdminSession(version);
      const result = await response.json();
      if (!scope.isCurrent() || version !== getAdminSessionVersion())
        throw Error(t('A sessão foi alterada.'));
      if (!response.ok)
        throw Error(
          t(
            response.status === 409
              ? 'O conteúdo mudou em outra janela. Atualize a lista.'
              : 'Não foi possível concluir a operação.',
          ),
        );
      if (!Array.isArray(result.items)) throw Error(t('Resposta inválida do servidor.'));
      return result.items;
    } finally {
      scope.dispose();
    }
  }
  async function load() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setMessage('');
    try {
      const rows = await request('GET', null, controller.signal);
      if (!controller.signal.aborted) setItems(rows);
    } catch (error) {
      if (!controller.signal.aborted) setMessage(error.message);
    }
  }
  useEffect(
    () =>
      subscribeAdminSession(() => {
        controllerRef.current?.abort();
        setItems([]);
      }),
    [],
  );
  useEffect(() => {
    if (!authorized) controllerRef.current?.abort();
  }, [authorized]);
  function edit(item) {
    if (dirty && !window.confirm(t('Descartar alterações não salvas?'))) return;
    const value = item?.data ?? empty();
    setSelected(item ?? null);
    setDraft(value);
    setBaseline(JSON.stringify(value));
    setMessage('');
  }
  async function change(event, status, remove = false) {
    event?.preventDefault();
    if (mutation.current || !authorized) return;
    if (remove && !window.confirm(t('Excluir este conteúdo definitivamente?'))) return;
    mutation.current = true;
    setBusy(true);
    setMessage('');
    try {
      await request(remove ? 'DELETE' : selected ? 'PATCH' : 'POST', {
        id: selected?.id ?? crypto.randomUUID(),
        updatedAt: selected?.updatedAt,
        status: status ?? selected?.status ?? 'draft',
        data: draft,
      });
      setDraft(null);
      setSelected(null);
      setBaseline('');
      setMessage(t('Alterações salvas.'));
      invalidatePublicData('/api/content');
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="ws-admin-content">
      <div className="ws-app__actions">
        <button disabled={!authorized || busy} onClick={load}>
          {t('Atualizar lista')}
        </button>
        <button disabled={!authorized || busy} onClick={() => edit(null)}>
          {t('Novo conteúdo')}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {!items.length && (
        <p>{t('Nenhum conteúdo carregado. Atualize a lista para consultar o servidor.')}</p>
      )}
      <ul>
        {(authorized ? items : []).map((item) => (
          <li key={item.id}>
            <button disabled={!authorized || busy} onClick={() => edit(item)}>
              {item.data.title} · {t(item.status === 'published' ? 'Publicado' : 'Rascunho')}
            </button>
          </li>
        ))}
      </ul>
      {draft && (
        <form onSubmit={change}>
          <fieldset disabled={!authorized || busy}>
            <label>
              {t('Título')}
              <input
                value={draft.title}
                maxLength={160}
                required
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label>
              {t('Descrição')}
              <textarea
                value={draft.description}
                maxLength={2000}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            {kind === 'events' && (
              <label>
                {t('Data')}
                <input
                  type="date"
                  required
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </label>
            )}
            <label>
              {kind === 'files' ? t('Caminho do arquivo versionado') : t('Link público (opcional)')}
              <input
                value={draft.url}
                required={kind === 'files'}
                maxLength={2048}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
            </label>
            {kind === 'files' && (
              <p>
                {t(
                  'Use um arquivo existente em documents/ ou certificates/. O catálogo não envia arquivos pessoais.',
                )}
              </p>
            )}
            <button type="submit">{t('Salvar')}</button>
            <button
              type="button"
              onClick={(e) => change(e, selected?.status === 'published' ? 'draft' : 'published')}
            >
              {t(selected?.status === 'published' ? 'Despublicar' : 'Publicar')}
            </button>
            {selected && (
              <button type="button" onClick={(e) => change(e, null, true)}>
                {t('Excluir')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (!dirty || window.confirm(t('Descartar alterações não salvas?'))) setDraft(null);
              }}
            >
              {t('Cancelar')}
            </button>
          </fieldset>
        </form>
      )}
      {!authorized && draft && (
        <p role="alert">{t('Sessão encerrada. Copie seu rascunho antes de fechar.')}</p>
      )}
    </div>
  );
}
