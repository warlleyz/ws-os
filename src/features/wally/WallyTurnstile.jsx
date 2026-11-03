
import { translate as t, useLocale } from '../../shared/i18n/i18n';

import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'ws-wally-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const LOAD_TIMEOUT = 15000;

export default function WallyTurnstile({ onTokenChange, action = 'wally' }) {
  useLocale();

  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbackRef = useRef(onTokenChange);

  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  /* === Carregamento e recuperação do Turnstile === */
  useEffect(() => {
    if (!siteKey) return undefined;

    let disposed = false;
    let failed = false;
    let retryTimer;
    let timeoutTimer;
    let observer;

    /* ----- Encerramento da espera ----- */
    function stopWaiting() {
      window.clearTimeout(retryTimer);
      window.clearTimeout(timeoutTimer);
    }

    /* ----- Falha de carregamento ----- */
    function failLoading() {
      if (disposed || failed || widgetIdRef.current !== null) return;

      failed = true;
      stopWaiting();

      callbackRef.current?.(null);
      setError(true);
    }

    /* ----- Inicialização do widget ----- */
    function mountWidget() {
      if (disposed || failed || !containerRef.current) return;

      if (!window.turnstile) {
        retryTimer = window.setTimeout(mountWidget, 100);
        return;
      }

      if (widgetIdRef.current !== null) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: 'auto',
          size: 'flexible',

          callback(token) {
            callbackRef.current?.(token);
            setError(false);
          },

          'expired-callback'() {
            callbackRef.current?.(null);

            if (widgetIdRef.current !== null) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },

          'timeout-callback'() {
            callbackRef.current?.(null);
          },

          'error-callback'() {
            callbackRef.current?.(null);
            setError(true);
          },
        });

        stopWaiting();
      } catch {
        failLoading();
      }
    }

    /* ----- Carregamento do script compartilhado ----- */
    let script = document.getElementById(SCRIPT_ID);

    if (!script) {
      script = document.createElement('script');

      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);
    }

    script.addEventListener('error', failLoading);

    timeoutTimer = window.setTimeout(failLoading, LOAD_TIMEOUT);

    mountWidget();

    observer = new MutationObserver(() => {
      if (window.turnstile) {
        mountWidget();
      }
    });

    observer.observe(document.head, {
      childList: true,
    });

    /* ----- Limpeza da instância ----- */
    return () => {
      disposed = true;

      stopWaiting();
      script.removeEventListener('error', failLoading);
      observer.disconnect();

      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
      callbackRef.current?.(null);
    };
  }, [siteKey, action, attempt]);

  /* === Estado sem configuração === */
  if (!siteKey) {
    return (
      <p className="ws-wally__verification-info">
        {t('Verificação de segurança não configurada.')}
      </p>
    );
  }

  /* === Interface de verificação === */
  return (
    <div className="ws-wally__verification">
      <div ref={containerRef} />

      {error && (
        <div role="alert">
          <p>{t('Não foi possível concluir a verificação.')}</p>

          <button
            type="button"
            onClick={() => {
              callbackRef.current?.(null);
              setError(false);

              if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current);
              } else {
                if (!window.turnstile) {
                  document.getElementById(SCRIPT_ID)?.remove();
                }

                setAttempt((value) => value + 1);
              }
            }}
          >
            {t('Tentar novamente')}
          </button>
        </div>
      )}
    </div>
  );
}
