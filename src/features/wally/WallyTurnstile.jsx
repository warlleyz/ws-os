
import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'ws-wally-turnstile-script';
const SCRIPT_URL =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function WallyTurnstile({
    onTokenChange,
}) {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const callbackRef = useRef(onTokenChange);

    const [error, setError] = useState(false);

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    useEffect(() => {
        callbackRef.current = onTokenChange;
    }, [onTokenChange]);

    useEffect(() => {
        if (!siteKey) return undefined;

        let disposed = false;
        let retryTimer;
        let observer;

        function mountWidget() {
            if (disposed || !containerRef.current) return;

            if (!window.turnstile) {
                retryTimer = window.setTimeout(mountWidget, 100);
                return;
            }

            if (widgetIdRef.current !== null) return;

            try {
                widgetIdRef.current = window.turnstile.render(
                    containerRef.current,
                    {
                        sitekey: siteKey,
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
                    },
                );
            } catch {
                setError(true);
            }
        }

        if (!document.getElementById(SCRIPT_ID)) {
            const script = document.createElement('script');

            script.id = SCRIPT_ID;
            script.src = SCRIPT_URL;
            script.async = true;
            script.defer = true;

            document.head.appendChild(script);
        }

        mountWidget();

        observer = new MutationObserver(() => {
            if (window.turnstile) {
                mountWidget();
            }
        });

        observer.observe(document.head, {
            childList: true,
        });

        return () => {
            disposed = true;
            window.clearTimeout(retryTimer);
            observer.disconnect();

            if (
                widgetIdRef.current !== null &&
                window.turnstile
            ) {
                window.turnstile.remove(widgetIdRef.current);
            }

            widgetIdRef.current = null;
            callbackRef.current?.(null);
        };
    }, [siteKey]);

    if (!siteKey) {
        return (
            <p className="ws-wally__verification-info">
                Verificação de segurança não configurada.
            </p>
        );
    }

    return (
        <div className="ws-wally__verification">
            <div ref={containerRef} />

            {error && (
                <div role="alert">
                    <p>
                        Não foi possível concluir a verificação.
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            setError(false);
                            callbackRef.current?.(null);

                            if (
                                widgetIdRef.current !== null &&
                                window.turnstile
                            ) {
                                window.turnstile.reset(widgetIdRef.current);
                            }
                        }}
                    >
                        Tentar novamente
                    </button>
                </div>
            )}
        </div>
    );
}
