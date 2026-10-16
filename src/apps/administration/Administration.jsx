
import { useEffect, useState } from 'react';
import {
    verifyAdminSession,
    getAdminSessionExpiresAt,
} from '../../services/authService';
import '../../styles/apps.css';

export default function Administration() {
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        let active = true;
        let expirationTimer;

        async function checkAccess() {
            if (!active) return;

            setStatus('checking');
            clearTimeout(expirationTimer);

            const authorized = await verifyAdminSession();

            if (!active) return;

            if (!authorized) {
                setStatus('denied');
                return;
            }

            const expiresAt = getAdminSessionExpiresAt();

            if (!expiresAt || expiresAt <= Date.now()) {
                setStatus('denied');
                return;
            }

            setStatus('authorized');

            expirationTimer = setTimeout(() => {
                if (active) setStatus('denied');
            }, expiresAt - Date.now());
        }

        function handleVisibilityChange() {
            if (!document.hidden) {
                void checkAccess();
            }
        }

        function handleFocus() {
            void checkAccess();
        }

        void checkAccess();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            active = false;
            clearTimeout(expirationTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);


    if (status === 'checking') {
        return (
            <article className="desktop-window__content ws-app">
                <p>Verificando autorização administrativa...</p>
            </article>
        );
    }

    if (status === 'denied') {
        return (
            <article className="desktop-window__content ws-app">
                <h2>Acesso negado</h2>
                <p>
                    Sua sessão administrativa expirou ou não está autorizada.
                    Realize novamente o login pelo Terminal.
                </p>
            </article>
        );
    }

    return (
        <article className="desktop-window__content ws-app">
            <h2>Administração</h2>
            <p>Sessão administrativa verificada.</p>
            <p>
                O painel de gerenciamento será implementado nas próximas etapas.
            </p>
        </article>
    );
}
