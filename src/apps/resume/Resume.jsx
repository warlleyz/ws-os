import { useEffect, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { portfolio, contentText } from '../../content/portfolioContent';
import { openApp } from '../../core/appManager';
import { useSystem } from '../../core/useSystem';
import { resolveStaticFile } from '../../services/storage/staticFileCatalog';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import './Resume.css';

/* === Configuração do currículo === */
/* ----- Documento oficial ----- */
const RESUME_CATALOG_ID = 'curriculo';
const RESUME_RESOURCE = resolveStaticFile(RESUME_CATALOG_ID);
const RESUME_URL = RESUME_RESOURCE.ok ? RESUME_RESOURCE.resource.url : null;

/* === Aplicativo Currículo === */
export default function Resume({ instance }) {
  const locale = useLocale();
  const { run } = useSystem();

  /* ----- Estado do documento ----- */
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ attempt: -1, status: 'unavailable' });
  const status = !RESUME_URL
    ? 'unavailable'
    : result.attempt === attempt
      ? result.status
      : 'loading';

  /* === Disponibilidade do currículo === */
  /* ----- Verificação do documento oficial ----- */
  useEffect(() => {
    if (!RESUME_URL) return;

    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function checkResume() {
      try {
        const response = await fetch(RESUME_URL, {
          method: 'HEAD',
          redirect: 'error',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        });

        const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

        const available = response.ok && contentType.split(';')[0].trim() === 'application/pdf';

        if (active && !controller.signal.aborted) {
          setResult({ attempt, status: available ? 'available' : 'unavailable' });
        }
      } catch {
        if (active) {
          setResult({ attempt, status: 'unavailable' });
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    checkResume();

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  /* === Navegação === */
  /* ----- Abertura no Visualizador de Arquivos ----- */
  function openViewer() {
    if (status !== 'available') return;

    run(openApp, 'file-viewer', {
      origin: 'resume',
      ...(instance?.id ? { originInstanceId: instance.id } : {}),
      params: {
        resource: {
          source: 'static',
          catalogId: RESUME_CATALOG_ID,
        },
      },
    });
  }

  /* === Interface do aplicativo === */
  return (
    <section className="desktop-window__content ws-app ws-resume">
      {/* ----- Apresentação ----- */}
      <header className="ws-resume__header">
        <h2>{t('Currículo')}</h2>
        <p>{t('Visualização e download do currículo profissional.')}</p>
      </header>

      {/* ----- Informações profissionais ----- */}
      <div className="ws-resume__sections">
        {portfolio.resume.sections.map((section) => (
          <section key={section.id} className="ws-resume__section">
            <h3>{contentText(section.title, locale)}</h3>

            {section.items.map((item, index) => (
              <div key={index} className="ws-resume__item">
                <h4>{contentText(item.title, locale)}</h4>
                <p>{contentText(item.description, locale)}</p>
                <small>{t(contentText(item.period, locale))}</small>
              </div>
            ))}
          </section>
        ))}
      </div>

      {/* ----- Verificação de disponibilidade ----- */}
      {status === 'loading' && <p role="status">{t('Carregando')}</p>}

      {/* ----- Documento indisponível ----- */}
      {status === 'unavailable' && (
        <div className="ws-resume__empty" role="status">
          <FileText size={36} aria-hidden="true" />

          <h3>{t('Documento indisponível')}</h3>

          <p>{t('O currículo ainda não está disponível para visualização.')}</p>
          {RESUME_URL && (
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              {t('Tentar novamente')}
            </button>
          )}
        </div>
      )}

      {/* ----- Ações do documento ----- */}
      {status === 'available' && (
        <div className="ws-resume__actions">
          <button type="button" onClick={openViewer}>
            <Eye size={18} aria-hidden="true" />
            {t('Visualizar currículo')}
          </button>

          <a href={RESUME_URL} download="curriculo.pdf">
            <Download size={18} aria-hidden="true" />
            {t('Baixar currículo')}
          </a>
        </div>
      )}
    </section>
  );
}
