import { useEffect, useState } from 'react';
import { portfolio, contentText } from '../../content/portfolioContent';
import { translate as t, useLocale } from '../../shared/i18n/i18n';
import { resolveDemo } from './demoModel';
import '../../styles/apps.css';
export default function DemoViewer({ instance }) {
  const locale = useLocale();
  const [attempt, setAttempt] = useState(0);
  const demo = resolveDemo(
    portfolio.projects,
    portfolio.demoOrigins,
    instance?.params?.projectId,
    instance?.params?.demoId,
  );
  /* ----- Estado por documento e tentativa; descarte do timeout ----- */
  const requestKey = JSON.stringify([demo?.url, attempt]);
  const [frame, setFrame] = useState({ key: '', status: 'loading' });
  const frameStatus = frame.key === requestKey ? frame.status : 'loading';
  const canEmbed = demo?.canEmbed === true;
  useEffect(() => {
    if (!canEmbed || frameStatus !== 'loading') return;
    const timeout = setTimeout(() => setFrame({ key: requestKey, status: 'error' }), 20000);
    return () => clearTimeout(timeout);
  }, [requestKey, canEmbed, frameStatus]);
  return (
    <article className="desktop-window__content ws-app">
      <h2>{t('Visualizador de Demos')}</h2>
      {!demo ? (
        <p role="status">{t('Demonstração não cadastrada ou endereço inválido.')}</p>
      ) : (
        <>
          <h3>{contentText(demo.title, locale)}</h3>
          <p>
            {t(
              {
                external: 'Demonstração externa',
                embedded: 'Demonstração incorporada',
                hosted: 'Demonstração hospedada',
                simulated: 'Demonstração simulada',
              }[demo.mode],
            )}
          </p>
          <p>
            <a href={demo.url} target="_blank" rel="noopener noreferrer">
              {t('Abrir em site externo')}
            </a>
          </p>
          {demo.canEmbed ? (
            <>
              <p>{t('O site pode impedir a incorporação. Se não aparecer, use o link externo.')}</p>
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                {t('Recarregar demonstração')}
              </button>
              {frameStatus === 'loading' && <p role="status">{t('Carregando')}</p>}
              {frameStatus === 'error' && (
                <p role="alert">
                  {t('O site pode impedir a incorporação. Se não aparecer, use o link externo.')}
                </p>
              )}
              <iframe
                key={requestKey}
                className="ws-app__demo"
                title={contentText(demo.title, locale) || t('Demonstração')}
                src={demo.url}
                onLoad={() => setFrame({ key: requestKey, status: 'ready' })}
                onError={() => setFrame({ key: requestKey, status: 'error' })}
                sandbox="allow-scripts allow-forms"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </>
          ) : (
            <p>{t('Esta demonstração abre externamente; incorporação não autorizada.')}</p>
          )}
        </>
      )}
    </article>
  );
}
