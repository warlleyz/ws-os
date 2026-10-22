import { useEffect, useState } from 'react';
import { executeJsonRequest } from '../../services/httpRequestContract';
import { subscribePublicData } from '../../services/publicDataService';
import { validateNoteAttachments } from '../../services/storage/noteAttachmentContract';
import { openApp } from '../../core/appManager';
import { useSystem } from '../../core/useSystem';
import { translate as t } from '../../shared/i18n/i18n';

/* === Anexos públicos: metadados e bytes mantêm autorização no servidor === */
export default function PostAttachments({ postId, instanceId }) {
  const { run } = useSystem();
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState({ id: postId, status: 'loading', attachments: [] });
  useEffect(
    () =>
      subscribePublicData(({ prefix }) => {
        if (prefix && '/api/posts/attachments'.startsWith(prefix)) setAttempt((value) => value + 1);
      }),
    [],
  );
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { response, payload } = await executeJsonRequest(
          '/api/posts/attachments?postId=' + encodeURIComponent(postId),
          { cache: 'no-store' },
          { signal: controller.signal },
        );
        const parsed = validateNoteAttachments(payload?.attachments);
        if (!response.ok || !parsed.ok) throw Error('ATTACHMENTS_UNAVAILABLE');
        if (!controller.signal.aborted)
          setResource({ id: postId, status: 'ready', attachments: parsed.attachments });
      } catch {
        if (!controller.signal.aborted)
          setResource({ id: postId, status: 'error', attachments: [] });
      }
    }
    void load();
    return () => controller.abort();
  }, [postId, attempt]);
  const current = resource.id === postId ? resource : { status: 'loading', attachments: [] };
  if (current.status === 'loading') return <p role="status">{t('Carregando anexos...')}</p>;
  if (current.status === 'error')
    return (
      <section aria-label={t('Anexos')}>
        <p role="alert">{t('Não foi possível carregar os anexos desta publicação.')}</p>
        <button
          type="button"
          onClick={() => {
            setResource({ id: postId, status: 'loading', attachments: [] });
            setAttempt((value) => value + 1);
          }}
        >
          {t('Tentar novamente')}
        </button>
      </section>
    );
  if (!current.attachments.length) return null;
  return (
    <section aria-label={t('Anexos')}>
      <h4>{t('Anexos')}</h4>
      <ul>
        {current.attachments.map((file) => (
          <li key={file.resourceId}>
            <button
              type="button"
              onClick={() =>
                run(openApp, 'file-viewer', {
                  origin: 'notes',
                  originInstanceId: instanceId,
                  params: {
                    url: '/api/files?id=' + encodeURIComponent(file.resourceId),
                    name: file.name,
                  },
                })
              }
            >
              {file.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
