import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { portfolio } from '../../content/portfolioContent';
import { fetchGithubPortfolio } from '../../services/githubService';
import {
  getAdminAccessToken,
  createAdminRequestScope,
  getAdminSessionVersion,
  invalidateAdminSession,
} from '../../services/authService';
import { executeJsonRequest } from '../../services/httpRequestContract';
import { invalidatePublicData } from '../../services/publicDataService';
import useUnsavedChanges from '../../shared/hooks/useUnsavedChanges';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { validRepositoryIds } from '../../shared/utils/contractValidation';
import './AdminProjects.css';

/* === Administração dos destaques de Projetos === */
export default function AdminProjects({ instanceId, authorized }) {
  useLocale();
  const [repositories, setRepositories] = useState([]);
  const [saved, setSaved] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('idle');
  const [busy, setBusy] = useState(false);
  const savingRef = useRef(false);
  const [message, setMessage] = useState('');
  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...saved].sort());
  useUnsavedChanges(instanceId, dirty || busy);

  /* ----- Solicitações administrativas vinculadas à sessão ----- */
  const request = useCallback(async (method, body, signal) => {
    const token = getAdminAccessToken();
    const version = getAdminSessionVersion();
    if (!token) throw Error('Sessão administrativa indisponível.');
    const scope = createAdminRequestScope(signal);
    if (!scope.ok) throw Error('Sessão administrativa indisponível.');
    try {
      const { response, payload } = await executeJsonRequest(
        '/api/admin/project-highlights',
        {
          method,
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
        { operation: method === 'GET' ? 'read' : 'write', signal: scope.signal },
      );
      if ([401, 403].includes(response.status)) invalidateAdminSession(version);
      if (!scope.isCurrent()) throw Error('Sessão administrativa alterada.');
      if (!response.ok || !validRepositoryIds(payload?.repositoryIds)) {
        throw Error(
          response.status === 409
            ? 'Os destaques mudaram no servidor. Atualize a lista.'
            : 'Não foi possível carregar ou salvar os destaques.',
        );
      }
      return payload;
    } finally {
      scope.dispose();
    }
  }, []);

  /* ----- Catálogo real do GitHub e seleção persistida ----- */
  const refresh = useCallback(
    async (signal) => {
      setStatus('loading');
      setMessage('');
      try {
        const [github, selection] = await Promise.all([
          fetchGithubPortfolio(portfolio.githubUser, { signal }),
          request('GET', undefined, signal),
        ]);
        if (signal.aborted) return;
        setRepositories(github.data.repositories);
        setSaved(selection.repositoryIds);
        setSelected(selection.repositoryIds);
        setStatus('ready');
      } catch (error) {
        if (!signal.aborted) {
          setStatus('error');
          setMessage(error.message);
        }
      }
    },
    [request],
  );

  useEffect(() => {
    if (!authorized) {
      return undefined;
    }
    const controller = new AbortController();
    /* ----- Iniciar a consulta fora da execução síncrona do efeito ----- */
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) return refresh(controller.signal);
    });
    return () => controller.abort();
  }, [authorized, refresh]);

  const shown = useMemo(
    () =>
      repositories.filter((item) =>
        `${item.name} ${item.description}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      ),
    [repositories, search],
  );

  function toggle(id) {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  }

  async function save() {
    if (!authorized || savingRef.current || status !== 'ready' || !dirty) return;
    savingRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      const input = { repositoryIds: selected };
      if (!validRepositoryIds(selected)) throw Error('Resposta inválida dos projetos destacados.');
      if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 16000)
        throw Error('As configurações excedem o limite de 16000 bytes.');
      const result = await request('PUT', input);
      setSaved(result.repositoryIds);
      setSelected(result.repositoryIds);
      invalidatePublicData('/api/project-highlights');
      setMessage('Destaques salvos no servidor.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      savingRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="ws-admin-projects">
      <h3>{t('Projetos em destaque')}</h3>
      <p>
        {t(
          'Selecione os repositórios que terão destaque no portfólio. Os demais dados continuam vindo do GitHub.',
        )}
      </p>
      <div className="ws-admin-projects__toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('Pesquisar projetos')}
          aria-label={t('Pesquisar projetos')}
          disabled={!authorized || busy}
        />
        <button
          type="button"
          disabled={!authorized || busy || status === 'loading' || dirty}
          onClick={() => {
            const controller = new AbortController();
            void refresh(controller.signal);
          }}
        >
          {t('Atualizar lista')}
        </button>
        <button
          type="button"
          disabled={!authorized || busy || status !== 'ready' || !dirty}
          onClick={save}
        >
          {t('Salvar')}
        </button>
      </div>
      <p role="status">
        {t(message) ||
          (status === 'loading'
            ? t('Carregando dados públicos…')
            : `${selected.length} ${t('Projetos em destaque')}`)}
      </p>
      {status === 'ready' && (
        <ul className="ws-admin-projects__list">
          {shown.map((item) => (
            <li key={item.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                  disabled={!authorized || busy}
                />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.description || item.repository}</small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
