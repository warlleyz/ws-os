import { portfolio, contentText } from '../../content/portfolioContent';
import { publicAssetUrl } from '../../shared/utils/urls';

import { useEffect, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import './Resume.css';

import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { useSystem } from '../../core/useSystem';
import { openApp } from '../../core/appManager';

const RESUME_URL = publicAssetUrl(portfolio.resume.url);

export default function Resume() {
  const locale = useLocale();

  const { run } = useSystem();
  const [status, setStatus] = useState(RESUME_URL ? 'loading' : 'unavailable');

  useEffect(() => {
    if (!RESUME_URL) return;
    const controller = new AbortController();

    async function checkResume() {
      try {
        const response = await fetch(RESUME_URL, {
          method: 'HEAD',
          signal: controller.signal,
        });

        const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

        if (!controller.signal.aborted) {
          setStatus(
            response.ok && contentType.includes('application/pdf') ? 'available' : 'unavailable',
          );
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus('unavailable');
        }
      }
    }

    checkResume();

    return () => controller.abort();
  }, []);

  function openViewer() {
    if (status !== 'available') return;

    run(openApp, 'file-viewer', {
      origin: 'resume',
      params: {
        url: RESUME_URL,
        name: 'Currículo profissional',
      },
    });
  }

  return (
    <section className="desktop-window__content">
      <header>
        <h2>{t('Currículo')}</h2>
        <p>{t('Visualização e download do currículo profissional.')}</p>
      </header>

      {portfolio.resume.sections.map((section) => (
        <section key={section.id}>
          <h3>{contentText(section.title, locale)}</h3>
          {section.items.map((item, index) => (
            <div key={index}>
              <h4>{contentText(item.title, locale)}</h4>
              <p>{contentText(item.description, locale)}</p>
              <small>{item.period}</small>
            </div>
          ))}
        </section>
      ))}

      {status === 'loading' && <p role="status">{t('Carregando')}</p>}

      {status === 'unavailable' && (
        <div role="status">
          <FileText size={36} aria-hidden="true" />
          <h3>{t('Documento indisponível')}</h3>
          <p>{t('O currículo ainda não está disponível para visualização.')}</p>
        </div>
      )}

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
